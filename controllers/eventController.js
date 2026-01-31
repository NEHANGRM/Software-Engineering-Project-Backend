const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ userId: req.user._id });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const event = new Event({ ...req.body, userId: req.user._id });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
