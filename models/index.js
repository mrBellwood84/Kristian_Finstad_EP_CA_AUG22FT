const { Sequelize } = require("sequelize");
const { readdirSync } = require("fs")
const path = require("path");

// extract credentials from environment
const { HOST, ADMIN_USERNAME, ADMIN_PASSWORD, DATABASE_NAME, DIALECT, DB_LOGGING } = process.env;

// check if logging should be enabled for application
const logging = DB_LOGGING.toString() === "true" ? console.log : false;

// open sequelize connection
const sequelize = new Sequelize(
    DATABASE_NAME, ADMIN_USERNAME, ADMIN_PASSWORD,
    {
        host: HOST, 
        dialect: DIALECT,
        logging,
    }
);

// initialize db object
const db = { sequelize }

// get all models from folder
const basename = path.basename(__filename);
readdirSync(__dirname)
    .filter(f =>  f.indexOf('.') !== 0 && f !== basename && f.slice(-3) === '.js')
    .forEach(f => {
        const p = path.join(__dirname, f.split(".")[0]);
        const model = require(p)(sequelize);
        db[model.name] = model
    });

// add assosications
Object.keys(db)
    .forEach(name => {
        if (!db[name].associate) return;
        db[name].associate(db);
    });

module.exports = db;