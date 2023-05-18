const { Sequelize, DataTypes } = require("sequelize")

/**
 * Create Item model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createItemModel = (sequelize) => {

    const Item = sequelize.define("Item", {
        item_name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        img_url: {
            type: DataTypes.STRING,
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        stock_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        }
    },{
        timestamps: true,
    })

    Item.associate = (models) => {
        Item.hasMany(models.CartItem);
        Item.hasMany(models.OrderItem);
        Item.belongsTo(models.Category, {
            onDelete: "RESTRICT"
        });
    }

    return Item;
}

module.exports = createItemModel;