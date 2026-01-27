const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { requireAuth, requireAdmin } = require("../middleware/auth");

/**
 * GET /users
 * Admin: list all users
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
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
    firstName,
    first_name,
    lastName,
    last_name,
    phone,
    subject
  } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      error: "Email, password and role required"
    });
  }

  // 1. Create auth user with metadata
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || firstName || null,
        last_name: last_name || lastName || null,
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

  // Map camelCase to snake_case for Supabase
  const updateData = {};
  if (req.body.firstName !== undefined || req.body.first_name !== undefined)
    updateData.first_name = req.body.first_name || req.body.firstName;
  if (req.body.lastName !== undefined || req.body.last_name !== undefined)
    updateData.last_name = req.body.last_name || req.body.lastName;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.subject !== undefined) updateData.subject = req.body.subject;
  if (req.body.role !== undefined) updateData.role = req.body.role;

  // 1. Update Profile in public.users
  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 2. Sync to Auth Metadata
  // We fetch existing metadata first to prevent wiping fields NOT sent in this request
  const { data: userData, error: fetchError } = await supabase.auth.admin.getUserById(id);

  if (!fetchError && userData?.user) {
    const existingMeta = userData.user.user_metadata || {};
    const newMeta = {
      ...existingMeta,
      first_name: updateData.first_name !== undefined ? updateData.first_name : existingMeta.first_name,
      last_name: updateData.last_name !== undefined ? updateData.last_name : existingMeta.last_name,
      phone: updateData.phone !== undefined ? updateData.phone : existingMeta.phone,
      role: updateData.role !== undefined ? updateData.role : existingMeta.role,
      subject: updateData.subject !== undefined ? updateData.subject : existingMeta.subject
    };

    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: newMeta
    });

    if (authError) {
      console.error("Warning: Could not sync auth metadata:", authError.message);
    }
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
