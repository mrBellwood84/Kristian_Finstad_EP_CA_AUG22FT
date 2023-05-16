class NotFoundError extends Error {
    constructor(){
        super();
        this.message = "Content not found";
    }
}

module.exports = {
    NotFoundError
}