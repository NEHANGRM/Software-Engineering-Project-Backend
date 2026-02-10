const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);
        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: 'student' } });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Email already exists" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'student' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" });
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Find existing user or create a new one
        let user = await User.findOne({ email });
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = new User({ name, email, password: hashedPassword });
            await user.save();
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: 'student' } });
    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(500).json({ message: "Google authentication failed", error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Store hashed OTP with 10-minute expiry
        user.resetOtp = hashedOtp;
        user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send OTP email
        await transporter.sendMail({
            from: `"ClassFlow" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'ClassFlow - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                    <h2 style="color: #1e293b; margin-bottom: 8px;">Password Reset</h2>
                    <p style="color: #64748b; margin-bottom: 24px;">You requested to reset your password. Use the OTP below:</p>
                    <div style="background: #3b82f6; color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                        ${otp}
                    </div>
                    <p style="color: #94a3b8; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
                </div>
            `,
        });

        res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if OTP exists and hasn't expired
        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({ message: "No password reset was requested" });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            await user.save();
            return res.status(400).json({ message: "OTP has expired. Please request a new one" });
        }

        // Verify OTP
        const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Failed to reset password", error: err.message });
    }
};

