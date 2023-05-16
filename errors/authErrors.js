/**
 *  Collection of errors regarding authentication and authorization.
 *  Include errors for creating new users or login existing users.
 *  Include validation error for email.
 */

class UserExistError extends Error {
    constructor() {
        super();
        this.message = "Username taken, cannot create new user account";
    }
}

class UserEmailMaxError extends Error {
    constructor() {
        super();
        this.message = "The maximum count of user is reached for provided email address";
    }
}

module.exports = {
    UserExistError, UserEmailMaxError
}