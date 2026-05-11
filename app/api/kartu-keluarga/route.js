import prisma from "../../../lib/db";
import { requireRoles, requireUser } from "../../../lib/auth-helpers";
import { writeAuditLog } from "../../../lib/audit";

function validateKK(body, isUpdate = false) {
  if (isUpdate && !body.id) return "ID KK wajib ada";
  if (!body.noKK || !/^\d{16}$/.test(body.noKK)) return "No. KK harus 16 digit";
  if (!body.rt) return "RT wajib diisi";
  if (!body.alamat) return "Alamat wajib diisi";
  return null;
}

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const kk = await prisma.kartuKeluarga.findUnique({
        where: { id },
        include: {
          anggota: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!kk) {
        return Response.json({ error: "KK tidak ditemukan" }, { status: 404 });
      }
      return Response.json(kk);
    }

    const data = await prisma.kartuKeluarga.findMany({
      include: {
        anggota: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(data);
  } catch (error) {
    console.error("GET KK ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner", "staff"]);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const errorMsg = validateKK(body);
    if (errorMsg) {
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    const existing = await prisma.kartuKeluarga.findUnique({
      where: { noKK: body.noKK },
    });

    if (existing) {
      return Response.json({ error: "No. KK sudah terdaftar" }, { status: 400 });
    }

    const kk = await prisma.kartuKeluarga.create({
      data: {
        noKK: body.noKK,
        rt: body.rt,
        alamat: body.alamat,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "CREATE",
      entity: "KartuKeluarga",
      entityId: kk.id,
      description: `Membuat KK baru: ${kk.noKK}`,
      newValues: kk,
    });

    return Response.json(kk, { status: 201 });
  } catch (error) {
    console.error("POST KK ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner", "staff"]);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const errorMsg = validateKK(body, true);
    if (errorMsg) {
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    const oldData = await prisma.kartuKeluarga.findUnique({
      where: { id: body.id },
    });

    if (!oldData) {
      return Response.json({ error: "Data KK tidak ditemukan" }, { status: 404 });
    }

    if (body.noKK !== oldData.noKK) {
      const existing = await prisma.kartuKeluarga.findUnique({
        where: { noKK: body.noKK },
      });
      if (existing) {
        return Response.json({ error: "No. KK sudah terdaftar untuk keluarga lain" }, { status: 400 });
      }
    }

    const updated = await prisma.kartuKeluarga.update({
      where: { id: body.id },
      data: {
        noKK: body.noKK,
        rt: body.rt,
        alamat: body.alamat,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "UPDATE",
      entity: "KartuKeluarga",
      entityId: updated.id,
      description: `Mengubah data KK: ${updated.noKK}`,
      oldValues: oldData,
      newValues: updated,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PUT KK ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner", "staff"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID KK wajib diisi" }, { status: 400 });
    }

    const oldData = await prisma.kartuKeluarga.findUnique({
      where: { id },
    });

    if (!oldData) {
      return Response.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    await prisma.kartuKeluarga.delete({
      where: { id },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "DELETE",
      entity: "KartuKeluarga",
      entityId: id,
      description: `Menghapus KK: ${oldData.noKK}`,
      oldValues: oldData,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE KK ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
