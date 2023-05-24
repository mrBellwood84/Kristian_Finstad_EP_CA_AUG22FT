const jwt = require("jsonwebtoken");

const authUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).jsend.fail({"result": "User not authorized"});

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.token = decoded;
        next();
    } catch (ex) {
        if (ex.name === "TokenExpiredError") return res.status(401).jsend.fail({ "result": "Token has expired!" });
        if (ex.name === "JsonWebTokenError") return res.status(401).jsend.fail({ "result": "Invalid token was provided!" });
        throw new Error("Error occured when decoding json web token", { cause: ex });
    }
}

module.exports = { authUser };