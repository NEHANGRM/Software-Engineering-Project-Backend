const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.send('Academic Planner Backend Running');
});

// 🔹 ADD THIS
// 🔹 REGISTER ROUTES
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);

const timetableRoutes = require("./routes/timetableRoutes");
app.use("/api/timetable", timetableRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const intelligentRoutes = require("./routes/intelligentroutes");
app.use("/api/intelligence", intelligentRoutes);


module.exports = app;
