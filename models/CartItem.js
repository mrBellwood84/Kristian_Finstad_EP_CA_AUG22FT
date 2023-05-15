const { Sequelize, DataTypes } = require("sequelize");

/**
 * Create CartItem model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createCartItemModel = (sequelize) => {
    const CartItem = sequelize.define("CartItem", {
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        timestamps: true,
    });

    CartItem.associate = (models) => {
        CartItem.belongsTo(models.Item);
        CartItem.belongsTo(models.Cart);
    }
    return CartItem;
}

module.exports = createCartItemModel;