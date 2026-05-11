import { getUserFromRequest } from "../../../lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}