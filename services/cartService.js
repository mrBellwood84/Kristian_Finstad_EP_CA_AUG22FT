
const { QueryTypes } = require("sequelize");
const { EntityExistError, NotFoundError, OutOfStockError } = require("../errors/dataErrors")

class CartService {

    #sequelize;
    #Cart;
    #CartItem;
    #Item;
    #Category;
    
    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Cart = db.Cart;
        this.#CartItem = db.CartItem;
        this.#Item = db.Item;
        this.#Category = db.Category
    }

    async #checkUserCartItemExist(cartId, itemId) {
        const res = await this.#sequelize.query("select count(id) as c from cartItems where cartId = ? and itemId = ?", {
            replacements: [ cartId, itemId],
            type: QueryTypes.SELECT,
        });

        return res[0].c > 0;
    }

    async #checkCartBelongToUser(userId, cartItemId) {


        const query = "select count(*) as c from carts join cartItems as c_item where carts.userId = ? and c_item.cartId = carts.id and c_item.id = ?;"
        const result = await this.#sequelize.query(query, {
            replacements: [userId, cartItemId],
            type: QueryTypes.SELECT,
        })
        return result[0].c > 0;
    }

    /**
     *  Get user cart by user id.
     * 
     * @param {string | number } userId 
     * @returns {object} cart entity with nested values
     */
    async getUserCart(userId) {

        const result = await this.#Cart.findOne({
            where: {userId},
            attributes: {
                exclude: ["userId"],
            },
            include: [{
                model: this.#CartItem,
                as: "cartItems",
                attributes: {
                    exclude: ["itemId", "cartId"]
                },
                include: [{
                    model: this.#Item,
                    as: "item",
                    attributes: {
                        exclude: ["categoryId", "createdAt", "updatedAt"]
                    },
                    include: {
                        model: this.#Category,
                        as: "category",
                    }
                }],
            }],
        })

        if (!result) throw new NotFoundError("No cart registered on user");

        return result;
        
    }

    async getAllUserCarts() {
        // use raw sql query
    }

    /**
     *  Add new item to user cart.
     *  Will create a new cart for user if cart don't exist.
     *  Throws error if item don't exist or is out of stock.
     *  Throws error if items exist in user cart, existing items must be updated.
     * 
     * @param { string | number } userId 
     * @param { string | number } itemId 
     * @param { number } providedAmount 
     */
    async addCartItem(userId, itemId, providedAmount) {

        // check if item exists, throw error if not
        const item = await this.#Item.findOne({ where: { id: itemId }})
        if (!item) throw new NotFoundError("Could not find item with provided item ID!");
        
        // throw error if item out of stock
        if (item.stockQuantity <= 0) throw new OutOfStockError("Item is out of stock and can not be added to cart...")

        // get user cart
        const [cart, ] = await this.#Cart.findOrCreate({where: { userId }})
        const cartId = cart.id;

        // check if item exist in user cart
        const cartItemExist = await this.#checkUserCartItemExist(cartId, itemId)
        if (cartItemExist) throw new EntityExistError("Item already exist in cart. Use PUT request to update item!");

        // check provided amout does not exceed stock quantity
        const amount = providedAmount ?? 1;
        if (amount > item.stockQuantity) throw new OutOfStockError("Requested amount exceed items in stock and can not be added to cart");

        const price = item.price * amount;

        await this.#CartItem.create({
            amount,
            price,
            cartId,
            itemId,
        });
    }

    /**
     *  Update cart item with a set amount.
     *  Will throw error if cart item doesn't exist for user,
     *  or if new amout exceed stock quantity.
     * 
     * @param {string | number} userId 
     * @param {string | number} cartItemId 
     * @param {number} amount 
     */
    async updateCartItem(userId, cartItemId, amount) {
        // quickcheck if cart belong to user
        const cartItemExist = await this.#checkCartBelongToUser(userId, cartItemId)
        if (!cartItemExist) throw new NotFoundError("Cart item ID provided does not exist for registered user!");

        // get cartitem and item and check if item not out of stock
        const cartItem = await this.#CartItem.findOne({where: {id: cartItemId }});
        const item = await this.#Item.findOne({where: {id: cartItem.itemId}});
        if (item.stockQuantity < amount) throw new OutOfStockError("Requested amout exceed items in stock, cart item can not be updated!")

        // update item
        const price = amount * item.price;
        cartItem.amount = amount;
        cartItem.price = price;
        await cartItem.save();
    }

    async deleteCartItem() {
        
    }
}

module.exports = CartService;