/** 
 *      Due to some heavy lifting for validating new items data,
 *      this endpoint got it's own middleware for validating data.
 *  
 *      Less extensive validations are done inside the route handler methods.
 */


const db = require("../models/index");
const ItemService = require("../services/itemService");
const itemService = new ItemService(db);


/** validate data on item post requests, use as middleware for endpoint */
const validateOnCreate = async (req, res, next) => {

    // destruct requesat body
    const { itemName, categoryId, imageUrl,sku, price, stockQuantity } = req.body;
    
    // check if all required items are provided
    const missingRequired = {};   

    if (!itemName) missingRequired["itemName"] = "Name is required!";   

    if (!categoryId) missingRequired["categoryId"] = "Category ID is required!"
    if (categoryId && !(await itemService.checkCategoryExistById(categoryId))) missingRequired["categoryId"] = "Provided category does not exists";

    if (!imageUrl) missingRequired["imageUrl"] = "Image url was not provided";
    if (!sku) missingRequired["sku"] = "Product code is required";

    const priceExist = price !== undefined;
    const priceIsNumber = !(isNaN(parseFloat(price)));
    if (!priceExist) missingRequired["price"] = "Price is required";
    if (priceExist && !priceIsNumber) missingRequired["price"] = "Price must be a number";
    if (priceIsNumber && price < 0) missingRequired["price"] = "Price can not be a negative number";

    const sqExist = stockQuantity !== undefined;
    const sqIsNumber= !(isNaN(parseInt(stockQuantity)));
    if (!sqExist) missingRequired["stockQuantity"] = "Stock Quantity is required";
    if (sqExist && !sqIsNumber) missingRequired["stockQuantity"] = "Stock Quantity must be an integer";
    if (sqIsNumber && stockQuantity < 0) missingRequired["stockQuantity"] = "Stock Quantity can not be a negative number";

    // throw fail if any values not valid
    if (Object.keys(missingRequired).length > 0)  return res.status(400).jsend.fail(missingRequired)
    next();
}

/** validate on put request for item endpoint, use as middleware */
const validateOnUpdate = async (req, res, next) => {
    
    // destruct requesat body
    const {categoryId, price, stockQuantity } = req.body;
    
    // check if all required items are provided
    const missingRequired = {};   

    if (categoryId && !(await itemService.checkCategoryExistById(categoryId)))
        missingRequired["categoryId"] = "Provided category does not exist...";

    const priceExist = price !== undefined;
    const priceIsNumber = !(isNaN(parseFloat(price)));
    if (priceExist && !priceIsNumber) missingRequired["price"] = "Price must be a number";
    if (priceIsNumber && price < 0) missingRequired["price"] = "Price can not be a negative number";

    const sqExist = stockQuantity !== undefined;
    const sqIsNumber= !(isNaN(parseInt(stockQuantity)));
    if (sqExist && !sqIsNumber) missingRequired["stockQuantity"] = "Stock Quantity must be an integer";
    if (sqIsNumber && stockQuantity < 0) missingRequired["stockQuantity"] = "Stock Quantity can not be a negative number";

    // throw fail if any values not valid
    if (Object.keys(missingRequired).length > 0)  return res.status(400).jsend.fail(missingRequired)
    next();
}

module.exports = {
    validateOnCreate,
    validateOnUpdate
}