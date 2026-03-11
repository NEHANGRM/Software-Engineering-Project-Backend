const Event = require('../models/Event');
const User = require('../models/User');

const PLANET_RANKS = [
    'Neptune',
    'Uranus',
    'Saturn',
    'Jupiter',
    'Mars',
    'Earth',
    'Venus',
    'Mercury',
    'Sun'
];

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
        // Destructure using keys sent by Frontend (AddEventModal.jsx)
        // Frontend sends: title, type, category, startTime, endTime, location, notes, priority, important, reminders
        const {
            title,
            type,
            classification,
            category,
            startTime,
            startDate, // fallback
            endTime,
            endDate,   // fallback 
            location,
            notes,
            description, // fallback
            priority,
            important,
            isImportant, // fallback
            reminders,
            estimatedDuration,
            isCompleted
        } = req.body;

        // Handle both 'type' and 'classification' for backward/forward compatibility
        const eventType = classification || type || 'event';

        // Handle field aliases (Frontend -> Backend Model)
        const eventStart = startTime || startDate;
        const eventEnd = endTime || endDate;
        const eventNotes = notes || description;
        const eventImportant = important !== undefined ? important : (isImportant !== undefined ? isImportant : false);

        if (!eventStart) {
            return res.status(400).json({ error: "Start time is required" });
        }

        const newEvent = new Event({
            userId: req.user._id,
            title,
            classification: eventType,
            type: eventType, // Keep both populated for safety
            startTime: eventStart,
            endTime: eventEnd,
            location,
            notes: eventNotes,
            isCompleted: isCompleted || false,
            priority: priority || 'medium',
            estimatedDuration,
            isImportant: eventImportant,
            reminders: reminders || [],
            category: category
        });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (err) {
        console.error("Create Event Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json({ message: "Event deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['upcoming', 'present', 'absent', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
        if (!event) return res.status(404).json({ message: "Event not found" });

        const previousStatus = event.attendanceStatus || 'upcoming';
        if (previousStatus === status) {
            return res.json({ event, message: "Status unchanged" });
        }

        const user = await User.findById(req.user._id);
        if (!user.gamification) {
            user.gamification = { points: 0, eventsCompleted: 0, rank: 'Neptune' };
        }

        let pointChange = 0;
        let eventCountChange = 0;

        // Undo previous status effects
        if (previousStatus === 'present' && event.classification !== 'class') {
            pointChange -= 10;
            eventCountChange -= 1;
        } else if (previousStatus === 'absent') {
            pointChange += 5; // give back penalty
        }

        // Apply new status effects
        if (status === 'present' && event.classification !== 'class') {
            pointChange += 10;
            eventCountChange += 1;
        } else if (status === 'absent') {
            pointChange -= 5; // penalty
        }

        // Apply changes
        user.gamification.points = Math.max(0, user.gamification.points + pointChange);
        user.gamification.eventsCompleted = Math.max(0, user.gamification.eventsCompleted + eventCountChange);

        // Calculate rank based on every 10 events completed
        const rankIndex = Math.min(
            PLANET_RANKS.length - 1, 
            Math.floor(user.gamification.eventsCompleted / 10)
        );
        const newRank = PLANET_RANKS[rankIndex];
        
        const rankChanged = user.gamification.rank !== newRank;
        const oldRank = user.gamification.rank;
        user.gamification.rank = newRank;

        // Save
        event.attendanceStatus = status;
        if (status === 'present' || status === 'cancelled') {
            event.isCompleted = true;
        } else {
            event.isCompleted = false;
        }

        await event.save();
        await user.save();

        res.json({
            event,
            user,
            gamification: {
                pointChange,
                totalPoints: user.gamification.points,
                rankChanged,
                oldRank,
                newRank,
                isPromotion: rankChanged && PLANET_RANKS.indexOf(newRank) > PLANET_RANKS.indexOf(oldRank)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
