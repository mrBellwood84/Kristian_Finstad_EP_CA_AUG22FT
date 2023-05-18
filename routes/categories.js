const router = require("express").Router();

// import errors used by services
const { EntityExistError, NotFoundError, HappyEasterError } = require("../errors/dataErrors");

// import db and services
const db = require("../models/index");
const CategoryService = require("../services/categoryService");
const categoryService = new CategoryService(db);

// get middleware for admin auth
const isAdmin = require("../middleware/validateTokenAdmin");

// open endpoint for getting all categories
router.get("/", async (req, res, next) => {
    try {
        const categories = await categoryService.getAll();
        return res.jsend.success(categories)
    } catch (ex) {
        return res.jsend.error(ex.message)
    }
});

// post new category, admin only
router.post("/", isAdmin, async (req, res, next) => {

    const { name } = req.body;

    if (!name) return res.status(400).jsend.fail({name: "Category name is required"});

    try {
        await categoryService.create(name);
        return res.jsend.success({message: "Category created"});
    } catch (ex) {
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
});

// update category, admin only
router.put("/:id", isAdmin, async (req, res, next) => {

    // get request variables
    const id = req.params.id;
    const { name } = req.body;

    // throw bad request if no name exist
    if (!name) return res.status(400).jsend.fail({name: "Category name is required"});

    try {
        await categoryService.update(id, name);
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        if (ex instanceof HappyEasterError) return res.status(202).jsend.success(ex.message);
        return res.status(500).jsend.error(ex.message);
    }

    return res.jsend.success({message: "Category was updated"});
});

// delete category admin only
router.delete("/:id", isAdmin, async (req, res, next) => {

    const id = req.params.id;

    try {
        await categoryService.delete(id);
        return res.jsend.success({message: "Category was deleted"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message)
    }
});

module.exports = router;