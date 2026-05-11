// 🔥 CEK ROLE LANGSUNG DARI PARAMETER (API)
export const isAdmin = (role) => {
  if (!role) return false;

  const r = String(role).toLowerCase().trim();

  return r === "developer" || r === "owner";
};

export const isStaff = (role) => {
  if (!role) return false;

  return String(role).toLowerCase().trim() === "staff";
};