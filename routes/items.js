const router = require("express").Router();

// get errors used by dataservices
const { EntityExistError, NotFoundError } = require("../errors/dataErrors");

// get db and required services
const db = require("../models/index");
const ItemService = require("../services/itemService");
const itemService = new ItemService(db)

// middlewares for endpoints
const { validateOnCreate, validateOnUpdate,  } = require("../middleware/validateItemData")
const isAdmin = require("../middleware/validateTokenAdmin");

// get request for all data
router.get("/", async (req, res, next) => {
    try {
        const result = await itemService.getAll();
        return res.jsend.success(result);
    } catch (ex) {
        return res.status(500).jsend.error(ex.message);
    }
});

// create new item
router.post("/", validateOnCreate, isAdmin, async (req, res, next) => {

    // destruct requesat body
    const { body } = req;
    
    try {
        const warning = await itemService.create(body);
        let message = "Item created!"
        return res.jsend.success({ message, warning });
    } catch (ex) {
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.fail(ex.message);
    }
});

// update from 
router.put("/:id", validateOnUpdate, isAdmin, async (req, res, next) => {
    
    const id = req.params.id;
    const { body } = req

    try {
        const warning = await itemService.update(id, body)
        return res.jsend.success({ message: "Item was updated", warning})
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }

});

router.delete("/:id", isAdmin, async (req, res, next) => {
    const id = req.params.id;

    try {
        await itemService.delete(id);
        return res.jsend.success({message: "Item got deleted"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
    return res.jsend.success("DEV :: delete endpoint exist")
});

module.exports = router;