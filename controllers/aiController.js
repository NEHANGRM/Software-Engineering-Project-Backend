const Task = require('../models/Task');
const StudySession = require('../models/StudySession');
const User = require('../models/User');

exports.generateStudyPlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        // 1. Get unfinished tasks with deadlines
        const tasks = await Task.find({
            userId,
            isCompleted: false,
            deadline: { $exists: true, $ne: null }
        }).sort({ deadline: 1 }); // Sort by closest deadline

        if (tasks.length === 0) {
            return res.json({ message: "No tasks with deadlines found to plan.", sessions: [] });
        }

        // 2. Clear existing separate planned sessions to re-plan?
        // For MVP, let's assume we just generate new ones or append. 
        // Let's delete future 'planned' sessions to Avoid duplicates if re-running.
        await StudySession.deleteMany({ userId, status: 'planned', startTime: { $gt: new Date() } });

        const sessions = [];
        let currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + 30); // Start planning from 30 mins from now

        // Simple heuristic: Work between 9am and 9pm? 
        // Or use user settings?
        // Let's use user settings or defaults.
        const sleepStart = parseInt(user.settings?.sleepTimeStart?.split(':')[0] || "23");
        const sleepEnd = parseInt(user.settings?.sleepTimeEnd?.split(':')[0] || "7");

        for (const task of tasks) {
            let durationNeeded = task.estimatedDuration || 60; // Default 1 hour if not specified

            while (durationNeeded > 0) {
                // Find next available slot
                // Simple check: is currentTime inside sleep window?
                let currentHour = currentTime.getHours();
                if (currentHour >= sleepStart || currentHour < sleepEnd) {
                    // Fast forward to wake up time
                    currentTime.setHours(sleepEnd, 0, 0, 0);
                    if (currentTime < new Date()) currentTime.setDate(currentTime.getDate() + 1); // Move to next day if needed
                }

                // Create a session block (e.g., 60 mins or remaining time)
                let sessionDuration = Math.min(durationNeeded, user.settings?.preferredStudyDuration || 60);

                let sessionEnd = new Date(currentTime);
                sessionEnd.setMinutes(sessionEnd.getMinutes() + sessionDuration);

                const session = new StudySession({
                    userId,
                    relatedTaskId: task._id,
                    startTime: new Date(currentTime),
                    endTime: sessionEnd,
                    status: 'planned',
                    reasoning: `Deadline is ${new Date(task.deadline).toLocaleDateString()}, highly prioritized.`
                });

                sessions.push(session);
                await session.save();

                durationNeeded -= sessionDuration;
                currentTime = sessionEnd;
                // Add a small break? 10 mins
                currentTime.setMinutes(currentTime.getMinutes() + 10);
            }
        }

        res.json({ message: "Study plan generated", count: sessions.length, sessions });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getInsights = async (req, res) => {
    // Return some basic analytics
    try {
        const userId = req.user._id;
        const totalTasks = await Task.countDocuments({ userId });
        const completedTasks = await Task.countDocuments({ userId, isCompleted: true });

        // Check for missed sessions
        const missedSessions = await StudySession.countDocuments({
            userId,
            status: 'planned',
            endTime: { $lt: new Date() }
        });

        // Simple procrastination detection: delayed tasks?
        // For now just return counts.
        res.json({
            totalTasks,
            completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
            missedDeadlineWarnings: missedSessions > 0 ? "You have missed study sessions. Consider rescheduling." : "On track!"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
