import jwt from "jsonwebtoken";

export const signJwt = (payload, expiresIn = process.env.JWT_EXPIRES || "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
