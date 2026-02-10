const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused', 'cancelled'],
        default: 'present',
        required: true
    },
    notes: { type: String }, // Unified to 'notes'
    createdAt: { type: Date, default: Date.now }
});

// Composite index to prevent duplicate records for same course/date/user
AttendanceRecordSchema.index({ userId: 1, courseName: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
