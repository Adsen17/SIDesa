const XLSX = require("xlsx");
const path = require("path");

const data = [
  {
    "Nama": "Budi Santoso",
    "NIK": "3201234567890123",
    "Telepon": "081234567890",
    "Gender": "Laki-laki",
    "Umur": "Dewasa",
    "RT": "1"
  },
  {
    "Nama": "Siti Aminah",
    "NIK": "3201234567890124",
    "Telepon": "081234567891",
    "Gender": "Perempuan",
    "Umur": "Lansia",
    "RT": "2"
  }
];

const ws = XLSX.utils.json_to_sheet(data);

// Adjust column widths
ws['!cols'] = [
  { wch: 20 }, // Nama
  { wch: 20 }, // NIK
  { wch: 15 }, // Telepon
  { wch: 15 }, // Gender
  { wch: 10 }, // Umur
  { wch: 5 }   // RT
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Template Warga");

XLSX.writeFile(wb, path.join(__dirname, "../public/template_data_warga.xlsx"));
console.log("Template created!");
