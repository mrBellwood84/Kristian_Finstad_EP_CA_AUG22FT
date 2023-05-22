const { Sequelize } = require("sequelize")

/**
 * Create Cart model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createCartModel = (sequelize) => {
    const Cart = sequelize.define("Cart", { },
    {
        timestamps: true,   
    })

    Cart.associate = (models) => {
        Cart.belongsTo(models.User, {
            as: "user",
            onDelete: "CASCADE"
        });
        Cart.hasMany(models.CartItem, {
            as: "cartItems",
            foreignKey: "cartId",
            onDelete: "CASCADE"
        })
    }
    return Cart;
}

module.exports = createCartModel;