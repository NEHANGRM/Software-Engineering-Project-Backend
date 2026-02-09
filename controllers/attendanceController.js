const AttendanceRecord = require('../models/AttendanceRecord');

exports.getAttendance = async (req, res) => {
    try {
        const attendance = await AttendanceRecord.find({ userId: req.user._id });
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const record = new AttendanceRecord({ ...req.body, userId: req.user._id });
        await record.save();
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    try {
        await AttendanceRecord.findByIdAndDelete(req.params.id);
        res.json({ message: "Record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const attendance = await AttendanceRecord.find({ userId: req.user._id });
        // Calculate stats logic here or just return raw data for frontend to calculate
        // Frontend attendanceService.js seems to expect raw data mainly or specific stats endpoint?
        // Let's check service. If it calls /stats, we provide it.
        // Assuming simple aggregation for now if needed, but getAttendance covers raw data.
        res.json(attendance); // Placeholder if specific stats endpoint needed
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
