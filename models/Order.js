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
        },
        priceItems: {
            type: DataTypes.VIRTUAL,
            get() {
                try {
                    const orderItemPrices = this.dataValues.orderItems.map(item => item.amount * item.unitPrice);
                    const sum = orderItemPrices.reduce((acc, val) => acc + val, 0)
                    return sum;
                } catch {
                    return undefined;
                }

            }
        },
        total: {
            type: DataTypes.VIRTUAL,
            get() {
                try {
                    const orderItemPrices = this.dataValues.orderItems.map(item => item.amount * item.unitPrice);
                    const sumPrice = orderItemPrices.reduce((acc, val) => acc + val, 0)
                    const discountSum = sumPrice / 100 * this.discount;
                    return sumPrice - discountSum;
                } catch {
                    return undefined
                }
            }

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