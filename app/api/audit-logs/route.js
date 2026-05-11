import prisma from "../../../lib/db";
import { requireRoles } from "../../../lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const auth = requireRoles(req, ["developer", "owner"]);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );

    const action = (searchParams.get("action") || "").trim();
    const entity = (searchParams.get("entity") || "").trim();
    const username = (searchParams.get("username") || "").trim();
    const q = (searchParams.get("q") || "").trim();
    const role = (searchParams.get("role") || "").trim();

    const where = {};

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (username) {
      where.username = {
        contains: username,
        mode: "insensitive",
      };
    }

    if (q) {
      where.OR = [
        { username: { contains: q, mode: "insensitive" } },
        { entity: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
      ];
    }

    const canUseRoleFilter = auth.user.role === "developer";

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      }),
    ]);

    let filteredLogs = logs;

    if (canUseRoleFilter && role) {
      filteredLogs = logs.filter((log) => log.user?.role === role);
    }

    const normalizedLogs = filteredLogs.map((log) => ({
      ...log,
      role: log.user?.role || null,
      user: undefined,
    }));

    const finalTotal = canUseRoleFilter && role ? normalizedLogs.length : total;

    return Response.json({
      data: normalizedLogs,
      meta: {
        total: finalTotal,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(finalTotal / limit)),
      },
      permissions: {
        canUseRoleFilter,
      },
    });
  } catch (err) {
    console.error("GET AUDIT LOG ERROR:", err);
    return Response.json(
      { error: "Gagal mengambil audit log" },
      { status: 500 }
    );
  }
}