const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// GET subjects for a batch (PUBLIC)
router.get("/", async (req, res) => {
  const { batch } = req.query;
  if (!batch) {
    return res.status(400).json({ error: "batch required" });
  }

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("batch_id", batch)
    .order("order_index");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CREATE subject (TEACHER)
router.post("/", requireAuth, requireTeacher, async (req, res) => {
  const { batch_id, name, order_index } = req.body;

  if (!batch_id || !name) {
    return res.status(400).json({ error: "batch_id and name required" });
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({ batch_id, name, order_index })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
