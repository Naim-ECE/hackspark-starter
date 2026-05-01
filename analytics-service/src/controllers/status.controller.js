import { fetchStatus } from "../services/status.service.js";

export const getStatus = async (req, res, next) => {
  try {
    const payload = await fetchStatus();
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
