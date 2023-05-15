const { Sequelize, DataTypes} = require("sequelize");

/**
 * Create UserEmail model for sequelize object
 * 
 * @param {Sequelize} sequelize instance of sequelize object
 */
const createUserEmail = (sequelize) => {
    const UserEmail = sequelize.define("UserEmail", {
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            }
        }
    }, {
        timestamps: false
    });

    UserEmail.associate = (models) => {
        UserEmail.hasMany(models.User);
    };

    return UserEmail;
}

module.exports = createUserEmail;