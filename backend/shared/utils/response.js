// Format response standar untuk API
function success(res, data, message = 'OK', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data
    });
}

function error(res, message = 'Internal Server Error', statusCode = 500) {
    return res.status(statusCode).json({
        success: false,
        message: message
    });
}

module.exports = { success, error };