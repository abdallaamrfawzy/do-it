const { validationResult } = require("express-validator");
const { BadRequestError } = require("../utils/apiError");

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }
  next();
};


module.exports = validatorMiddleware;