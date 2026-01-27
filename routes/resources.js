const express = require("express");
const router = express.Router();
const multer = require("multer");

const supabase = require("../supabaseClient");
const { requireAuth, requireTeacher } = require("../middleware/auth");

// Multer memory storage
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

/**
 * =======================
 * GET PDFs (PUBLIC)
 * =======================
 * ?batch=c1&subject=<id>&chapter=<id?>
 */
router.get("/", async (req, res) => {
  const { batch, subject, chapter } = req.query;

  if (!batch || !subject) {
    return res.status(400).json({
      error: "batch and subject required"
    });
  }

  let query = supabase
    .from("resources")
    .select("*")
    .eq("batch_id", batch)
    .eq("subject_id", subject)
    .order("created_at", { ascending: false });

  if (chapter) {
    query = query.eq("chapter_id", chapter);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * =======================
 * UPLOAD PDF (TEACHER)
 * =======================
 */
router.post(
  "/upload",
  requireAuth,
  requireTeacher,
  upload.single("pdf"),
  async (req, res) => {
    try {
      const file = req.file;
      const {
        batch_id,
        subject_id,
        chapter_id,
        title,
        type
      } = req.body;

      if (!file || !batch_id || !subject_id || !title || !type) {
        return res.status(400).json({
          error: "Missing required fields"
        });
      }

      const filePath = `${batch_id}/${subject_id}/${Date.now()}-${file.originalname}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("batch-resources")
        .upload(filePath, file.buffer, {
          contentType: "application/pdf"
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("batch-resources")
        .getPublicUrl(filePath);

      // Save metadata
      const { data, error } = await supabase
        .from("resources")
        .insert({
          batch_id,
          subject_id,
          chapter_id: chapter_id || null,
          title,
          type,
          file_url: urlData.publicUrl,
          file_size: file.size,
          uploaded_by: req.user.id
        })
        .select()
        .single();

      if (error) throw error;

      res.json(data);

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

/**
 * =======================
 * DELETE PDF (TEACHER)
 * =======================
 */
router.delete("/:id", requireAuth, requireTeacher, async (req, res) => {
  const { id } = req.params;

  // Fetch file first
  const { data: resource, error } = await supabase
    .from("resources")
    .select("file_url")
    .eq("id", id)
    .single();

  if (error || !resource) {
    return res.status(404).json({ error: "File not found" });
  }

  // Extract path from public URL
  const path = resource.file_url.split("/batch-resources/")[1];

  // Delete from storage
  await supabase.storage
    .from("batch-resources")
    .remove([path]);

  // Delete DB record
  await supabase
    .from("resources")
    .delete()
    .eq("id", id);

  res.json({ success: true });
});


module.exports = router;
