const router = require("express").Router()

// get db and services
const db = require("../models/index");
const OrderService = require("../services/orderService");
const orderService = new OrderService(db);

// get required middlewares
const authUser = require("../middleware/validateToken");
const authAdmin = require("../middleware/validateTokenAdmin");

// get requred error classes
const { NotFoundError, OutOfStockError } = require("../errors/dataErrors");
const { INTEGER } = require("sequelize");

// get user orders
router.get("/orders", authUser,  async (req, res, next) => {
    return res.jsend.error("Endpoint exist, but not complete");
});

router.get("/allorders/", authAdmin, async (req, res, next) => {

    return res.jsend.error("Endpoint exist, but not complete");
});

router.post("/order/:id", authUser, async (req, res, next) => {

    const userId = req.token.id;
    const cartId = req.params.id;

    try {
        await orderService.checkOutCart(userId, cartId);
        return res.jsend.success({message: "Cart checked out, new order placed."})
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof OutOfStockError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message)
    }
});

router.put("/order/:id", authAdmin, async (req, res, next) => {
    return res.jsend.error("Endpoint exists, but not complete");
})


module.exports = router;