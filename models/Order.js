const { Sequelize } = require("sequelize");

/**
 * Create Order model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createOrderModel = (sequelize) => {
    const Order = sequelize.define("Order", { },
    {
        timestamps: true,
    });

    Order.associate = (models) => {
        Order.belongsTo(models.OrderStatus);
        Order.hasMany(models.OrderItem);
        Order.belongsTo(models.User);
    }
    
    return Order;
}

module.exports = createOrderModel;