const validator = require("validator");

const validOnSignup = (req, res, next) => {

    const { firstName, lastName, username, email, password} = req.body;

    // return failed if any values are missing
    const missingRequired = {};
    if (!firstName) missingRequired["firstName"] = "First name is required!";
    if (!lastName) missingRequired["lastName"] = "Last name is required!";
    if (!username) missingRequired["username"] = "Username is required!";
    if (!email) missingRequired["email"] = "Email is required!";
    if (email && !(validator.isEmail(email))) missingRequired["email"] = `${email} is not a valid email address!`;
    if (!password) missingRequired["password"] = "Password is required!";
    if (Object.keys(missingRequired).length > 0) return res.status(400).jsend.fail(missingRequired);
    next();
}

const validOnLogin = (req, res, next) => {
    // get username and password from request body
    const { username, password } = req.body;

    // return failed if credentials are missing
    const missingRequired = {};
    if (!username) missingRequired["username"] = "Username is required!";
    if (!password) missingRequired["password"] = "Password is required!";
    if (Object.keys(missingRequired).length > 0) return res.status(400).jsend.fail(missingRequired);

    next();
}


module.exports =  { validOnSignup, validOnLogin };