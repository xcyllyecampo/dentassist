const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    if (source === "body") req.body = result.data;
    next();
  };
};

module.exports = validate;
