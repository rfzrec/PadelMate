const crypto = require("crypto");

const AUTH_SECRET = process.env.AUTH_SECRET || "padelmate-dev-secret-2026";

function base64url(value) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createToken(user) {
  const payload = base64url(JSON.stringify({
    id: user.id, name: user.name, email: user.email, role: user.role,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
  }));
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  try {
    if (signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

function authRequired(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ message: "Silakan login terlebih dahulu." });
  req.user = user;
  next();
}

module.exports = { createToken, verifyToken, authRequired };
