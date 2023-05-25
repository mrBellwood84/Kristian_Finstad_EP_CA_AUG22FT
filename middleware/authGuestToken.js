const jwt = require("jsonwebtoken");

const guestToken = {
    role: "Guest",
}

const setGuestToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        req.token = guestToken;
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.token = decoded;
        next();
    } catch (ex) {
        req.token = guestToken;
        next();
    }
}

module.exports = { setGuestToken };