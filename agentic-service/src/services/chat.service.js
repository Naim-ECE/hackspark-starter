import Session from "../models/session.model.js";
import Message from "../models/message.model.js";
import { generateReply, generateTitle } from "./llm.service.js";
import { getGroundingData } from "./grounding.service.js";

const RENTPI_KEYWORDS = [
  "rental",
  "product",
  "categor",
  "price",
  "discount",
  "available",
  "availability",
  "renter",
  "owner",
  "rentpi",
  "booking",
  "gear",
  "surge",
  "peak",
  "trending"
];

const isOnTopic = (message) => {
  const lower = message.toLowerCase();
  return RENTPI_KEYWORDS.some((kw) => lower.includes(kw));
};

const cannedRefusal = {
  role: "assistant",
  text: "I can only help with RentPi rentals, products, pricing, and availability questions."
};

/**
 * Get all chat sessions.
 * @returns {Promise<object[]>}
 */
export const listSessions = async () => {
  const sessions = await Session.find({}).sort({ lastMessageAt: -1 }).lean();
  return sessions.map((session) => ({
    id: session.sessionId,
    title: session.name
  }));
};

/**
 * Get session history.
 * @param {string} sessionId
 * @returns {Promise<object[]>}
 */
export const getSessionHistory = async (sessionId) => {
  const messages = await Message.find({ sessionId }).sort({ timestamp: 1 }).lean();
  return messages.map((msg) => ({
    role: msg.role,
    text: msg.content
  }));
};

/**
 * Handle incoming chat message.
 * @param {string} sessionId
 * @param {string} message
 * @returns {Promise<object>} reply payload
 */
export const handleChat = async (sessionId, message) => {
  if (!message || !message.trim()) {
    const err = new Error("message is required");
    err.status = 400;
    throw err;
  }

  if (!isOnTopic(message)) {
    return { reply: cannedRefusal };
  }

  const groundingContext = await getGroundingData(message);
  
  let session = await Session.findOne({ sessionId });
  const isNewSession = !session;

  if (isNewSession) {
    const name = await generateTitle(message);
    session = await Session.create({
      sessionId,
      name,
      createdAt: new Date(),
      lastMessageAt: new Date()
    });
  } else {
    session.lastMessageAt = new Date();
    await session.save();
  }

  // Load history for context
  const historyMessages = await Message.find({ sessionId }).sort({ timestamp: 1 }).lean();
  const llmHistory = historyMessages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  const systemInstruction = "You are RentPi Assistant, a helpful AI focused on a rental marketplace. Use the provided context to answer accurately. Do not hallucinate. If data is unavailable, say so.";
  const prompt = groundingContext 
    ? `${systemInstruction}\n\nContext: ${groundingContext}\n\nUser: ${message}`
    : `${systemInstruction}\n\nUser: ${message}`;

  const assistantText = await generateReply(llmHistory, prompt);
  const reply = { role: "assistant", text: assistantText };

  await Message.create({
    sessionId,
    role: "user",
    content: message,
    timestamp: new Date()
  });

  await Message.create({
    sessionId,
    role: "assistant",
    content: assistantText,
    timestamp: new Date()
  });

  return { reply };
};
