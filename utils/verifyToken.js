const jwt = require("jsonwebtoken");
const appError = require("./appError.js");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        const error = appError.create("Token is required", 401, "ERROR");
        return next(error);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        const error = appError.create("Token format is invalid", 401, "ERROR");
        return next(error);
    }

    try {
        const currentUser = jwt.verify(token, "41ca6d0bbf0aee90e1735846bb2e671c2a59771f82ecf8cae6a1ce189cf27fa3");
        req.currentUser = currentUser;
        next();
    } catch (err) {
        const error = appError.create("Invalid Token", 401, "ERROR");
        return next(error);
    }
};

module.exports = verifyToken;


module.exports = verifyToken;