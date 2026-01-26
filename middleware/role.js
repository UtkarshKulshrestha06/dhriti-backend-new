function requireTeacher(req, res, next) {
  const role = req.user?.user_metadata?.role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return res.status(403).json({ error: "Teacher only" });
  }
  next();
}

module.exports = { requireTeacher };
