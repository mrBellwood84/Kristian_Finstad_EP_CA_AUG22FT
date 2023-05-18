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

    return Category;
}

module.exports = createCategoryModel;