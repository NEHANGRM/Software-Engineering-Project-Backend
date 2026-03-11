const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, default: 'student' },
    avatar: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    settings: {
        sleepTimeStart: { type: String, default: "23:00" },
        sleepTimeEnd: { type: String, default: "07:00" },
        preferredStudyDuration: { type: Number, default: 60 }, // in minutes
        mfaEnabled: { type: Boolean, default: true }
    },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date },
    mfaOtp: { type: String },
    mfaOtpExpiry: { type: Date },
    gamification: {
        points: { type: Number, default: 0 },
        eventsCompleted: { type: Number, default: 0 },
        rank: { type: String, default: 'Neptune' }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
