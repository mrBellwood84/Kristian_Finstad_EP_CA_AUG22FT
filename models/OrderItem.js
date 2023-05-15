const { Sequelize, DataTypes } = require("sequelize")

/**
 * Create OrderItem model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createOrderItemModel = (sequelize) => {
    const OrderItem = sequelize.define("OrderItem", {
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        timestamps: true,
    });

    OrderItem.associate = (models) => {
        OrderItem.belongsTo(models.Item);
        OrderItem.belongsTo(models.Order);
    }
    return OrderItem;
}

module.exports = createOrderItemModel;