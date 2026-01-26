const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// =======================
// LIST ANNOUNCEMENTS
// =======================
router.get("/", requireAuth, async (req, res) => {
    const { batch } = req.query;

    if (!batch) {
        return res.status(400).json({ error: "batch_id is required" });
    }

    const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("batch_id", batch)
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// =======================
// CREATE ANNOUNCEMENT (TEACHER)
// =======================
router.post("/", requireAuth, requireTeacher, async (req, res) => {
    const { batch_id, title, message, is_important, tags } = req.body;

    if (!batch_id || !title || !message) {
        return res.status(400).json({ error: "batch_id, title and message are required" });
    }

    const { data, error } = await supabase
        .from("announcements")
        .insert({
            batch_id,
            title,
            message,
            is_important: is_important || false,
            tags: tags || [],
            author_id: req.user.id
        })
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// =======================
// UPDATE ANNOUNCEMENT (TEACHER)
// =======================
router.put("/:id", requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("announcements")
        .update(req.body)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

// =======================
// DELETE ANNOUNCEMENT (TEACHER)
// =======================
router.delete("/:id", requireAuth, requireTeacher, async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
});

module.exports = router;
