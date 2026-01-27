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
const enrollmentsRoutes = require("./routes/enrollments");

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
app.use("/enrollments", enrollmentsRoutes);

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
app.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch enrolled batches
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("batch_id")
      .eq("user_id", userId);

    const subscribedBatchIds = enrollments ? enrollments.map(e => e.batch_id) : [];

    res.json({
      ...req.user,
      subscribedBatchIds
    });
  } catch (err) {
    console.error("ME ERROR:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
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
  console.log("Environment Check:");
  console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing");
  console.log("- SUPABASE_KEY:", process.env.SUPABASE_KEY ? "✅ Set" : "❌ Missing");
  console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Missing");
});
