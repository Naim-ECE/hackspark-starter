import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "";

let connectionPromise = null;

export const connectDb = async () => {
  if (!MONGO_URI) {
    const err = new Error("MONGO_URI is not configured");
    err.status = 500;
    throw err;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGO_URI, {
      dbName: "rentpi"
    });
  }

  return connectionPromise;
};

export default mongoose;
