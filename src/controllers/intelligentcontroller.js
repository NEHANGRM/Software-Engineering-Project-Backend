const Event = require("../models/Event");

/* ---------------- HELPER ---------------- */
const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (duration.includes("h")) return parseInt(duration) * 60;
  if (duration.includes("m")) return parseInt(duration);
  return 0;
};

/* =====================================================
   1️⃣ DAILY WORKLOAD
===================================================== */
exports.getDailyWorkload = async (req, res) => {
  try {
    const { userId } = req.params;
    const queryDate = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all events for the day
    const allEvents = await Event.find({
      userId,
      startTime: { $lte: endOfDay },
      endTime: { $gte: startOfDay }
    });

    // Split into Tasks (assignments/exams) and Fixed Events (classes/meetings)
    const tasks = allEvents.filter(e =>
      ["assignment", "exam", "other"].includes(e.classification) &&
      e.estimatedDuration
    );

    const fixedEvents = allEvents.filter(e =>
      ["class", "meeting"].includes(e.classification) ||
      (!["assignment", "exam"].includes(e.classification) && !e.estimatedDuration)
    );

    const totalTaskTime = tasks.reduce(
      (sum, t) => sum + parseDurationToMinutes(t.estimatedDuration), 0
    );

    const totalEventTime = fixedEvents.reduce((sum, e) => {
      const start = e.startTime < startOfDay ? startOfDay : e.startTime;
      const end = e.endTime > endOfDay ? endOfDay : e.endTime;
      return sum + (end - start) / 60000;
    }, 0);

    res.json({
      date: startOfDay,
      taskCount: tasks.length,
      eventCount: fixedEvents.length,
      totalTaskTime,
      totalEventTime,
      totalWorkloadMinutes: totalTaskTime + totalEventTime
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* =====================================================
   2️⃣ OVERCOMMITMENT CHECK
===================================================== */
exports.checkOvercommitment = async (req, res) => {
  try {
    const { userId } = req.params;
    const THRESHOLD = 480;

    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const allEvents = await Event.find({
      userId,
      startTime: { $lte: endOfDay },
      endTime: { $gte: startOfDay }
    });

    const tasks = allEvents.filter(e =>
      ["assignment", "exam"].includes(e.classification) || e.estimatedDuration
    );

    const fixedEvents = allEvents.filter(e =>
      ["class", "meeting"].includes(e.classification) && !e.estimatedDuration
    );

    const totalTaskTime = tasks.reduce(
      (sum, t) => sum + parseDurationToMinutes(t.estimatedDuration), 0
    );

    const totalEventTime = fixedEvents.reduce((sum, e) => {
      const start = e.startTime < startOfDay ? startOfDay : e.startTime;
      const end = e.endTime > endOfDay ? endOfDay : e.endTime;
      return sum + (end - start) / 60000;
    }, 0);

    const totalWorkload = totalTaskTime + totalEventTime;

    res.json({
      totalWorkload,
      overcommitment: totalWorkload > THRESHOLD,
      warning: totalWorkload > THRESHOLD ? "⚠️ Too much workload today" : "OK"
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* =====================================================
   3️⃣ PROCRASTINATION ANALYSIS
===================================================== */
exports.analyzeProcrastination = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    // Fetch all assignments/exams
    const tasks = await Event.find({
      userId,
      classification: { $in: ["assignment", "exam"] }
    });

    if (!tasks.length) return res.json({ message: "No tasks found" });

    // 1. MISSED DEADLINES (Strongest Indicator)
    // Tasks that are passed their deadline and NOT completed
    const missedTasks = tasks.filter(t =>
      !t.isCompleted && new Date(t.endTime || t.startTime) < now
    );

    // 2. LATE STAGE INACTION (Behavioral Indicator)
    // Active tasks where > 80% of the available time has passed, but still incomplete.
    // "Sitting on it until the last minute"
    const lateStartTasks = tasks.filter(t => {
      if (t.isCompleted) return false;

      const deadline = new Date(t.endTime || t.startTime);
      if (deadline < now) return false; // Already counted in missed

      const created = new Date(t.createdAt);
      const totalTime = deadline - created;
      const timeElapsed = now - created;

      // If > 80% of time passed and not done -> Procrastinating
      // Avoid division by zero
      return totalTime > 0 && (timeElapsed / totalTime) > 0.8;
    });

    const totalTracked = tasks.length;
    const badHabitCount = missedTasks.length + lateStartTasks.length;

    // Score: Percentage of tasks showing bad habits
    const procrastinationScore = Math.min(100, ((badHabitCount / totalTracked) * 100)).toFixed(1);

    let warning = "OK";
    if (procrastinationScore > 30) warning = "⚠️ Moderate procrastination detected";
    if (procrastinationScore > 60) warning = "🚨 High procrastination! You are missing deadlines.";

    res.json({
      totalTasks: totalTracked,
      missedDeadlines: missedTasks.length,
      rushingTasks: lateStartTasks.length, // "Danger Zone"
      procrastinationScore: `${procrastinationScore}%`,
      warning
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* =====================================================
   4️⃣ BURNOUT RISK ANALYSIS
===================================================== */
exports.analyzeBurnout = async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const THRESHOLD = 480;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overloadDays = 0;
    let totalWorkloadSum = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const tasks = await Event.find({
        userId,
        // Check for tasks due or working on this day
        startTime: { $gte: startOfDay, $lte: endOfDay },
        classification: { $in: ["assignment", "exam"] }
      });

      const taskMinutes = tasks.reduce(
        (sum, t) => sum + parseDurationToMinutes(t.estimatedDuration), 0
      );

      totalWorkloadSum += taskMinutes;
      if (taskMinutes > THRESHOLD) overloadDays++;
    }

    res.json({
      averageDailyWorkload: (totalWorkloadSum / days).toFixed(1),
      overloadDays,
      burnoutRisk: overloadDays >= Math.ceil(days / 2)
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* =====================================================
   5️⃣ STUDY SESSION SCHEDULER (AI)
===================================================== */
exports.suggestStudySessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(6, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(22, 0, 0, 0);

    const now = new Date();

    // We only care about today/future for scheduling slots
    // but looking at 'missed' tasks from the past is crucial.

    /* ---------------- GET TASKS ---------------- */

    // 1️⃣ MISSED TASKS (Reschedule Priority)
    // Tasks whose DEADLINE passed without completion
    const missedTasks = await Event.find({
      userId,
      isCompleted: false,
      classification: { $in: ["assignment", "exam"] },
      // Check if deadline (endTime) is before NOW
      $or: [
        { endTime: { $lt: now } },
        { endTime: null, startTime: { $lt: now } } // fallback if no endTime
      ]
    });

    // 2️⃣ NORMAL UPCOMING TASKS
    const upcomingTasks = await Event.find({
      userId,
      isCompleted: false,
      classification: { $in: ["assignment", "exam"] },
      // Deadline is in future
      $or: [
        { endTime: { $gte: now } },
        { endTime: null, startTime: { $gte: now } }
      ]
    }).sort({ isImportant: -1, priority: -1, startTime: 1 });

    // Merge: Missed first (for rescheduling)
    const tasks = [...missedTasks, ...upcomingTasks];

    /* ---------------- EVENTS (Generic Constraints) ---------------- */
    // Fetch fixed events that block time (classes, meetings, other)
    const events = await Event.find({
      userId,
      classification: { $in: ["class", "meeting", "other"] },
      startTime: { $lte: endOfDay },
      endTime: { $gte: startOfDay }
    });

    let freeSlots = [{ start: startOfDay, end: endOfDay }];

    // Remove event time from free slots
    events.forEach(e => {
      freeSlots = freeSlots.flatMap(slot => {
        if (slot.end <= e.startTime || slot.start >= e.endTime) return [slot];

        const slots = [];
        if (slot.start < e.startTime) slots.push({ start: slot.start, end: e.startTime });
        if (slot.end > e.endTime) slots.push({ start: e.endTime, end: slot.end });
        return slots;
      });
    });

    const sessions = [];

    /* ---------------- SCHEDULING ---------------- */
    for (const task of tasks) {
      let remaining = parseDurationToMinutes(task.estimatedDuration || "1h"); // Default 1h if missing

      const deadline = new Date(task.endTime || task.startTime);
      const isMissed = deadline < now;

      for (const slot of freeSlots) {
        const slotMinutes = (slot.end - slot.start) / 60000;
        if (remaining <= 0 || slotMinutes <= 0) continue;

        const alloc = Math.min(slotMinutes, remaining);

        sessions.push({
          task: task.title,
          category: task.category,
          startTime: slot.start.toTimeString().slice(0, 5),
          endTime: new Date(slot.start.getTime() + alloc * 60000)
            .toTimeString().slice(0, 5),
          type: isMissed ? "Rescheduled (Missed)" : "Study Session",
          isRescheduled: isMissed
        });

        slot.start = new Date(slot.start.getTime() + alloc * 60000);
        remaining -= alloc;
      }

      if (remaining > 0) {
        sessions.push({
          task: task.title,
          note: isMissed
            ? "CRITICALLY OVERDUE: No free slots to reschedule today!"
            : "Not enough free time today",
          type: "Unscheduled",
          isRescheduled: isMissed
        });
      }
    }

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      sessions
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
