const { validationResult } = require('express-validator');

const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));

        const errorMessages = formattedErrors.map(err => err.message).join(', ');
        
        return res.status(400).json({
            success: false,
            message: errorMessages,
            errors: formattedErrors
        });
    }
    next();
};

module.exports = { validateResult };
