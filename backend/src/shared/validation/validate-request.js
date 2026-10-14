import mongoose from 'mongoose';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      const errorList = result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message
      }));
      const formattedMessages = errorList.map((e) => `${e.path}: ${e.message}`).join(', ');

      return res.status(400).json({
        success: false,
        message: `Validation error: ${formattedMessages}`,
        errors: errorList
      });
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;

    return next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: `Invalid input data: ${err.message}`
    });
  }
};

export const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName} parameter. Must be a valid ObjectId.`
    });
  }
  return next();
};

export default validateRequest;
