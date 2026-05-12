import prisma from "../../../lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { getClientIp } from "../../../lib/auth-helpers";
import { writeAuditLog } from "../../../lib/audit";

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_WINDOW_MINUTES = 15;
const INVALID_LOGIN_MESSAGE = "Username atau password salah";

export async function POST(req) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const ipAddress = getClientIp(req);

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const blockSince = new Date(
      Date.now() - BLOCK_WINDOW_MINUTES * 60 * 1000
    );

    const recentFailedAttempts = await prisma.loginAttempt.count({
      where: {
        username,
        success: false,
        createdAt: {
          gte: blockSince,
        },
      },
    });

    if (recentFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      await writeAuditLog(req, {
        username,
        action: "LOGIN_BLOCKED",
        entity: "AUTH",
        description:
          "Login diblok sementara karena terlalu banyak percobaan gagal",
      });

      return NextResponse.json(
        {
          error:
            "Terlalu banyak percobaan login gagal. Coba lagi 15 menit lagi.",
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      await prisma.loginAttempt.create({
        data: {
          username,
          ipAddress,
          success: false,
        },
      });

      await writeAuditLog(req, {
        username,
        action: "LOGIN_FAILED",
        entity: "AUTH",
        description: "Login gagal",
      });

      return NextResponse.json(
        { error: INVALID_LOGIN_MESSAGE },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      await prisma.loginAttempt.create({
        data: {
          username,
          ipAddress,
          userId: user.id,
          success: false,
        },
      });

      await writeAuditLog(req, {
        userId: user.id,
        username: user.username,
        action: "LOGIN_FAILED",
        entity: "AUTH",
        description: "Akun nonaktif mencoba login",
      });

      return NextResponse.json(
        { error: "Akun nonaktif. Hubungi administrator." },
        { status: 403 }
      );
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      await prisma.loginAttempt.create({
        data: {
          username,
          ipAddress,
          userId: user.id,
          success: false,
        },
      });

      await writeAuditLog(req, {
        userId: user.id,
        username: user.username,
        action: "LOGIN_FAILED",
        entity: "AUTH",
        description: "Login gagal",
      });

      return NextResponse.json(
        { error: INVALID_LOGIN_MESSAGE },
        { status: 401 }
      );
    }

    await prisma.loginAttempt.create({
      data: {
        username,
        ipAddress,
        userId: user.id,
        success: true,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await writeAuditLog(req, {
      userId: user.id,
      username: user.username,
      action: "LOGIN_SUCCESS",
      entity: "AUTH",
      description: "Login berhasil",
    });

    const token = createToken(user);

    const res = NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}