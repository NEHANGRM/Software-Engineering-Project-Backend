const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    settings: {
        sleepTimeStart: { type: String, default: "23:00" },
        sleepTimeEnd: { type: String, default: "07:00" },
        preferredStudyDuration: { type: Number, default: 60 } // in minutes
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
