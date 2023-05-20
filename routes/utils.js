const router = require("express").Router();

// get database and services
const db = require("../models/index");
const UtilService = require("../services/utilService");
const AuthService = require("../services/authService");
const utilService = new UtilService(db);
const authService = new AuthService(db);


router.post("/setup", async (req, res, next) => {

    const report = {
        message: "Setup was run for API"
    }

    // check / add user roles
    const roles = await utilService.addRoles();
    Object.keys(roles).forEach(k => report[k] = roles[k]);

    // check admin exist, create if not
    const adminExist = await utilService.checkAdminExist();
    if (!adminExist) await authService.createAdmin();
    report["adminAccount"] = adminExist ? "Admin account exist" : "Admin account was created";

    // get data from noroff api
    await utilService.populateDb();
    report["data"] = "Data fetched from Noroff API";

    // return util report
    return res.jsend.success(report)
})

router.post("/search", async (req, res, next) => {
    return res.jsend.success({message: "DEV :: reach enpoint is alive"})
})



module.exports = router;