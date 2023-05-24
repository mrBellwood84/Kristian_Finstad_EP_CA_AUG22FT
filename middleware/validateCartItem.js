const validOnCreate = (req, res, next) => {
    
    const { itemId, amount } = req.body
    const missingRequired = {};

    if (!itemId) missingRequired["itemId"] = "Item ID is required!";

    const amountExist = amount !== undefined;
    const amountIsNumber = !(isNaN(parseInt(amount)));

    if (amountExist && !amountIsNumber) missingRequired["amount"] = "Provided amount must be a number";
    if (amountIsNumber && amount < 1) missingRequired["amount"] = "Provided value must be at least 1";
    if (Object.keys(missingRequired).length > 0) return res.status(400).jsend.fail(missingRequired);
    next()
}


module.exports = {
    validOnCreate
}