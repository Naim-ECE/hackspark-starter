import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../utils/db.js";
import { fetchCentralUser } from "./centralApi.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = "7d";

const ensureJwtSecret = () => {
  if (!JWT_SECRET) {
    const error = new Error("JWT secret is not configured");
    error.status = 500;
    throw error;
  }
};

/**
 * Create the users table if it does not exist.
 * @returns {Promise<void>}
 */
export const ensureUsersTable = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
};

/**
 * Register a new user and return a JWT.
 * @param {object} input
 * @returns {Promise<object>} auth payload
 */
export const registerUser = async (input) => {
  ensureJwtSecret();

  const { name, email, password } = input;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return { token, user };
  } catch (error) {
    if (error.code === "23505") {
      const err = new Error("Email already registered");
      err.status = 409;
      throw err;
    }
    throw error;
  }
};

/**
 * Authenticate a user and return a JWT.
 * @param {object} input
 * @returns {Promise<object>} auth payload
 */
export const loginUser = async (input) => {
  ensureJwtSecret();

  const { email, password } = input;
  const result = await query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
};

/**
 * Decode a JWT and return the user profile.
 * @param {string} token
 * @returns {Promise<object>} user payload
 */
export const getUserFromToken = async (token) => {
  ensureJwtSecret();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [payload.sub]
    );

    const user = result.rows[0];
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return user;
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      const err = new Error("Invalid token");
      err.status = 401;
      throw err;
    }
    throw error;
  }
};

const discountFromScore = (score) => {
  if (score >= 80) return 20;
  if (score >= 60) return 15;
  if (score >= 40) return 10;
  if (score >= 20) return 5;
  return 0;
};

/**
 * Get discount tier for a user.
 * @param {string|number} id
 * @returns {Promise<object>} discount payload
 */
export const getUserDiscount = async (id) => {
  const user = await fetchCentralUser(id);
  if (!user || user.error) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const securityScore = Number(user.securityScore) || 0;
  return {
    discountPercent: discountFromScore(securityScore),
    securityScore
  };
};
