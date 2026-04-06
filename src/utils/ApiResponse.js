class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    static created(res, data = null, message = 'Created successfully') {
        return ApiResponse.success(res, data, message, 201);
    }

    static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };
        if (errors) {
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }

    static notFound(res, message = 'Resource not found') {
        return ApiResponse.error(res, message, 404);
    }

    static badRequest(res, message = 'Bad request', errors = null) {
        return ApiResponse.error(res, message, 400, errors);
    }

    static unauthorized(res, message = 'Unauthorized') {
        return ApiResponse.error(res, message, 401);
    }

    static conflict(res, message = 'Conflict') {
        return ApiResponse.error(res, message, 409);
    }
}

module.exports = ApiResponse;
