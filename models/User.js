const { Sequelize, DataTypes } = require("sequelize");

/**
 * Create User model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createUserModel = (sequelize) => {
    const User = sequelize.define("User", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        encryptedPassword: {
            type: DataTypes.BLOB,
            allowNull: false,
        },
        salt: {
            type: DataTypes.BLOB,
            allowNull: false,
        }
    }, {
        timestamps: false,
    });

    User.associate = (models) => {
        User.belongsTo(models.UserEmail);
        User.belongsTo(models.Role);
        User.hasOne(models.Cart);
        User.hasMany(models.Order);
    }
    return User;
}

module.exports = createUserModel;