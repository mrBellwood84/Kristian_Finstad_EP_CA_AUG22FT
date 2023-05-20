const router = require("express").Router();

// importing database and services
const db = require("../models/index")
const AuthService = require("../services/authService");
const authService = new AuthService(db);

// import validator
const validator = require("validator");

// import errors for error handling
const { UserEmailMaxError, UserExistError } = require("../errors/authErrors");
const { NotFoundError } = require("../errors/dataErrors");

// handle login request
router.post("/login", async (req, res, next) => {

    // get username and password from request body
    const { username, password } = req.body;

    // return failed if credentials are missing
    const missingRequired = {};
    if (!username) missingRequired["username"] = "Username is required!";
    if (!password) missingRequired["password"] = "Password is required!";
    if (Object.keys(missingRequired).length > 0) return res.status(400).jsend.fail(missingRequired);

    try {
        const token = await authService.login(username, password)
        return res.jsend.success({token})
    } catch (ex) {
        if (ex instanceof NotFoundError ) return res.status(400).jsend.fail({message: "Username or password is incorrect"});
        return res.status(500).jsend.error(ex.message);
    }
});

// handle signup requests
router.post("/signup", async (req, res, next) => {

    // get values from request body
    const { firstName, lastName, username, email, password} = req.body;

    // return failed if any values are missing
    const missingRequired = {};
    if (!firstName) missingRequired["firstName"] = "First name is required!";
    if (!lastName) missingRequired["lastName"] = "Last name is required!"
    if (!username) missingRequired["username"] = "Username is required!";
    if (!email) missingRequired["email"] = "Email is required!";
    if (email && !(validator.isEmail(email))) missingRequired["email"] = `${email} is not a valid email address!`;
    if (!password) missingRequired["password"] = "Password is required!";
    if (Object.keys(missingRequired).length > 0) return res.status(400).jsend.fail(missingRequired);

    // try creating a new user from provided values
    // handle errors if raised by service method
    try {
        await authService.signup(firstName, lastName, username, email, password);
        return res.jsend.success({message: "You have created an account"})
    } catch (ex) {
        if (ex instanceof UserExistError || ex instanceof UserEmailMaxError) 
            return res.status(400).jsend.fail({message: ex.message});
        return res.status(500).jsend.error(ex.message);
    }
});

module.exports = router;