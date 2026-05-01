import {
  listSessions,
  getSessionHistory,
  handleChat
} from "../services/chat.service.js";

export const sessions = async (req, res, next) => {
  try {
    const payload = await listSessions();
    res.status(200).json({ sessions: payload });
  } catch (error) {
    next(error);
  }
};

export const history = async (req, res, next) => {
  try {
    const payload = await getSessionHistory(req.params.sessionId);
    res.status(200).json({ messages: payload });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body || {};
    if (!sessionId) {
      const err = new Error("sessionId is required");
      err.status = 400;
      throw err;
    }
    const payload = await handleChat(sessionId, message);
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};
