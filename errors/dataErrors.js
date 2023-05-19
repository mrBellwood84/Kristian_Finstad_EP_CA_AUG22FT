class NotFoundError extends Error {
    constructor(message){
        super();
        this.message = message ?? "Content not found";
    }
}

class EntityExistError extends Error {
    constructor(message){
        super();
        this.message = message ?? "A similar entity exist in database";
    }
}

class OutOfStockError extends Error {
    constructor(message) {
        super();
        this.message = message ?? "Item out of stock";
    }
}

class HappyEasterError extends Error {
    constructor(message) {
        super();
        this.message = message ?? "Happy easter"
    }
}

module.exports = {
    NotFoundError,
    EntityExistError,
    HappyEasterError,
    OutOfStockError,
}