const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// =======================
// SUBMIT INQUIRY (PUBLIC)
// =======================
router.post("/", async (req, res) => {
    const { name, email, phone, message, batch_interest } = req.body;

    if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone are required" });
    }

    const { data, error } = await supabase
        .from("inquiries")
        .insert({
            name,
            email,
            phone,
            message,
            batch_interest
        })
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
});

// =======================
// LIST INQUIRIES (ADMIN)
// =======================
router.get("/", requireAuth, requireAdmin, async (req, res) => {
    const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

module.exports = router;
