import express from "express";
import mongoose from "mongoose";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectToSocket from "./controllers/socketManager.js"; 
import userRoute from './routes/userRoute.js'

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT;
const uri = process.env.MONGODB_URI;

// Create HTTP server
const server = http.createServer(app);

// Socket.io setup
const io = connectToSocket(server);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users",userRoute)


// Connect DB and start server
const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected ✔");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("DB Connection Failed ❌", error);
  }
};

startServer();
