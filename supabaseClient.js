const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ MISSING SUPABASE CREDENTIALS IN ENVIRONMENT VARIABLES");
  console.error("SUPABASE_URL present:", !!supabaseUrl);
  console.error("SUPABASE_KEY present:", !!supabaseKey);
  // Don't crash immediately, let main server handle or crash gracefully
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
