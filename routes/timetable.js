const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// =======================
// GET TIMETABLE
// =======================
router.get("/", requireAuth, async (req, res) => {
    const { batch } = req.query;

    if (!batch) {
        return res.status(400).json({ error: "batch is required" });
    }

    const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("batch_id", batch)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// =======================
// UPDATE TIMETABLE (TEACHER)
// =======================
router.put("/:batchId", requireAuth, requireTeacher, async (req, res) => {
    const { batchId } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: "items array is required" });
    }

    // Transaction-like approach (Delete then Insert)
    const { error: deleteError } = await supabase
        .from("timetable")
        .delete()
        .eq("batch_id", batchId);

    if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
    }

    const formattedItems = items.map(item => ({
        batch_id: batchId,
        date: item.date || new Date().toISOString().split('T')[0],
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        subject: item.subject,
        topic: item.topic,
        faculty: item.faculty
    }));

    const { data, error: insertError } = await supabase
        .from("timetable")
        .insert(formattedItems)
        .select();

    if (insertError) {
        return res.status(500).json({ error: insertError.message });
    }

    res.json(data);
});

module.exports = router;
