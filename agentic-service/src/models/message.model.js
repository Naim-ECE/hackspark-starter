import mongoose from "../utils/db.js";

const messageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model("Message", messageSchema);
