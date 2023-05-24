const router = require("express").Router();

// importing database and services
const db = require("../models/index")
const AuthService = require("../services/authService");
const authService = new AuthService(db);

// get middlewares
const { authAdmin } = require("../middleware/authAdminToken");
const { validOnSignup, validOnLogin } = require("../middleware/validateAuthData");

// import errors for error handling
const { UserEmailMaxError, UserExistError } = require("../errors/authErrors");
const { NotFoundError } = require("../errors/dataErrors");


// handle login request
router.post("/login", validOnLogin, async (req, res, next) => {

    // get username and password from request body
    const { username, password } = req.body;

    try {
        const token = await authService.login(username, password)
        return res.jsend.success({token})
    } catch (ex) {
        if (ex instanceof NotFoundError ) return res.status(400).jsend.fail({message: "Username or password is incorrect"});
        return res.status(500).jsend.error(ex.message);
    }
});

// handle signup requests
router.post("/signup", validOnSignup, async (req, res, next) => {

    // get values from request body
    const { firstName, lastName, username, email, password} = req.body;
    
    try {
        await authService.signup(firstName, lastName, username, email, password);
        return res.jsend.success({message: "You have created an account"})
    } catch (ex) {
        if (ex instanceof UserExistError || ex instanceof UserEmailMaxError) 
            return res.status(400).jsend.fail({message: ex.message});
        return res.status(500).jsend.error(ex.message);
    }
});

// handles delete user, used for test purposes, a
router.delete("/users/:username", authAdmin, async (req, res, next) => {

    const username = req.params.username

    try {
        await authService.deleteUser(username);
        return res.jsend.success({message: "User was removed"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }

})



module.exports = router;