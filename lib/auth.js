import jwt from "jsonwebtoken";

export function createToken(user) {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) throw new Error("JWT_SECRET belum di set di .env");

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
    },
    SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token) {
  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) return null;

  try {
    const decoded = jwt.verify(token, SECRET);

    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}