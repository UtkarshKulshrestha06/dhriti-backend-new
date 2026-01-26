const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin } = require("../middleware/auth");

/**
 * GET /users
 * Admin: list all users
 */
router.get("/", requireAuth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * POST /users
 * Admin: create user
 *
 * IMPORTANT:
 * - Creates Supabase Auth user
 * - Passes profile data via user_metadata
 * - users table row is created by DB trigger
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const {
    email,
    password,
    role,
    first_name,
    last_name,
    phone,
    subject
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      error: "Email, password and role required"
    });
  }

  // 🚫 Safety: never allow these fields through
  delete req.body.full_name;
  delete req.body.name;

  // 1. Create auth user with metadata
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        role,
        subject: subject || null
      }
    });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  res.json({
    success: true,
    user_id: authData.user.id
  });
});

/**
 * PUT /users/:id
 * Admin: update user profile (NOT auth)
 */
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  // 🚫 Never allow these fields to be updated
  delete req.body.full_name;
  delete req.body.email;
  delete req.body.password;
  delete req.body.id;

  const { error } = await supabase
    .from("users")
    .update(req.body)
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

/**
 * DELETE /users/:id
 * Admin: delete user (auth + profile)
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  await supabase.auth.admin.deleteUser(id);
  await supabase.from("users").delete().eq("id", id);

  res.json({ success: true });
});

module.exports = router;
