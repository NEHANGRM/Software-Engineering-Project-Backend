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
/* =====================================================
   5️⃣ STUDY SESSION SCHEDULER (AI POWERED)
===================================================== */
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.suggestStudySessions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API Key is missing. Please add GEMINI_API_KEY to your .env file."
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Helper to format date to readable time (IST)
    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    // Fetch active tasks (assignments/exams)
    const tasksRaw = await Event.find({
      userId,
      classification: { $in: ["assignment", "exam"] },
      isCompleted: false,
      $or: [
        { endTime: { $gte: new Date() } }, // Future deadline
        { endTime: null }
      ]
    }).select("title classification priority estimatedDuration endTime");

    const tasks = tasksRaw.map(t => ({
      title: t.title,
      priority: t.priority,
      duration: t.estimatedDuration,
      deadline: t.endTime ? t.endTime.toDateString() + " " + formatTime(t.endTime) : "None"
    }));

    // Fetch fixed events (classes/meetings) to identify busy times
    const fixedEventsRaw = await Event.find({
      userId,
      classification: { $in: ["class", "meeting", "other"] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).select("title startTime endTime");

    const fixedEvents = fixedEventsRaw.map(e => ({
      title: e.title,
      start: formatTime(e.startTime),
      end: formatTime(e.endTime)
    }));

    // Construct the prompt for AI
    const prompt = `
      You are an intelligent academic planner. Create a daily study plan for a student based on their tasks and fixed schedule.
      
      Current Date: ${date.toDateString()}
      
      Fixed Events (Users CANNOT study during these times):
      ${JSON.stringify(fixedEvents)}
      
      Pending Tasks (Prioritize based on deadline and priority):
      ${JSON.stringify(tasks)}
      
      Generate a structured schedule for the day (08:00 to 22:00).
      - IMPORTANT: Do NOT schedule any study sessions during 'Fixed Events'.
      - Allocate time for fixed events exactly as they are listed.
      - Fill free gaps with study sessions.
      - Include short breaks.
      - If a task has a near deadline, prioritize it.
      
      Return the response in strictly valid JSON format with this structure:
      {
        "date": "YYYY-MM-DD",
        "sessions": [
          { 
            "task": "Task or Event Name", 
            "startTime": "HH:mm", 
            "endTime": "HH:mm", 
            "type": "study/class/break/other", 
            "note": "Strategy or focus" 
          }
        ],
        "summary": "Brief summary of the plan"
      }
      Do not include any markdown formatting (like \`\`\`json). Just return the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up if AI wraps in markdown code blocks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const studyPlan = JSON.parse(cleanJson);

    res.json(studyPlan);

  } catch (err) {
    console.error("AI Study Plan Error:", err);
    if (err.response) {
      console.error("Error Details:", await err.response.text());
    }
    res.status(500).json({ message: "Failed to generate study plan", error: err.message });
  }
};
