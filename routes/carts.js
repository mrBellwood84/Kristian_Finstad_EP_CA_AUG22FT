const router = require("express").Router();

const db = require("../models/index");
const CartService = require("../services/cartService");
const cartService = new CartService(db);

// import auth middleware 
const { authUser } = require("../middleware/authUserToken");
const { authAdmin } = require("../middleware/authAdminToken");
const { validOnCreate } = require("../middleware/validateCartItem");

// import errors used by db service
const { NotFoundError, EntityExistError, OutOfStockError } = require("../errors/dataErrors");

// get user 
router.get("/cart", authUser, async (req, res, next) => {
    const userId = req.token.id;

    try {
        const result = await cartService.getUserCart(userId)
        return res.jsend.success({cart: result});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message)
        return res.status(500).jsend.error(ex.message)
    }
});

router.get("/allcarts", authAdmin, async (req, res, next) => {
    
    try {
        const result = await cartService.getAllUserCarts();
        return res.jsend.success(result);
    } catch (ex) {
        return res.status(500).jsend.error(ex.message);
    }
});

// add existing items to user cart
router.post("/cart_item", authUser, validOnCreate, async (req, res, next) => {

    // get user id and destruct request body fields
    const userId = req.token.id;
    const { itemId, amount } = req.body

    try {
        await cartService.addCartItem(userId, itemId, amount)
        return res.jsend.success({message: "Item(s) added to cart"});
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        if (ex instanceof OutOfStockError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message)
    }
});

// update existing cart item
router.put("/cart_item/:id", authUser, async (req, res, next) => {
    
    // get values from request
    const userId = req.token.id;
    const itemId = req.params.id;
    const newAmount = req.body.newAmount;

    // send failed if requested amount is invalid
    if (!newAmount) return res.status(400).jsend.fail({ newAmount: "Amount is required" })
    
    // check if amount is a number and not less than one
    const amount = parseInt(newAmount);
    if (isNaN(amount)) return res.status(400).jsend.fail({newAmount: "Amount must be an integer"});
    if (amount < 1) return res.status(400).jsend.fail({newAmount: "Amount must be at least 1"});

    try {
        await cartService.updateCartItem(userId, itemId, amount);
        return res.jsend.success({message: "Cart Item was updated"});

    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        if (ex instanceof OutOfStockError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
});

// removes cart item from cart by provided id
router.delete("/cart_item/:id", authUser, async (req, res, next) => {

    const userId = req.token.id;
    const itemId = req.params.id;

    try {
        await cartService.deleteSingleCartItem(userId, itemId);
        return res.jsend.success({message: "Item was removed from cart"})
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
});

// deletes all items from cart
router.delete("/cart/:id", authUser, async (req, res, next) => {

    const userId = req.token.id;
    const cartId = req.params.id;

    try {
        await cartService.deleteAllCartItems(userId, cartId);
        return res.jsend.success({message: "All items in cart was removed"})
    } catch (ex) {
        if (ex instanceof NotFoundError) return res.status(404).jsend.fail(ex.message);
        return res.status(500).jsend.error(ex.message);
    }
});

module.exports = router;