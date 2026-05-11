import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth-helpers";
import prisma from "../../../lib/db";
import bcrypt from "bcryptjs";
import { writeAuditLog } from "../../../lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (!auth.ok) return auth.response;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { username, phone, oldPassword, newPassword } = body;

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const updateData = {};
    const oldValues = { username: currentUser.username, phone: currentUser.phone };
    const newValues = {};

    if (username && username !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
      }
      updateData.username = username;
      newValues.username = username;
    }

    if (phone && phone !== currentUser.phone) {
      updateData.phone = phone;
      newValues.phone = phone;
    }

    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json({ error: "Password lama wajib diisi" }, { status: 400 });
      }

      const isMatch = await bcrypt.compare(oldPassword, currentUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
      newValues.passwordChanged = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Tidak ada data yang diubah" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: updatedUser.username,
      action: "UPDATE_PROFILE",
      entity: "USER",
      entityId: updatedUser.id,
      description: `User ${updatedUser.username} memperbarui profil`,
      oldValues,
      newValues,
    });

    return NextResponse.json({ message: "Profil berhasil diperbarui", user: updatedUser });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
