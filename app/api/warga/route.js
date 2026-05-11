import prisma from "../../../lib/db";
import { requireRoles, requireUser } from "../../../lib/auth-helpers";
import { writeAuditLog } from "../../../lib/audit";

export const dynamic = "force-dynamic";

const allowedUmur = ["Bayi", "Remaja", "Dewasa", "Lansia"];
const allowedAgama = ["Islam", "Kristen", "Katolik", "Buddha", "Hindu", "Konghucu"];
const allowedSekolah = ["SD", "SMP", "SMA", "Kuliah"];
const allowedStatus = ["Hidup", "Meninggal"];

function fixGender(g) {
  if (!g) return null;

  const val = String(g).toLowerCase().trim();

  if (val === "l" || val.includes("laki") || val === "male") {
    return "laki_laki";
  }

  if (val === "p" || val.includes("perempuan") || val === "female") {
    return "perempuan";
  }

  return null;
}

function sanitizeWargaInput(body) {
  return {
    nama: String(body.nama || "").trim(),
    nik: String(body.nik || "").trim(),
    telp: String(body.telp || "").trim(),
    rt: String(body.rt || "").trim(),
    gender: fixGender(body.gender),
    umur: String(body.umur || "").trim(),
    tanggalLahir: body.tanggalLahir ? String(body.tanggalLahir).trim() : null,
    agama: body.agama ? String(body.agama).trim() : null,
    sekolah: body.sekolah ? String(body.sekolah).trim() : null,
    status: body.status ? String(body.status).trim() : null,
    pekerjaan: body.pekerjaan ? String(body.pekerjaan).trim() : null,
    kkId: body.kkId ? String(body.kkId).trim() : null,
    hubunganKeluarga: body.hubunganKeluarga ? String(body.hubunganKeluarga).trim() : null,
  };
}

function validatePayload(body, { isUpdate = false } = {}) {
  if (isUpdate && !body.id) {
    return "ID wajib ada";
  }

  if (!body.nama) return "Nama wajib diisi";
  if (!body.nik || !/^\d{16}$/.test(body.nik)) return "NIK harus 16 digit";
  if (!body.telp) return "Telepon wajib diisi";
  if (!/^[0-9+\-\s]{8,20}$/.test(body.telp)) return "Telepon tidak valid";
  if (!body.rt) return "RT wajib diisi";
  if (!body.gender) return "Gender tidak valid";
  if (!body.umur || !allowedUmur.includes(body.umur)) {
    return "Kategori umur tidak valid";
  }

  if (body.agama && !allowedAgama.includes(body.agama)) return "Agama tidak valid";
  if (body.sekolah && !allowedSekolah.includes(body.sekolah)) return "Sekolah tidak valid";
  if (body.status && !allowedStatus.includes(body.status)) return "Status tidak valid";

  if (body.hubunganKeluarga && !["Kepala_Keluarga", "Istri", "Anak", "Orang_Tua", "Mertua", "Menantu", "Cucu", "Saudara", "Lainnya"].includes(body.hubunganKeluarga)) {
    return "Hubungan keluarga tidak valid";
  }

  return null;
}

export async function GET(req) {
  try {
    const auth = requireUser(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const warga = await prisma.warga.findUnique({
        where: { id },
      });

      if (!warga) {
        return Response.json(
          { error: "Data warga tidak ditemukan" },
          { status: 404 }
        );
      }

      return Response.json(warga);
    }

    const data = await prisma.warga.findMany({
      include: { kartuKeluarga: { select: { noKK: true } } },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(data);
  } catch (err) {
    console.error("GET WARGA ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = requireUser(req);
    if (!auth.ok) return auth.response;

    const rawBody = await req.json();
    const body = sanitizeWargaInput(rawBody);
    const validationError = validatePayload(body);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const existing = await prisma.warga.findUnique({
      where: { nik: body.nik },
    });

    if (existing) {
      return Response.json(
        { error: "NIK sudah terdaftar" },
        { status: 400 }
      );
    }

    let kkIdToUse = body.kkId;
    if (rawBody.noKK && /^\d{16}$/.test(String(rawBody.noKK).trim())) {
      const noKK = String(rawBody.noKK).trim();
      let kk = await prisma.kartuKeluarga.findUnique({ where: { noKK } });
      if (!kk) {
        kk = await prisma.kartuKeluarga.create({
          data: {
            noKK,
            rt: body.rt || "1",
            alamat: "Alamat belum diatur (Otomatis dari Excel)",
          }
        });
      }
      kkIdToUse = kk.id;
    }
    
    // Assign back to body
    body.kkId = kkIdToUse;

    const data = await prisma.warga.create({
      data: body,
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "CREATE",
      entity: "WARGA",
      entityId: data.id,
      description: `Menambahkan data warga ${data.nama}`,
      newValues: data,
    });

    return Response.json(data);
  } catch (err) {
    console.error("POST WARGA ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner"]);
    if (!auth.ok) return auth.response;

    const rawBody = await req.json();
    const body = sanitizeWargaInput(rawBody);
    body.id = rawBody.id;

    const validationError = validatePayload(body, { isUpdate: true });

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const oldData = await prisma.warga.findUnique({
      where: { id: body.id },
    });

    if (!oldData) {
      return Response.json(
        { error: "Data warga tidak ditemukan" },
        { status: 404 }
      );
    }

    const existingNik = await prisma.warga.findFirst({
      where: {
        nik: body.nik,
        NOT: { id: body.id },
      },
    });

    if (existingNik) {
      return Response.json(
        { error: "NIK sudah digunakan warga lain" },
        { status: 400 }
      );
    }

    let kkIdToUse = body.kkId;
    if (rawBody.noKK && /^\d{16}$/.test(String(rawBody.noKK).trim())) {
      const noKK = String(rawBody.noKK).trim();
      let kk = await prisma.kartuKeluarga.findUnique({ where: { noKK } });
      if (!kk) {
        kk = await prisma.kartuKeluarga.create({
          data: {
            noKK,
            rt: body.rt || "1",
            alamat: "Alamat belum diatur (Otomatis dari Excel)",
          }
        });
      }
      kkIdToUse = kk.id;
    }

    const data = await prisma.warga.update({
      where: { id: body.id },
      data: {
        nama: body.nama,
        nik: body.nik,
        telp: body.telp,
        rt: body.rt,
        gender: body.gender,
        umur: body.umur,
        tanggalLahir: body.tanggalLahir,
        agama: body.agama,
        sekolah: body.sekolah,
        status: body.status,
        pekerjaan: body.pekerjaan,
        kkId: kkIdToUse,
        hubunganKeluarga: body.hubunganKeluarga,
      },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "UPDATE",
      entity: "WARGA",
      entityId: data.id,
      description: `Mengubah data warga ${data.nama}`,
      oldValues: oldData,
      newValues: data,
    });

    return Response.json(data);
  } catch (err) {
    console.error("PUT WARGA ERROR:", err);
    return Response.json({ error: "Update gagal" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner"]);
    if (!auth.ok) return auth.response;

    const body = await req.json();

    if (!body?.id) {
      return Response.json({ error: "ID wajib ada" }, { status: 400 });
    }

    const oldData = await prisma.warga.findUnique({
      where: { id: body.id },
    });

    if (!oldData) {
      return Response.json(
        { error: "Data warga tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.warga.delete({
      where: { id: body.id },
    });

    await writeAuditLog(req, {
      userId: auth.user.id,
      username: auth.user.username,
      action: "DELETE",
      entity: "WARGA",
      entityId: oldData.id,
      description: `Menghapus data warga ${oldData.nama}`,
      oldValues: oldData,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE WARGA ERROR:", err);
    return Response.json({ error: "Delete gagal" }, { status: 500 });
  }
}