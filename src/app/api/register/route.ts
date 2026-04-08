import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah digunakan, gunakan email lain" },
        { status: 409 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        password_hash: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "User berhasil dibuat",
        user: { id: newUser.id, email: newUser.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saat register:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat membuat user" },
      { status: 500 },
    );
  }
}
