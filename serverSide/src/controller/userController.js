import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.validatedData || req.body;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, phone },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateShopSettings = async (req, res) => {
  try {
    const { shopName, address, businessType, phone, description } =
      req.validatedData || req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        shopName,
        "shopSettings.address": address,
        "shopSettings.businessType": businessType,
        "shopSettings.phone": phone,
        "shopSettings.description": description,
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Shop settings updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { currency, language, theme, notifications, emailUpdates } =
      req.validatedData || req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        "preferences.currency": currency,
        "preferences.language": language,
        "preferences.theme": theme,
        "preferences.notifications": notifications,
        "preferences.emailUpdates": emailUpdates,
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "Preferences updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.validatedData || req.body;

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie("token");
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // In a real app, you would upload to S3 or Cloudinary here
    // For now, we assume the file is saved locally by multer
    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
