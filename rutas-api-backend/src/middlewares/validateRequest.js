export const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    params: req.params,
    body: req.body
  });

  if (!result.success) {
    return next(result.error);
  }

  if (result.data.params) {
    req.params = result.data.params;
  }
  if (result.data.body) {
    req.body = result.data.body;
  }

  return next();
};
