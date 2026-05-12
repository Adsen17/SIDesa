const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const data = [
  {
    "Nama": "Budi Santoso",
    "NIK": "1234567890123456",
    "Telepon": "081234567890",
    "Gender": "Laki-laki",
    "Umur": "Dewasa",
    "RT": "1",
    "Tanggal Lahir": "1990-05-12",
    "Agama": "Islam",
    "Sekolah": "SMA",
    "Status": "Hidup",
    "Pekerjaan": "Wiraswasta",
    "Alamat": "Jl. Merdeka No. 10, RT 01 RW 02",
    "No KK": "9876543210987654",
    "Hubungan Keluarga": "Kepala Keluarga"
  },
  {
    "Nama": "Siti Aminah",
    "NIK": "1234567890123457",
    "Telepon": "081234567891",
    "Gender": "Perempuan",
    "Umur": "Dewasa",
    "RT": "1",
    "Tanggal Lahir": "1992-08-22",
    "Agama": "Islam",
    "Sekolah": "SMA",
    "Status": "Hidup",
    "Pekerjaan": "Ibu Rumah Tangga",
    "Alamat": "Jl. Merdeka No. 10, RT 01 RW 02",
    "No KK": "9876543210987654",
    "Hubungan Keluarga": "Istri"
  }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Template Warga");

const outputPath = path.join(__dirname, "..", "public", "template_data_warga.xlsx");
XLSX.writeFile(wb, outputPath);

console.log("Template generated at", outputPath);
