const { QueryTypes } = require("sequelize");
const { NotFoundError, OutOfStockError } = require("../errors/dataErrors");

class OrderService {

    #sequelize;
    #Cart;
    #CartItem;
    #Item;
    #Order;
    #OrderItem;

    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Cart = db.Cart;
        this.#CartItem = db.CartItem;
        this.#Item = db.Item;
        this.#Order = db.Order;
        this.#OrderItem = db.OrderItem;
    }

    /**
     *  Checks if cart exists and belong to provided user id
     * 
     * @param {string | number} cartId 
     * @param {string | number} userId 
     * @returns {boolean} true if cart exist with valid user id
     */
    async #checkCartExists(cartId, userId) {
        const result = await this.#sequelize.query("select count(*) as c from carts where id = ? and userId = ?", {
            replacements:  [ cartId, userId ],
            type: QueryTypes.SELECT,
        });
        return result[0].c > 0;
    }

    /** 
     *  Return id of requested order status.
     *  Throws error if status does not exist or param is not string;
     * 
     * @param {"COMPLETE" | "IN PROCESS" | "CANCELLED" | string } status 
     * @returns {number} order status id
     */
    async #getOrderStatus(status) {

        if (typeof status !== "string") throw Error("An error occured assigning status for order!");
        const validOrderStatuses = ["COMPLETE", "IN PROCESS", "CANCELLED"]
        const orderStatus = validOrderStatuses.find(x => x === status.toUpperCase());
        if (!orderStatus) throw Error("An error occured assigning status for order!");
        
        const result = await this.#sequelize.query("select id as id from orderstatuses where status = ?", {
            replacements: [ orderStatus ],
            type: QueryTypes.SELECT
        });

        return result[0].id;
    }

    async #getDiscount(userId) {
        const result = await this.#sequelize.query("select count(*) as c from users where useremailid in (select useremailid from users where id = ?)", {
            replacements: [ userId ],
            type: QueryTypes.SELECT,
        });
        const userCount = result[0].c;
        
        switch (userCount) {
            case 2:
                return 10;
            case 3:
                return 30;
            case 4: 
                return 40;
            default:
                return 0;
        }

    }

    /** 
     *  Place a new order by checking out cart.
     *  Require userId, cartId, and also require cart belongs to user.
     * 
     *  Throws error if invalid IDs are provided.
     *  Throws error if any items are out of stock
     * 
     * @param {string | number} userId 
     * @param {string | number} cartId 
     */
    async checkOutCart(userId, cartId) {

        // check cart exist for user, or throw error
        const cartExist = await this.#checkCartExists(cartId, userId);
        if (!cartExist) throw new NotFoundError("Provided cart ID does not exist for user")

        const cart = await this.#Cart.findOne({
            where: { id: cartId },
            include: [
                {
                    model: this.#CartItem,
                    as: "cartItems",
                    include: {
                        model: this.#Item,
                        as: "item"
                    }
                }
            ]
        });

        if (cart.cartItems.length <= 0) throw new NotFoundError("Cart does not contain any cart items. Checkout not available...")

        // check if items in stock and doesn't exceed requested amount;
        cart.cartItems.forEach(x => {
            const amount = x.amount;
            const quantity = x.item.stockQuantity;
            const itemSku = x.item.sku;
            const itemId = x.item.id;
            const cartItemId = x.id;
            if (!quantity) throw new OutOfStockError(`Item Out of stock -- Sku: ${itemSku}, ID: ${itemId}`);
            if (amount > quantity) throw new OutOfStockError(`Requested item amount exceed stock quantity -- Sku: ${itemSku}, itemID: ${itemId}, CartItemId: ${cartItemId}`)
        });

        // withdraw requested amount from stock quantity,
        // can be run aside this method => does not require to await
        cart.cartItems.forEach(c_item => {
            const itemId = c_item.item.id;
            const stockQuantity = c_item.item.stockQuantity;
            const amount = c_item.amount;
            this.#Item.update({stockQuantity: (stockQuantity - amount)}, { where: { id: itemId }});
        });

        const orderStatusId = await this.#getOrderStatus("in process");
        const discount = await this.#getDiscount(userId)

        const order = {
            userId,
            discount,
            orderStatusId,
            orderItems: cart.cartItems.map(c_item => {
                return {
                    amount: c_item.amount,
                    unitPrice: c_item.item.price,
                    itemId: c_item.item.id,
                }
            }),
        }
        
        // create new order
        await this.#Order.create(order, {
            include: {
                model: this.#OrderItem,
                as: "orderItems"
            }
        });

        await this.#CartItem.destroy({where: { cartId }});


    }
}

module.exports = OrderService