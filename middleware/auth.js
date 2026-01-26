const supabase = require("../supabaseClient");

// =======================
// REQUIRE AUTH (ANY LOGGED-IN USER)
// =======================
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
}

// =======================
// REQUIRE TEACHER OR ADMIN
// =======================
function requireTeacher(req, res, next) {
  // Use metadata first, then fallback to database if needed (future)
  const role = req.user?.user_metadata?.role;

  if (role === "TEACHER" || role === "ADMIN") {
    return next();
  }

  return res.status(403).json({ error: "Teacher access required" });
}

// =======================
// REQUIRE ADMIN ONLY
// =======================
function requireAdmin(req, res, next) {
  const role = req.user?.user_metadata?.role;

  if (role === "ADMIN") {
    return next();
  }

  return res.status(403).json({ error: "Admin access required" });
}

// =======================
// EXPORTS
// =======================
module.exports = {
  requireAuth,
  requireTeacher,
  requireAdmin
};
