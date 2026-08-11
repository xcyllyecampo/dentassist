function normalizePhone(value) {
  if (value === null || value === undefined) return value;
  const digits = String(value).replace(/\D/g, "").slice(0, 11);
  return digits || null;}

module.exports = { normalizePhone };
