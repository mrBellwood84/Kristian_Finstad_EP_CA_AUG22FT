const router = require("express").Router();

const db = require("../models/index");
const CartService = require("../services/cartService");
const cartService = new CartService(db);

// import auth middleware 
const validUser = require("../middleware/validateToken")
const isAdmin = require("../middleware/validateTokenAdmin");
const { NotFoundError, EntityExistError, OutOfStockError } = require("../errors/dataErrors");

// get user 
router.get("/cart", validUser, async (req, res, next) => {
    const userId = req.token.id;

    try {
        const result = await cartService.getUserCart(userId)
        return res.jsend.success({cart: result});
    } catch (ex) {
        return res.status(500).jsend.error(ex.message)
    }
});

router.get("/allcarts", isAdmin, async (req, res, next) => {
    return res.jsend.success("endpoint exist")
});

// add existing items to user cart
router.post("/cart_item", validUser, async (req, res, next) => {

    // get user id and destruct request body fields
    const userId = req.token.id;
    const { itemId, amount } = req.body

    // validate incoming data
    const valueReport = {};
    if (!itemId) valueReport["itemId"] = "Item ID is required!";
    if (amount && isNaN(parseInt(amount))) valueReport["amount"] = "Provided amount must be an integer";
    if (amount && isNaN(parseInt(amount)) && parseInt(amount) < 1) valueReport["amount"] = "Provided amount must be at least 1";
    if (Object.keys(valueReport).length > 0) return res.status(400).jsend.fail(valueReport);

    try {
        await cartService.addCartItem(userId, itemId, amount)
        return res.jsend.success({message: "Item(s) added to cart"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof EntityExistError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof OutOfStockError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message)
    }
});

router.put("/cart_item/:id", validUser, async (req, res, next) => {
    
    // get values from request
    const userId = req.token.id;
    const cartItemId = req.params.id;
    const newAmount = req.body.newAmount;

    // send failed if requested amount is invalid
    if (!newAmount) return res.status(400).jsend.fail({ newAmount: "Amount is required" })
    
    // check if amount is a number and not less than one
    const amount = parseInt(newAmount);
    if (isNaN(amount)) return res.status(400).jsend.fail({newAmount: "Amount must be an integer"});
    if (amount < 1) return res.status(400).jsend.fail({newAmount: "Amount must be at least 1"});

    try {
        await cartService.updateCartItem(userId, cartItemId, amount);

    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof OutOfStockError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }

    return res.end();
});

router.delete("/cart_item", validUser, async (req, res, next) => {
    return res.jsend.success("Endpoint exists")
});


module.exports = router;