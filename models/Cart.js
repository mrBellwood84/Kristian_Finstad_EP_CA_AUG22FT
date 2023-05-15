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
        Cart.hasMany(models.CartItem);
        Cart.belongsTo(models.User);
    }
    return Cart;
}

module.exports = createCartModel;