const express = require("express");
const router = express.Router();
const multer = require("multer");

const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// Multer (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"));
    }
  }
});

// =======================
// GET FREEBIES (PUBLIC)
// =======================
router.get("/", async (req, res) => {
  const { subject, type } = req.query;

  let query = supabase
    .from("freebies")
    .select("*")
    .order("created_at", { ascending: false });

  if (subject) query = query.eq("subject", subject);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// =======================
// UPLOAD FREEBIE PDF
// =======================
router.post(
  "/upload",
  requireAuth,
  requireTeacher,
  upload.single("pdf"),
  async (req, res) => {
    try {
      const { subject, type, title } = req.body;
      const file = req.file;

      if (!file || !subject || !type || !title) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const filePath = `${subject}/${type}/${Date.now()}-${file.originalname}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("freebies")
        .upload(filePath, file.buffer, {
          contentType: "application/pdf"
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("freebies")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Save metadata to DB
      const { data, error } = await supabase
        .from("freebies")
        .insert({
          subject,
          type,
          title,
          file_url: fileUrl
        })
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        file: data
      });

    } catch (err) {
      console.error("UPLOAD CRITICAL ERROR:", err);
      if (err?.message) console.error("Error Message:", err.message);
      if (err?.code) console.error("Error Code:", err.code);
      // Check for Supabase specific structure
      if (err?.error) console.error("Supabase Error:", err.error);

      res.status(500).json({
        error: "Upload failed",
        details: err.message || "Unknown server error"
      });
    }
  }
);

module.exports = router;
