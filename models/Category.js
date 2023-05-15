const { Sequelize, DataTypes } = require("sequelize");

/**
 * Create Category model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createCategoryModel = (sequelize) => {
    const Category = sequelize.define("Category", {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        }
    },
    {
        timestamps: false,
    });

    Category.associate = (models) => {
        Category.hasMany(models.Item);
    }

    return Category;
}

module.exports = createCategoryModel;