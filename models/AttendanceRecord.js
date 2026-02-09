const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused', 'cancelled'],
        default: 'present'
    },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
