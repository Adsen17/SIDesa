import { isAdmin } from "./role";

export const maskNIK = (nik) => {
  if (!nik) return "-";

  if (isAdmin()) return nik; // 👑 full lihat

  // 👷 staff lihat sebagian
  return nik.slice(0, 4) + "*****" + nik.slice(-4);
};