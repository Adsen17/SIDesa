"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWarga } from "../../context/WargaContext";
import * as XLSX from "xlsx";
import BackButton from "../../components/BackButton";
import PreviewModal from "../../components/PreviewModal";
import { popup } from "../../../lib/popup";

export default function TambahWarga() {
  const router = useRouter();
  const { data } = useWarga();

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

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const isValidNIK = (nik) => /^\d{16}$/.test(String(nik));

  const isDuplicate = (newData) => {
    return data.some(
      (d) =>
        String(d.nama || "").toLowerCase() ===
          String(newData.nama || "").toLowerCase() ||
        d.nik === newData.nik ||
        d.telp === newData.telp
    );
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kkId = params.get("kkId");
    if (kkId) {
      setForm(f => ({ ...f, kkId }));
    }

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

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowPreview(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSubmit = () => {
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

    if (isDuplicate(form)) {
      popup.error("Error", "Data tidak boleh duplikat!");
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/warga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          gender: form.gender === "Laki-laki" ? "laki_laki" : "perempuan",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        popup.error("Error", result.error || "Gagal tambah data");
        return;
      }

      setShowPreview(false);
      await popup.success("Berhasil!", "Data warga berhasil ditambahkan.");
      
      const params = new URLSearchParams(window.location.search);
      if (params.get("kkId") && form.kkId) {
        router.push(`/kartu-keluarga/${form.kkId}`);
      } else {
        router.push("/warga");
      }
    } catch (err) {
      popup.error("Error", "Server bermasalah");
    } finally {
      setSaving(false);
    }
  };

  const fixGender = (g) => {
    if (!g) return null;

    const val = String(g)
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    if (val.includes("laki")) return "laki_laki";
    if (val.includes("perempuan")) return "perempuan";

    return null;
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    popup
      .confirm({
        title: "Import Excel?",
        text: "Pastikan format file sudah sesuai.",
        confirmText: "Ya, import",
      })
      .then((result) => {
        if (!result.isConfirmed) return;

        const reader = new FileReader();

        reader.onload = async (evt) => {
          setImporting(true);

          const buffer = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

          let success = 0;
          let failed = 0;

          for (const item of json) {
            const nama = String(item.Nama || "").trim();
            const nik = String(item.NIK || "").trim();
            const telp = String(item.Telepon || "").trim();
            const genderRaw = String(item.Gender || "").trim();
            const umur = String(item.Umur || "").trim();
            const rt = String(item.RT || "").trim();
            const tanggalLahir = String(item["Tanggal Lahir"] || "").trim();
            const agama = String(item.Agama || "").trim();
            const sekolah = String(item.Sekolah || "").trim();
            const status = String(item.Status || "").trim();
            const pekerjaan = String(item.Pekerjaan || "").trim();
            const noKK = String(item["No KK"] || "").trim();
            let hubunganKeluarga = String(item["Hubungan Keluarga"] || "").trim().replace(" ", "_");

            const gender = fixGender(genderRaw);
            
            let kkId = null;
            if (noKK) {
              const matchedKK = kkList.find(k => k.noKK === noKK);
              if (matchedKK) kkId = matchedKK.id;
            }

            if (!nama || !nik || !telp || !umur || !rt || !gender) {
              failed++;
              continue;
            }

            if (!/^\d{16}$/.test(nik)) {
              failed++;
              continue;
            }

            try {
              const res = await fetch("/api/warga", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  nama,
                  nik,
                  telp,
                  rt,
                  umur,
                  gender,
                  tanggalLahir,
                  agama,
                  sekolah,
                  status,
                  pekerjaan,
                  kkId,
                  noKK,
                  hubunganKeluarga,
                }),
              });

              if (!res.ok) {
                failed++;
                continue;
              }

              success++;
            } catch {
              failed++;
            }
          }

          setImporting(false);

          await popup.info(
            "Import Selesai",
            `Berhasil: ${success} | Gagal: ${failed}`
          );

          router.push("/warga");
        };

        reader.readAsArrayBuffer(file);
      });
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

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Data Warga
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Tambah Warga
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Tambahkan data warga baru secara manual atau melalui import
                Excel.
              </p>
            </div>

            <BackButton fallback="/warga" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="xl:col-span-2 rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Form Data Warga</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Lengkapi seluruh field sebelum menyimpan data.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={form.nama}
                onChange={(value) => setForm({ ...form, nama: value })}
              />

              <InputField
                label="NIK"
                placeholder="Masukkan NIK 16 digit"
                value={form.nik}
                onChange={(value) => setForm({ ...form, nik: value })}
              />

              <InputField
                label="Telepon"
                placeholder="Masukkan nomor telepon"
                value={form.telp}
                onChange={(value) => setForm({ ...form, telp: value })}
              />

              <SelectField
                label="Gender"
                value={form.gender}
                onChange={(value) => setForm({ ...form, gender: value })}
                options={["Laki-laki", "Perempuan"]}
                placeholder="Pilih gender"
              />

              <SelectField
                label="Kategori Umur"
                value={form.umur}
                onChange={(value) => setForm({ ...form, umur: value })}
                options={["Bayi", "Remaja", "Dewasa", "Lansia"]}
                placeholder="Pilih kategori umur"
              />

              <SelectField
                label="RT"
                value={form.rt}
                onChange={(value) => setForm({ ...form, rt: value })}
                options={["1", "2", "3", "4", "5"]}
                placeholder="Pilih RT"
                renderOption={(option) => `RT ${option}`}
              />

              <DatePickerField
                label="Tanggal Lahir"
                value={form.tanggalLahir}
                onChange={(value) => setForm({ ...form, tanggalLahir: value })}
              />

              <SelectField
                label="Agama"
                value={form.agama}
                onChange={(value) => setForm({ ...form, agama: value })}
                options={["Islam", "Kristen", "Katolik", "Buddha", "Hindu", "Konghucu"]}
                placeholder="Pilih Agama"
              />

              <SelectField
                label="Sekolah"
                value={form.sekolah}
                onChange={(value) => setForm({ ...form, sekolah: value })}
                options={["SD", "SMP", "SMA", "Kuliah"]}
                placeholder="Pilih Sekolah"
              />

              <SelectField
                label="Status Warga"
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
                options={["Hidup", "Meninggal"]}
                placeholder="Pilih Status"
              />

              <InputField
                label="Pekerjaan"
                type="text"
                value={form.pekerjaan}
                onChange={(value) => setForm({ ...form, pekerjaan: value })}
                placeholder="Contoh: Petani, Buruh, Guru"
              />

              <div className="col-span-1 md:col-span-2 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold mb-4">Informasi Kartu Keluarga (Opsional)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Pilih Kartu Keluarga"
                    value={form.kkId}
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
                      value={form.hubunganKeluarga}
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
                onClick={handleSubmit}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Simpan Data
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <div>
              <h2 className="text-lg font-semibold">Import Excel</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Upload file Excel untuk menambahkan banyak data sekaligus.
              </p>
            </div>

            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Pilih file
                </label>
                <a
                  href="/template_data_warga.xlsx"
                  download
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  📥 Download Template
                </a>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              <p className="mt-3 text-xs text-slate-400">
                Gunakan header: Nama, NIK, Telepon, Gender, Umur, RT, Tanggal Lahir, Agama, Sekolah, Status, Pekerjaan, No KK, Hubungan Keluarga
              </p>
            </div>

            <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-lg">
              <p className="text-sm text-white/80">Status Import</p>
              <h3 className="mt-2 text-2xl font-bold">
                {importing ? "Sedang diproses..." : "Siap digunakan"}
              </h3>
              <p className="mt-2 text-sm text-white/80">
                Import akan memvalidasi format NIK, gender, dan data wajib.
              </p>
            </div>
          </section>
        </div>
      </div>

      <PreviewModal
        open={showPreview}
        title="Preview Data Warga"
        subtitle="Pastikan data sudah benar sebelum disimpan ke sistem."
        items={previewItems}
        confirmText="Simpan Sekarang"
        cancelText="Kembali"
        onConfirm={handleConfirmSave}
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