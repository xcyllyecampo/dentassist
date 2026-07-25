const { createClient } = require("@supabase/supabase-js");

const BUCKET = "uploads";
let supabase = null;
let bucketEnsured = false;

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

async function ensureBucket() {
  if (bucketEnsured) return;
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.storage.getBucket(BUCKET);
  if (error) {
    console.log(`[storage] Bucket "${BUCKET}" not found, creating...`);
    const { error: createErr } = await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/dicom", "application/dicom"],
    });
    if (createErr) console.error("[storage] Failed to create bucket:", createErr.message);
    else console.log(`[storage] Bucket "${BUCKET}" created successfully`);
  }
  bucketEnsured = true;
}

async function uploadFile(buffer, filename, contentType) {
  const client = getSupabase();
  if (!client) throw new Error("Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
  await ensureBucket();
  const { error } = await client.storage.from(BUCKET).upload(filename, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  return filename;
}

async function deleteFile(filePath) {
  const client = getSupabase();
  if (!client) return;
  const cleanPath = filePath.replace(/^\/+/, "");
  await client.storage.from(BUCKET).remove([cleanPath]);
}

function getPublicUrl(filePath) {
  const client = getSupabase();
  if (!client) return filePath;
  const cleanPath = filePath.replace(/^\/+/, "");
  const { data } = client.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || filePath;
}

module.exports = { uploadFile, deleteFile, getPublicUrl, getSupabase };
