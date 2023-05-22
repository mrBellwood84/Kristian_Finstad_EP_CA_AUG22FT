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
        price: {
            type: DataTypes.DOUBLE,
            allowNull: false,
        }
    },
    {
        timestamps: true,
    });

    CartItem.associate = (models) => {
        CartItem.belongsTo(models.Item, {
            as: "item",
            onDelete: "CASCADE"
        });
        CartItem.belongsTo(models.Cart, {
            as: "cart",
            onDelete: "CASCADE",
        });
    }
    return CartItem;
}

module.exports = createCartItemModel;