const { createClient } = require("@supabase/supabase-js");

const BUCKET = "uploads";
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

async function uploadFile(buffer, filename, contentType) {
  const client = getSupabase();
  if (!client) throw new Error("Supabase not configured");
  const { error } = await client.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: true });
  if (error) throw error;
  return filename;
}

async function deleteFile(path) {
  const client = getSupabase();
  if (!client) return;
  const cleanPath = path.replace(/^\/+/, "");
  await client.storage.from(BUCKET).remove([cleanPath]);
}

function getPublicUrl(path) {
  const client = getSupabase();
  if (!client) return path;
  const cleanPath = path.replace(/^\/+/, "");
  const { data } = client.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || path;
}

module.exports = { uploadFile, deleteFile, getPublicUrl, getSupabase };
