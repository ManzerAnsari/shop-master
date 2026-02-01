// middleware/validate.js
/**
 * validate(schema) - middleware to validate req.body with a zod schema.
 * On success: attaches req.validatedData and calls next()
 * On failure: returns 400 with structured errors
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (result.success) {
    // Optionally normalize some fields (email lowercasing)
    const data = { ...result.data };
    if (data.email && typeof data.email === "string")
      data.email = data.email.toLowerCase();
    req.validatedData = data;
    return next();
  }

  // Format zod issues into field => [messages]
  const errors = {};
  for (const issue of result.error.issues) {
    const path = issue.path.length ? issue.path.join(".") : "_";
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  }

  return res.status(400).json({
    message: "Validation failed",
    errors,
  });
};
