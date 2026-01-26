const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// =======================
// GET STREAMS (PUBLIC)
// =======================
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("streams")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    count: data.length,
    streams: data
  });
});

// =======================
// CREATE STREAM (ADMIN)
// =======================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title required" });
  }

  const { data, error } = await supabase
    .from("streams")
    .insert({ title, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

module.exports = router;
