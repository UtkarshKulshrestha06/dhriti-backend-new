const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin, requireTeacher } = require("../middleware/auth");

/**
 * GET /enrollments/:userId
 * List all batch enrollments for a specific user
 */
router.get("/:userId", requireAuth, async (req, res) => {
    const { userId } = req.params;

    // Only Admin or the User themselves can see this
    if (req.user.user_metadata?.role !== 'ADMIN' && req.user.id !== userId) {
        return res.status(403).json({ error: "Unauthorized access" });
    }

    const { data, error } = await supabase
        .from("enrollments")
        .select("batch_id, enrolled_at")
        .eq("user_id", userId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

/**
 * GET /enrollments/batch/:batchId
 * List all users enrolled in a specific batch
 */
router.get("/batch/:batchId", requireAuth, requireTeacher, async (req, res) => {
    const { batchId } = req.params;

    const { data, error } = await supabase
        .from("enrollments")
        .select(`
            enrolled_at,
            user:users(*)
        `)
        .eq("batch_id", batchId);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Flatten for easier frontend consumption
    const users = data.map(dim => ({
        ...dim.user,
        enrolled_at: dim.enrolled_at
    }));

    res.json(users);
});

/**
 * POST /enrollments
 * Admin: Enroll a user in a batch
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
    const { user_id, batch_id } = req.body;

    if (!user_id || !batch_id) {
        return res.status(400).json({ error: "user_id and batch_id are required" });
    }

    const { data, error } = await supabase
        .from("enrollments")
        .insert([{ user_id, batch_id }])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: data[0] });
});

/**
 * DELETE /enrollments
 * Admin: Remove a user from a batch
 */
router.delete("/", requireAuth, requireAdmin, async (req, res) => {
    const { user_id, batch_id } = req.body;

    if (!user_id || !batch_id) {
        return res.status(400).json({ error: "user_id and batch_id are required" });
    }

    const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("user_id", user_id)
        .eq("batch_id", batch_id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
});

module.exports = router;
