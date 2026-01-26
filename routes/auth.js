const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

/**
 * POST /auth/login
 * Logs in user using Supabase Auth
 * Then fetches application role from users table
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  try {
    // 1️⃣ Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const userId = data.user.id;

    // 2️⃣ Fetch application role from users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, first_name, last_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        error: "User role not assigned. Contact admin."
      });
    }

    // 3️⃣ Return clean response to frontend
    res.json({
      token: data.session.access_token,
      user: {
        id: userId,
        email: data.user.email,
        role: profile.role, // ADMIN / TEACHER / STUDENT
        first_name: profile.first_name || null,
        last_name: profile.last_name || null
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      error: "Login failed"
    });
  }
});

module.exports = router;
