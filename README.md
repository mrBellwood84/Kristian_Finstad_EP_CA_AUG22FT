# Noroff Backend Exam Project

Backend solution for RestAPI for [Exam Project Assignment](./documentation/EP_CA.pdf).

Created with ExpressJS. No views or view engine are included, RestAPI endpoints only.

## Installation and Usage

Application require [NodeJS](https://nodejs.org/en), and a [MySQL](https://www.mysql.com/) database for persistence.

1. Clone or fork this repo.
2. Run npm install to install packages.
3. Set up database and set required environment variables _(see example below)_
4. Run application least once to migrate database models from sequelize to database.
5. SEND a POST **/setup** to fetch or create initial data.

Setting db logging should be set to false in production!

Credentials for admin is currently hardcoded in **AuthService.createAdmin()** and meet expectations found in the [Course Assignment Resources](./documentation/parts/EP_CA.pdf).

<hr/>

### __Important:__

To successfully run tests, a database must be connected and the application must run at least once to migrate datamodels to database.

<hr />

### __Run Scripts__:
- __npm start__ : Run application in production
- __npm run dev__ : Development mode with nodemon
- __npm test__ : Run tests

<hr />

### **Known issues**:

- Category _"Laptop"_ **was not** provided as category name from the initial data. Thereby searching for for all items with category _"Laptop"_ will not produce one item as indicated in the exam instruction. To meet the exam instructions, the test is written to expect at least one result. Unless provided data is changed: <span style="color: red"><b><u> THIS TEST WILL FAIL! </u></b></SPAN>

    - _instruction reference:_ 7. post /search – search for all items with the category name “Laptop” (one item should be returned from the initial data).
    - [_source data_](./documentation/parts/RawData.json) as json file with the content and format of data available when this solution was created.

## Environment
Application using environment variables. In development, variables are extracted from a local .env file. Example below lists environment variables. 

```ini
HOST = "localhost"                  # Database host
ADMIN_USERNAME = "admin"            # Db admin account
ADMIN_PASSWORD = "admin_password"   # Db admin password
DATABASE_NAME = "db_name"           # DB name
DIALECT = "mysql"                   # SQL Dialect 
PORT = "3000"                       # Application port, default = 3000
DB_LOGGING = false                  # Sequelize SQL Logging enable/disabled, 
                                    #   default = False
TOKEN_SECRET = secret token         # Token Secret
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

The **[Documentation](./documentation/dockumentation.pdf)** has been compiled from three PDFs as required by the course assignment.

The PDFs have also been included for this solution under _./documentaion/parts/_ and include
- This [README.md](./documentation/parts/readme.pdf) converted to PDF.
- Standalone [Postman Documentation.pdf](./documentation/parts/Postman%20Documentation.pdf)
- The [Retrospective Report](./documentation/parts/retrospecReport.pdf)
- [Postman Documentation Online](https://documenter.getpostman.com/view/13360989/2s93m5zgRW)

This solution was created in accordance with [Course Assignment Resources](./documentation/parts/EP_CA.pdf) given for this exam project. 
PDF printout contain timestamp. Changes made to the assignment text after this time and date, have been ignored,
with the exception where I have received direct and explicit notification from those responsible about changes that have been made.