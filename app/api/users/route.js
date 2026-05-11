import prisma from "../../../lib/db";
import bcrypt from "bcrypt";
import { verifyToken } from "../../../lib/auth";

export const dynamic = "force-dynamic";

function getUser(req) {
  const cookie = req.headers.get("cookie") || "";

  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  return verifyToken(token);
}

function canManageUsers(user) {
  return user?.role === "developer" || user?.role === "owner";
}

function canAssignRole(actor, targetRole) {
  if (!actor || !targetRole) return false;

  if (actor.role === "developer") {
    return ["developer", "owner", "staff"].includes(targetRole);
  }

  if (actor.role === "owner") {
    return ["owner", "staff"].includes(targetRole);
  }

  return false;
}

const userSelect = {
  id: true,
  username: true,
  phone: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

export async function GET(req) {
  try {
    const user = getUser(req);

    if (!canManageUsers(user)) {
      return Response.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    return Response.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUser(req);

    if (!canManageUsers(user)) {
      return Response.json(
        { error: "Tidak punya akses" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.username || !body.password || !body.phone || !body.role) {
      return Response.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Validasi kekuatan password
    if (body.password.length < 8) {
      return Response.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(body.password)) {
      return Response.json(
        { error: "Password harus mengandung minimal 1 huruf kapital" },
        { status: 400 }
      );
    }
    if (!/[0-9]/.test(body.password)) {
      return Response.json(
        { error: "Password harus mengandung minimal 1 angka" },
        { status: 400 }
      );
    }

    if (!canAssignRole(user, body.role)) {
      return Response.json(
        { error: "Tidak boleh membuat role ini" },
        { status: 403 }
      );
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: body.username.trim(),
        password: hashed,
        phone: String(body.phone).trim(),
        role: body.role,
        isActive: body.isActive ?? true,
      },
      select: userSelect,
    });

    return Response.json(newUser);
  } catch (err) {
    console.error("POST USER ERROR:", err);

    if (err.code === "P2002") {
      return Response.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    return Response.json({ error: "Gagal tambah user" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = getUser(req);

    if (!canManageUsers(user)) {
      return Response.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "ID wajib ada" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id: body.id },
      select: { id: true, role: true },
    });

    if (!existing) {
      return Response.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (user.role === "owner" && existing.role === "developer") {
      return Response.json(
        { error: "Owner tidak boleh mengubah akun developer" },
        { status: 403 }
      );
    }

    if (body.role && !canAssignRole(user, body.role)) {
      return Response.json(
        { error: "Tidak boleh ubah ke role tersebut" },
        { status: 403 }
      );
    }

    const updateData = {
      username: body.username?.trim(),
      phone: body.phone ? String(body.phone).trim() : undefined,
      role: body.role,
      isActive:
        typeof body.isActive === "boolean" ? body.isActive : undefined,
    };

    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updated = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
      select: userSelect,
    });

    return Response.json(updated);
  } catch (err) {
    console.error("PUT USER ERROR:", err);

    if (err.code === "P2002") {
      return Response.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    return Response.json({ error: "Gagal update user" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = getUser(req);

    if (!canManageUsers(user)) {
      return Response.json(
        { error: "Akses ditolak" },
        { status: 403 }
      );
    }

    const { id } = await req.json();

    if (!id) {
      return Response.json(
        { error: "ID wajib ada" },
        { status: 400 }
      );
    }

    if (user.id === id) {
      return Response.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      return Response.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    if (user.role === "owner" && existing.role === "developer") {
      return Response.json(
        { error: "Owner tidak boleh menghapus akun developer" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    return Response.json({ error: "Gagal hapus user" }, { status: 500 });
  }
}