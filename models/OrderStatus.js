const { Sequelize, DataTypes } = require("sequelize");

/**
 * Create OrderStatus model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createOrderStatusModel = (sequelize) => {
    const OrderStatus = sequelize.define("OrderStatus", {
        status: {
            type: DataTypes.STRING,
        },
    },
    {
        timestamps: false,
    });

    return OrderStatus;
}

module.exports = createOrderStatusModel;