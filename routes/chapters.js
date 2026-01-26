const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

/**
 * =======================
 * GET chapters (PUBLIC)
 * =======================
 * ?batch=c1&subject=<subject_id>
 */
router.get("/", async (req, res) => {
  const { batch, subject } = req.query;

  if (!batch || !subject) {
    return res.status(400).json({
      error: "batch and subject are required"
    });
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("batch_id", batch)
    .eq("subject_id", subject)
    .order("chapter_number");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * =======================
 * CREATE chapter (TEACHER)
 * =======================
 */
router.post("/", requireAuth, requireTeacher, async (req, res) => {
  const { batch_id, subject_id, title, chapter_number } = req.body;

  if (!batch_id || !subject_id || !title) {
    return res.status(400).json({
      error: "batch_id, subject_id and title are required"
    });
  }

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      batch_id,
      subject_id,
      title,
      chapter_number
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * =======================
 * UPDATE chapter (TEACHER)
 * =======================
 */
router.put("/:id", requireAuth, requireTeacher, async (req, res) => {
  const { id } = req.params;

  const { error, data } = await supabase
    .from("chapters")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * =======================
 * DELETE chapter (TEACHER)
 * =======================
 */
router.delete("/:id", requireAuth, requireTeacher, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("chapters")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

module.exports = router;
