const { Sequelize, DataTypes } = require("sequelize")

/**
 * Create Role model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createRoleModel = (sequelize) => {
    const Role = sequelize.define("Role", {
        role: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        }
    }, {
        timestamps: false,
    })

    Role.associate = (models) => {
        Role.hasMany(models.User);
    }

    return Role;
}

module.exports = createRoleModel;