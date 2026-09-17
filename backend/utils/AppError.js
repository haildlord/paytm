class AppError extends Error {
    constructor(message, statusCode){
        super(message);
        
        this.namr = "AppError";
        this.statusCode = statusCode;
    }
}

module.exports = AppError;