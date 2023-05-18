const router = require("express").Router();

const { EntityExistError } = require("../errors/dataErrors");
// get db and required services
const db = require("../models/index");
const ItemService = require("../services/itemService");
const itemService = new ItemService(db)


router.get("/", async (req, res, next) => {
    try {
        const result = await itemService.getAll();
        return res.jsend.success(result);
    } catch (ex) {
        return res.status(500).jsend.error(ex.message);
    }
});

// create new item
router.post("/", async (req, res, next) => {

    // destruct requesat body
    const {
        item_name,
        category_id,
        img_url,
        sku,
        price,
        stock_quantity

    } = req.body;
    
    // check if all required items are provided
    // DEV :: this validation codeblock should be separated from route file...
    const valuesError = {};
    if (!item_name) valuesError["item_name"] = "Name is required!";
    if (!category_id) valuesError["category_id"] = "Category id is required!";
    if (category_id && !(await itemService.categoryExist(category_id)))
        valuesError["category_id"] = "Provided category does not exist...";
    if (!img_url) valuesError["img_url"] = "Image url was not provided";
    if (!sku) valuesError["sku"] = "Product code is required";
    if (!price) valuesError["price"] = "Price is required";
    if (price && isNaN(parseFloat(price))) valuesError["price"] = "Price must be a number";
    if (!stock_quantity) valuesError["stock_quantity"] = "Stock quantity was not provided";
    if (stock_quantity && isNaN(parseInt(stock_quantity)))
        valuesError["stock_quantity"] = "Stock quantity must be a number";
    if (stock_quantity && !isNaN(parseInt(stock_quantity)) && parseInt(stock_quantity) <= 0 )
        valuesError["stock_quantity"] = "Stock quantity can not be a negative number";

    if (Object.keys(valuesError).length > 0)  return res.status(400).jsend.fail(valuesError)

    try {
        const nameExist = await itemService.create(item_name, category_id, img_url, sku, price, stock_quantity);
        let message = "Item created!"
        let warning = undefined;
        if (nameExist) warning = "Item with similar name exist in database...";
        return res.jsend.success({ message, warning });
    } catch (ex) {
        if (ex instanceof EntityExistError) return res.status(400).jsend.fail(ex.message);
        return res.status(500).jsend.fail(ex.message);
    }
});

router.put("/:id", async (req, res, next) => {
    return res.jsend.success("DEV :: put endpoint exists");
});

router.delete("/:id", async (req, res, next) => {
    return res.jsend.success("DEV :: delete endpoint exist")
});

module.exports = router;