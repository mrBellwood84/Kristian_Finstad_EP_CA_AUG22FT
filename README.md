# Noroff Backend Exam Project

Backend solution for RestAPI for [Exam Project Assignment](./documentation/EP_CA.pdf).

Created with ExpressJS. No views or view engine are included, RestAPI endpoints only.

## Installation and Usage

<br/>

### __Important:__

To successfully run tests, a database must be connected and the application must run at least once to migrate datamodels to database.

### __Run Scripts__:
- __npm start__ : Run application in production
- __npm run dev__ : Development mode with nodemon
- __npm test__ : Run tests

### **Known issues**:

- Category _"Laptop"_ **was not** provided as category name from the initial data. Thereby searching for for all items with category _"Laptop"_ will not produce one item as indicated in the exam instruction. To meet the exam instructions, the test is written to expect at least one result. Unless provided data is changed: <span style="color: red"><b><u> THIS TEST WILL FAIL! </u></b></SPAN>

> **instruction reference:** _7. post /search – search for all items with the category name “Laptop” (one item should be returned from the initial data)_.

## Environment
Application using environment variables. In development, variables are extracted from a local .env file. Example below lists environment variables.

```ini
HOST = "localhost"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "P@ssw0rd"
DATABASE_NAME = "StockSalesDB"
DIALECT = "mysql"
PORT = "3000"

DB_LOGGING = false
TOKEN_SECRET = 123
```

## Packages

Packages used in this application are listed here for easy documentation lookup.

- [ExpressJS](https://expressjs.com/) : Application Framework
- [Sequelize](https://sequelize.org/) : DB Orm
- [MySql2](https://www.npmjs.com/package/mysql2) : MySql library
- [Jsend](https://www.npmjs.com/package/jsend) : Middleware for response.
- [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) : Implementing JWT for Auth.
- [dotenv](https://www.npmjs.com/package/dotenv) : loading environment variables-
- [validator](https://www.npmjs.com/package/validator) : used for validating data.

__Dev packages:__

- [Nodemon](https://github.com/remy/nodemon) : Restart on change in dev mode.
- [Jest](https://jestjs.io/) : Test library
- [Supertest](https://github.com/ladjs/supertest) : Test library

## Acknowledgment

Solution code is based on documentation listed in packages above or by previous assignment solutions defined by course material. Other sources are listed below.

## Documentation

This solution was created in accordance with [Course Assignment Resources](./documentation/EP_CA.pdf) given for this exam project. 
PDF printout contain timestamp. Changes made to the assignment text after this time and date, have been ignored,
with the exception where I have received direct and explicit notification from those responsible about changes that have been made.