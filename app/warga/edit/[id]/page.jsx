"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import BackButton from "../../../components/BackButton";
import PreviewModal from "../../../components/PreviewModal";
import { popup } from "../../../../lib/popup";

export default function EditWarga() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    nama: "",
    nik: "",
    telp: "",
    gender: "",
    umur: "",
    rt: "",
    tanggalLahir: "",
    agama: "",
    sekolah: "",
    status: "",
    kkId: "",
    hubunganKeluarga: "",
    pekerjaan: "",
  });
  const [kkList, setKkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isValidNIK = (nik) => /^\d{16}$/.test(String(nik));

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);

        const res = await fetch(`/api/warga?id=${id}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Gagal ambil data warga");
        }

        setForm({
          ...result,
          gender: result.gender === "laki_laki" ? "Laki-laki" : "Perempuan",
        });
      } catch (err) {
        popup.error("Error", err.message);
        router.push("/warga");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDetail();

    async function fetchKKs() {
      try {
        const res = await fetch("/api/kartu-keluarga");
        if (res.ok) {
          const data = await res.json();
          setKkList(data);
        }
      } catch (e) {}
    }
    fetchKKs();
  }, [id, router]);

  const handleBeforeUpdate = () => {
    if (
      !form.nama ||
      !form.nik ||
      !form.telp ||
      !form.gender ||
      !form.umur ||
      !form.rt
    ) {
      popup.error("Error", "Semua field wajib diisi!");
      return;
    }

    if (!isValidNIK(form.nik)) {
      popup.error("Error", "NIK harus 16 digit!");
      return;
    }

    setShowPreview(true);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/warga", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          id,
          gender: form.gender === "Laki-laki" ? "laki_laki" : "perempuan",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal update data");
      }

      setShowPreview(false);
      await popup.success("Berhasil!", "Data warga berhasil diupdate.");
      
      const params = new URLSearchParams(window.location.search);
      if (params.get("returnTo") === "kk" && form.kkId) {
        router.push(`/kartu-keluarga/${form.kkId}`);
      } else {
        router.push("/warga");
      }
    } catch (err) {
      popup.error("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewItems = [
    { label: "Nama", value: form.nama },
    { label: "NIK", value: form.nik },
    { label: "Telepon", value: form.telp },
    { label: "Gender", value: form.gender },
    { label: "Umur", value: form.umur },
    { label: "Tanggal Lahir", value: form.tanggalLahir },
    { label: "Agama", value: form.agama },
    { label: "Sekolah", value: form.sekolah },
    { label: "Status", value: form.status },
    { label: "Pekerjaan", value: form.pekerjaan },
    { label: "RT", value: `RT ${form.rt}` },
    { label: "Kartu Keluarga", value: kkList.find(k => k.id === form.kkId)?.noKK || "-" },
    { label: "Hubungan KK", value: form.hubunganKeluarga?.replace("_", " ") || "-" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/40 bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          Memuat data warga...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Edit Data
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Edit Warga
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Perbarui informasi warga dengan tampilan yang lebih modern.
              </p>
            </div>

            <BackButton fallback="/warga" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Form Edit Warga</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pastikan data yang diperbarui sudah sesuai sebelum disimpan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={form.nama || ""}
              onChange={(value) => setForm({ ...form, nama: value })}
            />

            <InputField
              label="NIK"
              placeholder="Masukkan NIK 16 digit"
              value={form.nik || ""}
              onChange={(value) => setForm({ ...form, nik: value })}
            />

            <InputField
              label="Telepon"
              placeholder="Masukkan nomor telepon"
              value={form.telp || ""}
              onChange={(value) => setForm({ ...form, telp: value })}
            />

            <SelectField
              label="Gender"
              value={form.gender || ""}
              onChange={(value) => setForm({ ...form, gender: value })}
              options={["Laki-laki", "Perempuan"]}
              placeholder="Pilih gender"
            />

            <SelectField
              label="Kategori Umur"
              value={form.umur || ""}
              onChange={(value) => setForm({ ...form, umur: value })}
              options={["Bayi", "Remaja", "Dewasa", "Lansia"]}
              placeholder="Pilih kategori umur"
            />

            <SelectField
              label="RT"
              value={form.rt || ""}
              onChange={(value) => setForm({ ...form, rt: value })}
              options={["1", "2", "3", "4", "5"]}
              placeholder="Pilih RT"
              renderOption={(option) => `RT ${option}`}
            />

            <DatePickerField
              label="Tanggal Lahir"
              value={form.tanggalLahir || ""}
              onChange={(value) => setForm({ ...form, tanggalLahir: value })}
            />

            <SelectField
              label="Agama"
              value={form.agama || ""}
              onChange={(value) => setForm({ ...form, agama: value })}
              options={["Islam", "Kristen", "Katolik", "Buddha", "Hindu", "Konghucu"]}
              placeholder="Pilih Agama"
            />

            <SelectField
              label="Sekolah"
              value={form.sekolah || ""}
              onChange={(value) => setForm({ ...form, sekolah: value })}
              options={["SD", "SMP", "SMA", "Kuliah"]}
              placeholder="Pilih Sekolah"
            />

            <SelectField
              label="Status Warga"
              value={form.status || ""}
              onChange={(value) => setForm({ ...form, status: value })}
              options={["Hidup", "Meninggal"]}
              placeholder="Pilih Status"
            />

            <InputField
              label="Pekerjaan"
              placeholder="Masukkan pekerjaan"
              value={form.pekerjaan || ""}
              onChange={(value) => setForm({ ...form, pekerjaan: value })}
            />

            <div className="col-span-1 md:col-span-2 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-semibold mb-4">Informasi Kartu Keluarga (Opsional)</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Pilih Kartu Keluarga"
                  value={form.kkId || ""}
                  onChange={(value) => setForm({ ...form, kkId: value })}
                  options={kkList.map(k => k.id)}
                  placeholder="-- Belum masuk KK --"
                  renderOption={(id) => {
                    const k = kkList.find(x => x.id === id);
                    return k ? `No. ${k.noKK} (RT ${k.rt})` : id;
                  }}
                />

                {form.kkId && (
                  <SelectField
                    label="Hubungan Keluarga"
                    value={form.hubunganKeluarga || ""}
                    onChange={(value) => setForm({ ...form, hubunganKeluarga: value })}
                    options={["Kepala_Keluarga", "Istri", "Anak", "Orang_Tua", "Mertua", "Menantu", "Cucu", "Saudara", "Lainnya"]}
                    placeholder="Pilih Hubungan"
                    renderOption={(val) => val.replace("_", " ")}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleBeforeUpdate}
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Update Data"}
            </button>
          </div>
        </section>
      </div>

      <PreviewModal
        open={showPreview}
        title="Preview Update Data"
        subtitle="Periksa kembali perubahan data sebelum disimpan."
        items={previewItems}
        confirmText="Simpan Perubahan"
        cancelText="Kembali"
        onConfirm={handleUpdate}
        onClose={() => setShowPreview(false)}
        loading={saving}
      />
    </div>
  );
}

function InputField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  renderOption,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DatePickerField({ label, value, onChange }) {
  const parts = value ? value.split("/") : ["", "", ""];
  const day = parts[0] || "";
  const month = parts[1] || "";
  const year = parts[2] || "";

  const handleChange = (d, m, y) => {
    if (!d && !m && !y) onChange("");
    else onChange(`${d}/${m}/${y}`);
  };

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={day}
          onChange={(e) => handleChange(e.target.value, month, year)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Hari</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => handleChange(day, e.target.value, year)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Bulan</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => handleChange(day, month, e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Tahun</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}