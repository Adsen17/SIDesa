import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../lib/auth-helpers";
import { writeAuditLog } from "../../../lib/audit";

export async function POST(req) {
  try {
    const user = getUserFromRequest(req);

    if (user) {
      await writeAuditLog(req, {
        userId: user.id,
        username: user.username,
        action: "LOGOUT",
        entity: "AUTH",
        description: "Logout berhasil",
      });
    }

    const res = NextResponse.json({ message: "Logout berhasil" });

    res.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    const res = NextResponse.json(
      { message: "Logout berhasil" },
      { status: 200 }
    );

    res.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return res;
  }
}