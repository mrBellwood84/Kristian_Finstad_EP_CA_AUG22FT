const { Sequelize, DataTypes } = require("sequelize");

/**
 * Create Order model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createOrderModel = (sequelize) => {
    const Order = sequelize.define("Order", 
    {
        discount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    },
    {
        timestamps: true,
    });

    Order.associate = (models) => {
        Order.belongsTo(models.OrderStatus, {
            as: "orderStatus",
            
        });
        Order.hasMany(models.OrderItem, {
            as: "orderItems",
            foreignKey: "orderId",
            onDelete: "CASCADE",
        });
        Order.belongsTo(models.User, {
            as: "user",
            onDelete: "CASCADE",
        });
    }
    
    return Order;
}
module.exports = createOrderModel;