const { body, check } = require("express-validator");
const User = require("../models/user");
const { BadRequestError } = require("./apiError");
const validatorMiddleware = require('./validator');




exports.registerValidator = [
    check('username').notEmpty().withMessage('UserName is Requried'),
    check('email').notEmpty().withMessage('Email is Required').isEmail().withMessage('Email not valid').custom(async (value, { req }) => {
        // const user = await User.findOne({ email: value });
        // if (user) {
        //     throw new BadRequestError('Email already exist');
        // }
        return true;
    }),
    check('password').notEmpty().withMessage('Password is Required').custom((value, { req }) => {
        if (value.length < 6) {
            throw new BadRequestError('Password must be at least 6 characters');
        }
        return true;
    }),
    validatorMiddleware
]


exports.loginValidator = [
    body('email').notEmpty().withMessage('Email is Required').isEmail().withMessage('Email not valid'),
    body('password').notEmpty().withMessage('Password is Required'),
    validatorMiddleware
]