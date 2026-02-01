import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";   // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_REFRESH_TOKENS_PER_USER = 5;

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function cleanExpiredRefreshTokens(tokens) {
  const now = new Date();
  return tokens.filter((t) => t.expiresAt > now);
}

export const registerController = async (req, res) => {
  try {
    // validatedData guaranteed by middleware
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      phone,
      shopName,
      dateOfBirth,
      gender,
      address,
    } = req.validatedData;

    // Check if username exists
    const existingUsername = await User.findOne({ username }).lean();
    if (existingUsername) {
      return res
        .status(400)
        .json({ message: "Username already exists", field: "username" });
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "Email already exists", field: "email" });
    }

    // Hash password (bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      phone,
      shopName,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      address: address || {},
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        shopName: user.shopName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginController = async (req, res) => {
  try {
    const { username, password } = req.validatedData;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check active
    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();

    // Access token (short-lived)
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Refresh token (long-lived, stored hashed)
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens = cleanExpiredRefreshTokens(user.refreshTokens);
    user.refreshTokens.push({ tokenHash, expiresAt });
    if (user.refreshTokens.length > MAX_REFRESH_TOKENS_PER_USER) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS_PER_USER);
    }
    await user.save();

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        shopName: user.shopName,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // seconds (15 min), for client convenience
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const refreshController = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const now = new Date();
    const users = await User.find({
      "refreshTokens.expiresAt": { $gt: now },
    });

    let userDoc = null;
    let matchedIndex = -1;

    for (const u of users) {
      for (let i = 0; i < (u.refreshTokens || []).length; i++) {
        if (u.refreshTokens[i].expiresAt <= now) continue;
        const match = await bcrypt.compare(refreshToken, u.refreshTokens[i].tokenHash);
        if (match) {
          userDoc = u;
          matchedIndex = i;
          break;
        }
      }
      if (userDoc) break;
    }

    if (!userDoc || matchedIndex === -1) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Rotate: remove old refresh token, issue new access + refresh
    userDoc.refreshTokens.splice(matchedIndex, 1);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);
    userDoc.refreshTokens = cleanExpiredRefreshTokens(userDoc.refreshTokens);
    userDoc.refreshTokens.push({ tokenHash, expiresAt });
    if (userDoc.refreshTokens.length > MAX_REFRESH_TOKENS_PER_USER) {
      userDoc.refreshTokens = userDoc.refreshTokens.slice(-MAX_REFRESH_TOKENS_PER_USER);
    }
    await userDoc.save();

    const accessToken = jwt.sign(
      { id: userDoc._id, role: userDoc.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logoutController = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const users = await User.find({ "refreshTokens.0": { $exists: true } });
      for (const user of users) {
        let removed = false;
        for (let i = 0; i < (user.refreshTokens || []).length; i++) {
          const match = await bcrypt.compare(refreshToken, user.refreshTokens[i].tokenHash);
          if (match) {
            user.refreshTokens.splice(i, 1);
            await user.save();
            removed = true;
            break;
          }
        }
        if (removed) break;
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ message: "Logged out successfully" });
  }
};

export const meController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyController = (req, res) => {
  return res.json({ valid: true, userId: req.user.id });
};
