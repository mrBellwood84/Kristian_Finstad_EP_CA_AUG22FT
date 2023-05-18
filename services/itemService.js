const { QueryTypes } = require("sequelize");
const { EntityExistError } = require("../errors/dataErrors");

class ItemService {
    
    #sequelize
    #Item
    #Category

    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Item = db.Item
        this.#Category = db.Category
    }

    async #checkSkuExist(sku) {
        const res = await this.#sequelize.query("select count(id) as c from items where sku = ?", {
            replacements: [ sku ],
            type: QueryTypes.SELECT,
        });
        return res[0].c > 0;
    }

    async #checkNameExist(name) {
        const res = await this.#sequelize.query("select count(id) as c from items where item_name = ?", {
            replacements: [ name ],
            type: QueryTypes.SELECT,
        });
        return res[0].c > 0;
    }
    

    async categoryExist(id) {
        const res = await this.#sequelize.query("select count(id) as c from categories where id = ?", {
            replacements: [ id ],
            type: QueryTypes.SELECT,
        })
        return res[0].c > 0
    }

    async getAll() {
        const result = await this.#Item.findAll({
            attributes: { exclude: ["categoryId", "CategoryId"]},
            include: {
                model: this.#Category,
                as: "category",
            }
        });
        return result;
    }

    /**
     *  Creates a new item entity. 
     *  Sku must be unique value.
     *  Names are not unqiue value.
     *  Returns a boolean value if an existing entity with the same name exist in database
     * 
     * @param {string} item_name 
     * @param {string | number} category_id 
     * @param {string} img_url 
     * @param {string} sku 
     * @param {number} price 
     * @param {number} stock_quantity 
     * @returns True if entity with similar name exist
     */
    async create(
        item_name,
        category_id,
        img_url,
        sku,
        price,
        stock_quantity,
    ) {
        if (await this.#checkSkuExist(sku)) throw new EntityExistError("Item with the same sku exist in database");
        const itemNameExist = await this.#checkNameExist(item_name);

        const res = await this.#Item.create({
            item_name,
            img_url,
            sku,
            price,
            stock_quantity,
            CategoryId: category_id,
        });

        return itemNameExist;
        
    }
}

module.exports = ItemService;