import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { requireRoles } from "../../../../lib/auth-helpers";

export async function POST(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner"]);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { mode, days } = body;

    let deleted = 0;

    if (mode === "all") {
      const result = await prisma.auditLog.deleteMany({});
      deleted = result.count;
    } else if (mode === "old") {
      const safeDays = Number(days || 30);

      const date = new Date();
      date.setDate(date.getDate() - safeDays);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: date,
          },
        },
      });

      deleted = result.count;
    } else {
      return NextResponse.json(
        { error: "Mode tidak valid" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted,
    });
  } catch (err) {
    console.error("CLEAR AUDIT LOG ERROR:", err);
    return NextResponse.json(
      {
        error: err?.message || "Gagal hapus audit log",
      },
      { status: 500 }
    );
  }
}