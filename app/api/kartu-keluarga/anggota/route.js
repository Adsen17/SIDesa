import prisma from "../../../../lib/db";
import { requireRoles, requireUser } from "../../../../lib/auth-helpers";
import { writeAuditLog } from "../../../../lib/audit";

export async function POST(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner", "staff"]);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();
    const { wargaId, kkId, hubunganKeluarga } = body;

    if (!wargaId || !kkId || !hubunganKeluarga) {
      return Response.json({ error: "Data warga, KK, dan hubungan wajib diisi" }, { status: 400 });
    }

    // Check if warga exists
    const warga = await prisma.warga.findUnique({ where: { id: wargaId } });
    if (!warga) {
      return Response.json({ error: "Warga tidak ditemukan" }, { status: 404 });
    }

    // Update
    const updated = await prisma.warga.update({
      where: { id: wargaId },
      data: {
        kkId,
        hubunganKeluarga,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "UPDATE",
      entity: "KartuKeluarga",
      entityId: kkId,
      description: `Menambahkan anggota KK: ${warga.nama} sebagai ${hubunganKeluarga}`,
      oldValues: { kkId: warga.kkId, hubunganKeluarga: warga.hubunganKeluarga },
      newValues: { kkId, hubunganKeluarga },
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("POST KK ANGGOTA ERROR:", error);
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
    const { wargaId, hubunganKeluarga } = body;

    if (!wargaId || !hubunganKeluarga) {
      return Response.json({ error: "Data warga dan hubungan wajib diisi" }, { status: 400 });
    }

    const warga = await prisma.warga.findUnique({ where: { id: wargaId } });
    if (!warga) {
      return Response.json({ error: "Warga tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.warga.update({
      where: { id: wargaId },
      data: {
        hubunganKeluarga,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "UPDATE",
      entity: "KartuKeluarga",
      entityId: updated.kkId,
      description: `Mengubah hubungan keluarga: ${warga.nama} menjadi ${hubunganKeluarga}`,
      oldValues: { hubunganKeluarga: warga.hubunganKeluarga },
      newValues: { hubunganKeluarga },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PUT KK ANGGOTA ERROR:", error);
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
    const wargaId = searchParams.get("wargaId");

    if (!wargaId) {
      return Response.json({ error: "ID Warga wajib diisi" }, { status: 400 });
    }

    const warga = await prisma.warga.findUnique({ where: { id: wargaId } });
    if (!warga) {
      return Response.json({ error: "Warga tidak ditemukan" }, { status: 404 });
    }

    const oldKkId = warga.kkId;

    const updated = await prisma.warga.update({
      where: { id: wargaId },
      data: {
        kkId: null,
        hubunganKeluarga: null,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "UPDATE",
      entity: "KartuKeluarga",
      entityId: oldKkId,
      description: `Mengeluarkan anggota dari KK: ${warga.nama}`,
      oldValues: { kkId: warga.kkId, hubunganKeluarga: warga.hubunganKeluarga },
      newValues: { kkId: null, hubunganKeluarga: null },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE KK ANGGOTA ERROR:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
