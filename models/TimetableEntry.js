const mongoose = require('mongoose');

const TimetableEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true },
    courseCode: { type: String },
    instructor: { type: String },
    room: { type: String },
    daysOfWeek: [{ type: Number, required: true }], // 1=Monday, 7=Sunday
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },   // "HH:mm"
    semesterStart: { type: Date },
    semesterEnd: { type: Date },
    color: { type: String },
    category: { type: String },
    excludedDates: [{ type: String }], // ISO date strings 'YYYY-MM-DD'
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimetableEntry', TimetableEntrySchema);

