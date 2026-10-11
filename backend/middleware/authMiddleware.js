import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token", code: "NO_TOKEN" });
  }

  const token = header.split(" ")[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // The reason is logged server-side only: "jwt expired", "invalid signature",
    // or "secret or public key must be provided". Tokens and secrets are never logged.
    console.log(`[Auth] Token rejected: ${error.name}: ${error.message}`);
    const expired = error.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Your session has expired, please log in again" : "Not authorized, token failed",
      code: expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
    });
  }

  try {
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Account not found, please log in again", code: "USER_NOT_FOUND" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("[Auth] User lookup failed:", error.message);
    res.status(500).json({ message: "Couldn't verify your session. Please try again." });
  }
};