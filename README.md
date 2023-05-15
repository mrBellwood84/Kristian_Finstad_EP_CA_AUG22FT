# Noroff Backend Exam Project

Backend solution for RestAPI for [Exam Project Assignment](./documentation/EP_CA.pdf).

Created with ExpressJS. No views or view engine are included, RestAPI endpoints only.

## Installation and Usage

<br/>

__Run Scripts__:
- __npm start__ : Run application in production
- __npm run dev__ : Development mode with nodemon
- __npm test__ : Run tests

## Environment
Application using environment variables. In development, variables are extracted from a local .env file. Example below lists environment variables.

```ini
HOST = "localhost"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "P@ssw0rd"
DATABASE_NAME = "StockSalesDB"
DIALECT = "mysql"
PORT = "3000"
DB_LOGGING = true  # true will enable sequelize logger, other or undefined value will disable logging
TOKEN_SECRET = secretToken # change to something secure
```

## Packages

Packages used in this application are listed here for easy documentation lookup.

- [ExpressJS](https://expressjs.com/) : Application Framework
- [Sequelize](https://sequelize.org/) : DB Orm
- [MySql2](https://www.npmjs.com/package/mysql2) : MySql library
- [Jsend](https://www.npmjs.com/package/jsend) : Middleware for response.
- [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) : Implementing JWT for Auth.
- [dotenv](https://www.npmjs.com/package/dotenv) : loading environment variables

__Dev packages:__

- [Nodemon](https://github.com/remy/nodemon) : Restart on change in dev mode.
- [Jest](https://jestjs.io/) : Test library
- [Supertest](https://github.com/ladjs/supertest) : Test library

## Acknowledgment

Solution code is based on documentation listed in packages above or by previous assignment solutions defined by course material. Other sources are listed below.

## Documentation