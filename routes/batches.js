const express = require("express");
const router = express.Router();

const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// =======================
// GET ALL BATCHES (PUBLIC)
// =======================
router.get("/", async (req, res) => {
  const { stream } = req.query;

  let query = supabase
    .from("batches")
    .select(`
      *,
      streams (
        title
      )
    `)
    .order("created_at", { ascending: true });

  if (stream) {
    query = query.eq("stream_id", stream);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Format response to match frontend expectations if necessary
  const formattedData = data.map(batch => ({
    ...batch,
    stream_name: batch.streams?.title
  }));

  res.json({
    count: formattedData.length,
    batches: formattedData
  });
});

// =======================
// GET SINGLE BATCH (PUBLIC)
// =======================
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("batches")
    .select("*, streams(title)")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({ error: "Batch not found" });
  }

  res.json(data);
});

// =======================
// CREATE BATCH (ADMIN)
// =======================
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    id,
    stream_id,
    title,
    subtitle,
    description,
    class_name,
    target_year,
    batch_date,
    end_date,
    duration,
    price,
    registration_fee,
    syllabus_url,
    image_url,
    color_theme
  } = req.body;

  if (!id || !title) {
    return res.status(400).json({ error: "Batch ID and title are required" });
  }

  const { data, error } = await supabase
    .from("batches")
    .insert({
      id,
      stream_id,
      title,
      subtitle,
      description,
      class_name,
      target_year,
      batch_date,
      end_date,
      duration,
      price,
      registration_fee,
      syllabus_url,
      image_url,
      color_theme
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// =======================
// DELETE BATCH (ADMIN)
// =======================
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

module.exports = router;
