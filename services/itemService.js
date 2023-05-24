const { QueryTypes } = require("sequelize");
const { EntityExistError, NotFoundError } = require("../errors/dataErrors");

class ItemService {
    
    #sequelize
    #Item
    #Category

    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Item = db.Item
        this.#Category = db.Category
    }

    /** 
     *  Check if any entity contain provided sku value.
     * 
     * @param {string} sku 
     * @returns {boolean} true if found
     */
    async #checkSkuExist(sku) {

        const res = await this.#sequelize.query("select count(id) as c from items where sku = ?", {
            replacements: [ sku ],
            type: QueryTypes.SELECT,
        });
        return res[0].c > 0;
    }

    /** 
     *  Check if any entity have name provided
     * 
     * @param {string} name 
     * @returns {boolean} true if exists
     */
    async #checkNameExist(name) {
        const res = await this.#sequelize.query("select count(id) as c from items where itemName = ?", {
            replacements: [ name ],
            type: QueryTypes.SELECT,
        });
        return res[0].c > 0;
    }

    /**
     * Checks if any category entity has id provided
     * 
     * @param {string | number} id 
     * @returns { boolean } true if exists
     */
    async checkCategoryExistById(id) {
        const res = await this.#sequelize.query("select count(id) as c from categories where id = ?", {
            replacements: [ id ],
            type: QueryTypes.SELECT,
        })
        return res[0].c > 0
    }

    /** get all existing item entities */
    async getAll() {
        const result = await this.#Item.findAll({
            include: "category",
            attributes: {
                exclude: ["categoryId"]
            }
        })
        return result;
    }

    /** 
     *  Create a new item entity from provided object
     *  Will throw error if other entity with provided Sku value exist
     * 
     *  @remarks Values must be validated before using this method!!!
     * 
     * @param {object} body 
     * @returns {string | undefined} warning message if same name item exists
     */
    async create(body) {

        // destruct request body
        const { itemName, categoryId, imageUrl,sku, price, stockQuantity } = body;

        // check do not duplicate sku and warn name duplicate
        if (await this.#checkSkuExist(sku)) throw new EntityExistError("Item with the same sku exist in database");
        const itemNameExist = await this.#checkNameExist(itemName);

        await this.#Item.create({
            itemName,
            imageUrl,
            sku,
            price,
            stockQuantity,
            categoryId,
        });
        
        if (itemNameExist) return "Item with same name exist in database"
    }

    /** 
     *  Update item entity with values from provided object
     *  Will throw error if other entity with provided Sku value exist.
     *  Returns warning if changing name is similar to existing entity.
     * 
     *  @remarks Values must be validated before using this method!!!
     * 
     * @param {string | number} id 
     * @param {object} body 
     * @returns {string | undefined} warning message if same name item exists
     */
    async update(id, body) {

        const item = await this.#Item.findOne({where: { id }})
        if (!item) throw new NotFoundError("Item not found!")

        // destruct body
        const { itemName, categoryId, imageUrl, sku, price, stockQuantity } = body;
        
        // check do not duplicate sku and warn name duplicate
        if (sku && item.sku !== sku && await this.#checkSkuExist(sku)) 
            throw new EntityExistError("Item with the same sku exist in database");

        // check if other items in db have similar name
        const itemNameExist = itemName 
            && itemName.toUpperCase() !== item.itemName.toUpperCase()
            && this.#checkNameExist(itemName)

        // update values if provided
        if (itemName) item.itemName = itemName;
        if (imageUrl) item.imageUrl = imageUrl;
        if (sku) item.sku = sku;
        if (price) item.price = price;
        if (stockQuantity || stockQuantity === 0) item.stockQuantity = stockQuantity;
        if (categoryId) item.categoryId = categoryId;

        await item.save();
        if (itemNameExist) return "Item with similar name exist in database!"
    }

    /**
     *  Delete entity by id. Throws not found error if item not found.
     * 
     * @param {string | number} id 
     */
    async delete(id) {
        const item = await this.#Item.findOne({where: { id }});
        if (!item) throw new NotFoundError("Item does not exist");
        await item.destroy();
    }
}

module.exports = ItemService;