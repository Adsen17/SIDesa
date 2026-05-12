import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login"];

async function getUserFromToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Belum login
  if (!token) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Sudah ada token, verifikasi
  const user = await getUserFromToken(token);

  // Token rusak / tidak valid
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", req.url));

    res.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return res;
  }

  // Redirect root path
  if (pathname === "/") {
    if (!token || !user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Kalau sudah login, jangan boleh buka login lagi
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Hanya developer dan owner yang boleh akses audit-log
  const auditOnlyPaths = ["/audit-log"];
  if (
    auditOnlyPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    ) &&
    !["developer", "owner"].includes(user.role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Settings sekarang boleh diakses semua user yang sudah login
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/settings/:path*",
    "/warga/:path*",
    "/kartu-keluarga/:path*",
    "/audit-log/:path*",
    "/profile/:path*",
  ],
};