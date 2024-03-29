const router = require("express").Router()

// get db and services
const db = require("../models/index");
const OrderService = require("../services/orderService");
const orderService = new OrderService(db);

// get required middlewares
const { authUser } = require("../middleware/authUserToken");
const { authAdmin } = require("../middleware/authAdminToken");

// import errors used by database serivces
const { NotFoundError, OutOfStockError, HappyEasterError } = require("../errors/dataErrors");

// get user orders
router.get("/orders", authUser,  async (req, res, next) => {

    const userId = req.token.id;
    const role = req.token.role;

    try {

        switch (role) {
            case "Admin":
                const adminResult = await orderService.getAllOrders();
                return res.jsend.success(adminResult);
            case "User":
                const userResult = await orderService.getUserOrders(userId);
                return res.jsend.success(userResult);
            default:
                throw Error("An error occured resolving user role")
        }
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
});

router.get("/allorders/", authAdmin, async (req, res, next) => {
    try {
        const result = await orderService.getAllOrders();
        return res.jsend.success(result);
    } catch (ex) {
        return res.status(500).jsend.error(ex.message);
    }
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

    const orderId = req.params.id;
    const orderStatus = req.body.orderStatus;

    if (!orderStatus) return res.status(400).jsend.fail({orderStatus: "Status is required"});
    if (typeof orderStatus !== "string") res.status(400).jsend.fail({orderStatus: "Provided status must be a string"});

    try {
        await orderService.updateOrderStatus(orderId, orderStatus);
        return res.jsend.success({message: "Order status was updated"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof HappyEasterError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
})


module.exports = router;