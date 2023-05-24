
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


    /** raw query to check if item exist in user cart */
    async #checkUserCartItemExist(cartId, itemId) {
        const res = await this.#sequelize.query("select count(id) as c from cartItems where cartId = ? and itemId = ?", {
            replacements: [ cartId, itemId],
            type: QueryTypes.SELECT,
        });

        return res[0].c > 0;
    }

    /** raw query to check if provided cart item belongs to provided user */
    async #checkCartItemBelongToUser(userId, cartItemId) {

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
        const query = ` 
        SELECT
            cart.id AS cartId, cart.createdAt AS created, cart.updatedAt AS updated,
            c_item.id AS "cartItem.id", c_item.amount AS "cartItem.amount", c_item.price AS "cartItem.price", 
            c_item.createdAt AS "cartItem.created", c_item.updatedAt AS "cartItem.updated",
            item.id AS "cartItem.item.id", item.itemName AS "cartItem.item.itemName", item.imageUrl AS "cartItem.item.imageUrl",
            item.sku AS "cartItem.item.sku", item.price AS "cartItem.item.price", item.stockQuantity AS "cartItem.item.stockQuantity",
            cat.name AS "cartItem.item.category",
            user.id AS "user.id", (SELECT concat(user.firstName, " ", user.lastName)) AS "user.fullName"
        FROM carts AS cart
            INNER JOIN users AS user ON cart.userid = user.id
            INNER JOIN cartitems AS c_item ON c_item.cartid = cart.id
            INNER JOIN items AS item ON c_item.itemid = item.id
            INNER JOIN categories AS cat ON item.categoryid = cat.id
            ORDER BY cartId; `

        const rawResult = await this.#sequelize.query(query, {
            type: QueryTypes.SELECT,
            nest: true
        })
        
        const remapped = []

        rawResult.forEach(cart => {
            const index = remapped.findIndex(x => x.cartId === cart.cartId)
            if (index < 0) {
                cart.cartItems = [cart.cartItem]
                delete cart.cartItem;
                remapped.push(cart);
                return;
            }
            remapped[index].cartItems.push(cart.cartItem);
        });

        return remapped
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
    async updateCartItem(userId, itemId, amount) {

        // find cart and item here
        const cart = await this.#Cart.findOne({ where: { userId }});
        const item = await this.#Item.findOne({ where: { id: itemId }})

        // throw errror if cart or item does not exist
        if (!cart) throw new NotFoundError("User cart not found");
        if (!item) throw new NotFoundError("Item not found");

        const cartItem = await this.#CartItem.findOne({where: { cartId: cart.id, itemId: item.id }});

        if (!cartItem) throw new NotFoundError("Item don't exist in cart. Use POST request to add new items to cart");
        if (item.stockQuantity < amount) throw new OutOfStockError("Requested amout exceed items in stock");

        cartItem.amount = amount;
        cartItem.price = item.price * amount;
        await cartItem.save();
    }

    /**
     * Removes a single item from user chart.
     * Throws error if provided item does not exist or do not belong to user.
     * 
     * @param {string | number} userId 
     * @param {string | number} cartItemId 
     */
    async deleteSingleCartItem(userId, itemId) {

        // query cartitem id by user id and item id;
        const query = `
            select ci.id as id from carts as c
                join cartItems as ci on c.id = ci.cartId
                join items as i on i.id = ci.itemId
                where i.id = ? and c.userid = ?`
        
        const result = await this.#sequelize.query(query, {
            replacements: [ itemId, userId ],
            type: QueryTypes.SELECT,
        });

        if (result.length === 0) throw new NotFoundError("Cart item does not exist for user");
        const id = result[0].id;

        const cartItem = await this.#CartItem.findOne({where: { id }});
        await cartItem.destroy();
    }

    /**
     * Removes all items from user cart, cart will not be removed from db.
     * 
     *  Throws error if cart does not exist or not belong to user.
     * 
     * @param {string | number} userId 
     * @param {string | number} cartId 
     */
    async deleteAllCartItems(userId, cartId) {
        const cart = await this.#Cart.findOne({where: {id: cartId, userId}});
        if (!cart) throw new NotFoundError("Cart ID provided does not exists for registered user!");

        const items = await this.#CartItem.findAll({where: { cartId }});
        items.forEach(async item => await item.destroy());
    }
}

module.exports = CartService;