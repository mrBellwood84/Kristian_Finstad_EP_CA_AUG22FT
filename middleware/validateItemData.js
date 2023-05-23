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
    const { itemName, category, categoryId, imageUrl,sku, price, stockQuantity } = req.body;
    
    // check if all required items are provided
    const valuesError = {};   

    if (!itemName) valuesError["itemName"] = "Name is required!";   

    // if (!categoryId) valuesError["categoryId"] = "Category id is required!";
    if (!category && !categoryId) {
        valuesError["category"] = "No category was provided";
        valuesError["categoryId"] = "Category ID can also be provided";
    }

    if(category && categoryId) {
        valuesError["category"] = "Will not accept both provided category name and category id";
        valuesError["categoryId"] = "Will not accept both provided category name and category id";
    }

    if (!category && categoryId) {
        const res = await itemService.categoryExistById(categoryId);
        if (!res) valuesError["categoryID"] = "Provided category does not exist";
    }

    if (category && !categoryId) {
        const id = await itemService.categoryExistByName(category);
        if (id) req.body.categoryId = id;
        if (!id) valuesError["category"] = "Provided category does not exist";
    }

    if (!imageUrl) valuesError["imageUrl"] = "Image url was not provided";
    if (!sku) valuesError["sku"] = "Product code is required";

    if (price !== 0 && !price) valuesError["price"] = "Price is required";
    if (price && isNaN(parseFloat(price))) valuesError["price"] = "Price must be a number";

    if (stockQuantity !== 0 && !stockQuantity) valuesError["stockQuantity"] = "Stock quantity was not provided";
    if (stockQuantity && isNaN(parseInt(stockQuantity)))
        valuesError["stockQuantity"] = "Stock quantity must be a number";
    if (stockQuantity && !isNaN(parseInt(stockQuantity)) && parseInt(stockQuantity) < 0 )
        valuesError["stockQuantity"] = "Stock quantity can not be a negative number";

    // throw fail if any values not valid
    if (Object.keys(valuesError).length > 0)  return res.status(400).jsend.fail(valuesError)
    next();
}

/** validate on put request for item endpoint, use as middleware */
const validateOnUpdate = async (req, res, next) => {
    
    // destruct requesat body
    const {categoryId, price, stockQuantity } = req.body;
    
    // check if all required items are provided
    const valuesError = {};   


    if (categoryId && !(await itemService.categoryExist(categoryId)))
        valuesError["categoryId"] = "Provided category does not exist...";
        
    if (price && isNaN(parseFloat(price))) valuesError["price"] = "Price must be a number";

    if (stockQuantity && isNaN(parseInt(stockQuantity)))
        valuesError["stockQuantity"] = "Stock quantity must be a number";
    if (stockQuantity && !isNaN(parseInt(stockQuantity)) && parseInt(stockQuantity) <= 0 )
        valuesError["stockQuantity"] = "Stock quantity can not be a negative number";

    // throw fail if any values not valid
    if (Object.keys(valuesError).length > 0)  return res.status(400).jsend.fail(valuesError)
    next();

}


module.exports = {
    validateOnCreate,
    validateOnUpdate
}