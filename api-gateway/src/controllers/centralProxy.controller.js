import { fetchCentral } from "../services/centralApi.service.js";

export const proxyCentral = async (req, res, next) => {
  try {
    const path = req.params[0] ? `/${req.params[0]}` : "";
    if (!path) {
      const err = new Error("Central API path is required");
      err.status = 400;
      throw err;
    }

    const data = await fetchCentral(path, req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
