import { fetchDownstreamStatuses } from "../services/status.service.js";

export const getStatus = async (req, res, next) => {
  try {
    const downstream = await fetchDownstreamStatuses();
    res.status(200).json({
      service: "api-gateway",
      status: "OK",
      downstream
    });
  } catch (error) {
    next(error);
  }
};
