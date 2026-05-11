import prisma from "./db";
import { getClientIp, getUserAgent } from "./auth-helpers";

export async function writeAuditLog(req, payload = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId || null,
        username: payload.username || null,
        action: payload.action || "UNKNOWN",
        entity: payload.entity || "SYSTEM",
        entityId: payload.entityId || null,
        description: payload.description || null,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        oldValues: payload.oldValues ?? undefined,
        newValues: payload.newValues ?? undefined,
      },
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }
}