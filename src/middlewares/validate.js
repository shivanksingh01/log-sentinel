const Joi = require('joi');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Default validation middleware using Joi
 * @param {Joi.ObjectSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        return ApiResponse.badRequest(res, 'Validation Error', errorMessages);
    }

    // Replace req.body with validated value (strips unknown)
    req.body = value;
    next();
};

module.exports = validate;
