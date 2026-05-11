import { verifyToken } from "./auth";

export function getTokenFromRequest(req) {
  const cookie = req.headers.get("cookie") || "";

  return cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];
}

export function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function getClientIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getUserAgent(req) {
  return req.headers.get("user-agent") || "unknown";
}

export function requireUser(req) {
  const user = getUserFromRequest(req);

  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, user };
}

export function requireRoles(req, roles = []) {
  const user = getUserFromRequest(req);

  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!roles.includes(user.role)) {
    return {
      ok: false,
      response: Response.json({ error: "Akses ditolak" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}