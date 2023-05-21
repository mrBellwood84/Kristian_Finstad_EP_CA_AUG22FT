const router = require("express").Router();

// get database and services
const db = require("../models/index");
const UtilService = require("../services/utilService");
const AuthService = require("../services/authService");
const utilService = new UtilService(db);
const authService = new AuthService(db);


router.post("/setup", async (req, res, next) => {

    try {
        const report = {
            message: "Setup was run for API"
        }

        // check / add user roles
        const roles = await utilService.addRoles();
        report["userRoles"] = roles;

        const orderStatus = await utilService.addOrderStatus();
        report["orderStatus"] = orderStatus;

        // check admin exist, create if not
        const adminExist = await utilService.checkAdminExist();
        if (!adminExist) await authService.createAdmin();
        report["adminAccount"] = adminExist ? "Admin account exist" : "Admin account was created";

        // get data from noroff api
        const apiCallResult = await utilService.populateDb();
        report["apiCall"] = apiCallResult;

        // return util report
        return res.jsend.success(report)
    } catch (ex) {
        return res.jsend.error(ex.message);
    }
})

router.post("/search", async (req, res, next) => {
    return res.jsend.success({message: "DEV :: reach enpoint is alive"})
})



module.exports = router;