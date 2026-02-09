const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true },
    date: { type: Date, required: true },
<<<<<<< HEAD
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused', 'cancelled'],
        default: 'present'
    },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

=======
    status: { type: String, enum: ['present', 'absent', 'late', 'excused', 'cancelled'], required: true },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Composite index to prevent duplicate records for same course/date/user
AttendanceRecordSchema.index({ userId: 1, courseName: 1, date: 1 }, { unique: true });

>>>>>>> 6158b10430d884491b82828fc72af39cabc7e9f3
module.exports = mongoose.model('AttendanceRecord', AttendanceRecordSchema);
