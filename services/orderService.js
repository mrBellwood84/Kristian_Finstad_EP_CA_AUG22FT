const { QueryTypes } = require("sequelize");
const { NotFoundError, OutOfStockError } = require("../errors/dataErrors");
const { HappyEasterError } = require("../errors/dataErrors");
const { error } = require("jsend");

class OrderService {

    #sequelize;
    #Cart;
    #CartItem;
    #Category;
    #Item;
    #Order;
    #OrderItem;
    #OrderStatus;

    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Cart = db.Cart;
        this.#CartItem = db.CartItem;
        this.#Category = db.Category;
        this.#Item = db.Item;
        this.#Order = db.Order;
        this.#OrderItem = db.OrderItem;
        this.#OrderStatus = db.OrderStatus;
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

    async #anyOrderExistUser(userId) {
        const result = await this.#sequelize.query("select count(*) as c from orders where userid = ?", {
            replacements: [ userId ],
            type: QueryTypes.SELECT,
        })
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

    /**
     *  Calculates discount based on users having shared email account
     * 
     * @param {string | number} userId 
     * @returns {number} discount value
     */
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
     *  Get users orders queried by user Id.
     * 
     * @param {string | number} userId 
     * @returns {Array}
     */
    async getUserOrders(userId) {
        const ordersExist = await this.#anyOrderExistUser(userId);
        if (!ordersExist) throw NotFoundError("No order exists for user");

        const orders = await this.#Order.findAll({
            where: { userId },

            include: [
                {
                    model: this.#OrderStatus,
                    as: "orderStatus",
                    attributes: {
                        exclude: [ "id" ]
                    }
                },
                {
                    model: this.#OrderItem,
                    as: "orderItems",
                    attributes: {
                        exclude: ["createdAt", "updatedAt", "orderId", "itemId"]
                    },
                    include: {
                        model: this.#Item,
                        as: "item",
                        attributes: {
                            exclude: ["createdAt", "updatedAt", "price", "stockQuantity","categoryId"]
                        },
                        include: {
                            model: this.#Category,
                            as: "category",
                            attributes: {
                                exclude: ["id"]
                            }
                        }
                    }
                }
            ],
            attributes: {
                include: [["id", "orderId"], ["createdAt", "created"], ["updatedAt", "updated"], "discount"],
                exclude: ["id", "orderStatusId", "createdAt", "updatedAt"],
            }
        })



        return orders;
    }

    /**
     * Get all orders from all user.
     * This method should only be accessable for authenticated admin account!
     * 
     * @returns {Array}
     */
    async getAllOrders() {
        const query = `
        SELECT
            users.id AS "user.id", (SELECT concat(firstName, " ", lastName) FROM users WHERE users.id = ord.userId) AS "user.fullName",
            ord.id AS "id", ord.userId AS "userId", ord.createdAt AS "created", ord.updatedat AS "updated", 
            (SELECT sum(orderItems.amount * orderItems.unitPrice) FROM orderItems JOIN orders ON orderItems.orderId = orders.id AND orders.userId = ord.userId) AS "priceItems",
            ord.discount AS "discount", 
            ((SELECT sum(orderItems.amount * orderItems.unitPrice) FROM orderItems JOIN orders ON orderItems.orderId = orders.id AND orders.userId = ord.userId) -
            ((SELECT sum(orderItems.amount * orderItems.unitPrice) FROM orderItems JOIN orders ON orderItems.orderId = orders.id AND orders.userId = ord.userId) / 100 * ord.discount)) AS "total",
            stat.status AS "status",
            o_item.id AS "orderItem.id", o_item.amount AS "orderItem.amount", o_item.unitPrice AS "orderItem.unitPrice", (o_item.amount * o_item.unitprice) AS "orderItem.sumPrice",
            item.id AS "orderItem.item.id", item.itemName AS "orderItem.item.name", item.imageUrl AS "orderItem.item.imageUrl", item.sku AS "orderItem.item.sku", cat.name AS "orderItem.item.category"
        FROM orders AS ord
            INNER JOIN orderitems AS o_item ON o_item.orderId = ord.id
            INNER JOIN items AS item ON item.id = o_item.itemid
            INNER JOIN categories AS cat ON item.categoryid = cat.id
            INNER JOIN orderstatuses AS stat ON ord.orderStatusId = stat.id
            INNER JOIN users ON ord.id = users.id;`

        const rawResult = await this.#sequelize.query(query, {
            type: QueryTypes.SELECT,
            nest: true,
        });

        const remapped = [];

        rawResult.forEach(order => {
            const index = remapped.findIndex(x => x.id === order.id);
            if (index < 0) {
                order.orderItems = [ order.orderItem ]
                delete order.orderItem
                remapped.push(order)
                return;
            }
            remapped[index].orderItems.push(order.orderItem);
        })

        return remapped;
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

    async updateOrderStatus(id, status) {

        const order = await this.#Order.findOne({where: { id }})
        if (!order) throw new NotFoundError("Order does not exists")

        let statusId;

        try {
            statusId = await this.#getOrderStatus(status)
        } catch {
            throw new HappyEasterError("Invalid status was provided");
        }
        
        order.orderStatusId = statusId;
        await order.save();
    }
}

module.exports = OrderService