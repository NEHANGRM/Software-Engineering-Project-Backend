const mongoose = require("mongoose");

const timetableEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    courseName: { type: String, required: true },
    courseCode: String,
    instructor: String,
    room: String,

    // 1 = Monday, 7 = Sunday
    daysOfWeek: [{ type: Number }],

    // Storing time as Date objects (ignoring date part) or ISO strings
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    semesterStart: Date,
    semesterEnd: Date,

    category: String, // Category ID

    excludedDates: [String], // ISO date strings "YYYY-MM-DD"

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("TimetableEntry", timetableEntrySchema);
