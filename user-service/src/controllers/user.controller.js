import {
  registerUser,
  loginUser,
  getUserFromToken,
  getUserDiscount
} from "../services/user.service.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return null;
  }
  return token;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      const err = new Error("name, email, and password are required");
      err.status = 400;
      throw err;
    }

    const payload = await registerUser({ name, email, password });
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      const err = new Error("email and password are required");
      err.status = 400;
      throw err;
    }

    const payload = await loginUser({ email, password });
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      const err = new Error("Missing bearer token");
      err.status = 401;
      throw err;
    }

    const user = await getUserFromToken(token);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const discount = async (req, res, next) => {
  try {
    const payload = await getUserDiscount(req.params.id);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
