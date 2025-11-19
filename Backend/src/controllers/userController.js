import { user } from "../model/userModel.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";


// ========================= LOGIN =========================
const login = async (req, res) => {
  const { username, password } = req.body;

  // Validation
  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide username and password" });
  }

  try {
    // Find user
    const foundUser = await user.findOne({ username });
    if (!foundUser) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid password" });
    }

    // Generate random token
    const token = crypto.randomBytes(20).toString("hex");

    foundUser.token = token;
    await foundUser.save();

    return res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong: ${error}` });
  }
};


// ========================= REGISTER =========================
const register = async (req, res) => {
  const { name, username, password } = req.body;

  // Validate
  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please fill all fields" });
  }

  try {
    // Check if user already exists
    const existingUser = await user.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)  // 409
        .json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new user({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });

  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

export { login, register };
