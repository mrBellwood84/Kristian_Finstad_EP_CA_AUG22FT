// env config
require("dotenv").config();

// default imports
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// import routes
const indexRouter = require('./routes/index');
const authRouter = require("./routes/auth");
const itemsRouter = require("./routes/items");
const categoryRouter = require("./routes/categories");
const cartRouter = require("./routes/carts")
const utilRouter = require("./routes/utils");

// initialize database
const db = require("./models/index")
db.sequelize.sync({force: false})

// get middlewares
const jsend = require("jsend");

// initialize application
const app = express();

// default middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// adding middlewares
app.use(jsend.middleware)

// adding routes
app.use('/', indexRouter);
app.use("/", authRouter);
app.use("/", itemsRouter);
app.use("/", categoryRouter);
app.use("/", cartRouter)

app.use("/", utilRouter);

module.exports = app;