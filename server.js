// =======================
// LOAD ENV
// =======================
require("dotenv").config();

// =======================
// IMPORTS
// =======================
const express = require("express");
const cors = require("cors");

// ROUTES
const streamsRoutes = require("./routes/streams");
const batchesRoutes = require("./routes/batches");
const subjectsRoutes = require("./routes/subjects");
const chaptersRoutes = require("./routes/chapters");
const resourcesRoutes = require("./routes/resources");
const freebiesRoutes = require("./routes/freebies");
const inquiriesRoutes = require("./routes/inquiries");
const announcementsRoutes = require("./routes/announcements");
const timetableRoutes = require("./routes/timetable");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");

// CORE
const supabase = require("./supabaseClient");
const { requireAuth } = require("./middleware/auth");

// =======================
// APP SETUP
// =======================
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.send("Dhriti Backend running 🚀");
});

// =======================
// AUTH / USERS
// =======================
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

// =======================
// STATIC DATA (READ-ONLY)
// =======================
app.use("/streams", streamsRoutes);
app.use("/batches", batchesRoutes);
app.use("/freebies", freebiesRoutes);

// =======================
// ACADEMIC CONTENT
// =======================
app.use("/subjects", subjectsRoutes);
app.use("/chapters", chaptersRoutes);
app.use("/resources", resourcesRoutes);

// =======================
// AUTH TEST ROUTE
// =======================
app.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

app.use("/inquiries", inquiriesRoutes);
app.use("/announcements", announcementsRoutes);
app.use("/timetable", timetableRoutes);

// =======================
// DB TEST ROUTE
// =======================
app.get("/db-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({ error: "DB test failed" });
  }
});

// =======================
// 404 HANDLER
// =======================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// =======================
// GLOBAL ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
