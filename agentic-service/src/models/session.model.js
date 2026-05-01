import mongoose from "../utils/db.js";

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("Session", sessionSchema);
