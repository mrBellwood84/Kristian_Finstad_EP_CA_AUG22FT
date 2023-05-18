const router = require("express").Router();


router.get("/", async (req, res, next) => {
    return res.jsend.success("DEV :: get endpoint exist");
});

router.post("/", async (req, res, next) => {
    return res.jsend.success("DEV :: post endpoint exist");
});

router.put("/:id", async (req, res, next) => {
    return res.jsend.success("DEV :: put endpoint exists");
});

router.delete("/:id", async (req, res, next) => {
    return res.jsend.success("DEV :: delete endpoint exist")
});

module.exports = router;