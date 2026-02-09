const AttendanceRecord = require('../models/AttendanceRecord');

exports.getAttendance = async (req, res) => {
    try {
        const records = await AttendanceRecord.find({ userId: req.user._id });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAttendance = async (req, res) => {
    try {
        const { courseName, date, status } = req.body;

        // Upsert (Update if exists, else Insert) to prevent duplicates for same day
        const record = await AttendanceRecord.findOneAndUpdate(
            {
                userId: req.user._id,
                courseName: courseName,
                date: new Date(date)
            },
            { ...req.body, userId: req.user._id },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAttendance = async (req, res) => {
    try {
        const record = await AttendanceRecord.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!record) return res.status(404).json({ message: "Record not found" });
        res.json({ message: "Record deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAttendanceStats = async (req, res) => {
    try {
        const records = await AttendanceRecord.find({ userId: req.user._id });

        const stats = {};

        records.forEach(record => {
            if (!stats[record.courseName]) {
                stats[record.courseName] = {
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0
                };
            }

            if (record.status !== 'cancelled') {
                stats[record.courseName].total++;
                stats[record.courseName][record.status]++;
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
