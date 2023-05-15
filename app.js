// env config
require("dotenv").config();

// default imports
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// import routes
const indexRouter = require('./routes/index');

// initialize database
const db = require("./models/index")
db.sequelize.sync({force: true})

// initialize application
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);

module.exports = app;