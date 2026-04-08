import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const rateLimitMap = new Map();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const limit = 5;
    const windowMs = 60 * 1000;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, {
        count: 1,
        timer: setTimeout(() => rateLimitMap.delete(ip), windowMs),
      });
    } else {
      const rateData = rateLimitMap.get(ip);
      if (rateData.count >= limit) {
        return NextResponse.json(
          {
            error: "Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.",
          },
          { status: 429 },
        );
      }
      rateData.count += 1;
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    if (rateLimitMap.has(ip)) {
      clearTimeout(rateLimitMap.get(ip).timer);
      rateLimitMap.delete(ip);
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const response = NextResponse.json(
      { message: "Login berhasil" },
      { status: 200 },
    );
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
