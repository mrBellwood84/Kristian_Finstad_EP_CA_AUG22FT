/**
 * Contain database connections and business logic for utility endpoints.
 */

const { Op, QueryTypes } = require("sequelize");
const { NotFoundError, HappyEasterError } = require("../errors/dataErrors");

class UtilService {

    #sequelize;
    #Role;
    #Category;
    #Item;
    #OrderStatus;

    /**
     * 
     * @param {object} db sequelize db object
     */
    constructor (db) {
        this.#sequelize = db.sequelize
        this.#Role = db.Role;
        this.#Category = db.Category;
        this.#Item = db.Item;
        this.#OrderStatus = db.OrderStatus
    }

    /**
     *  Add roles Admin and User to Database if not exist, return report object for response
     * 
     *  @returns {object}
     */
    async addRoles() {
        const [, adminAdded ] = await this.#Role.findOrCreate({where: {role: "Admin"}});
        const [, userAdded ] = await this.#Role.findOrCreate({where: {role: "User" }});

        return {
            adminRole: adminAdded ? "Admin added as User Role" : "Admin exist as User Role",
            userRole: userAdded ? "User added as User Role" : "User exist as User Role",
        };
    }

    async addOrderStatus() {
        const [, completeAdded ] = await this.#OrderStatus.findOrCreate({ where: { status: "COMPLETE" }});
        const [, inProcessAdded ] = await this.#OrderStatus.findOrCreate({where: { status: "IN PROCESS" }});
        const [, cancelledAdded ] = await this.#OrderStatus.findOrCreate({where: { status: "CANCELLED" }});

        return {
            completeStatus: completeAdded ? "Order status COMPLETE was added" : "Order status COMPLETE exists",
            inprocessStatus: inProcessAdded ? "Order status IN PROCESS was added" : "Order status IN PROCESS exists",
            candelledStatus: cancelledAdded ? "Order status CANCELLED was added" : "Order status CANCELLED exists",
        }
    }

    /**
     *  Check if adminaccount exist. Report boolean only.
     *  Admin account should be created using the authService.
     * 
     * @returns {boolean}
     */
    async checkAdminExist() {
        const result = await this.#sequelize.query('select * from users as u inner join roles as r where r.id = u.RoleId and role = "Admin" limit 1;');
        const adminExist = result[0].length > 0;
        if (adminExist) return adminExist;
    }

    /**
     * Get data from Noroff API.
     * 
     * @returns {Array} 
     */
    async #getInitialData() {
        const url = "http://143.42.108.232:8888/items/stock"
        const response = await fetch(url, { method: "GET" }).then(async response => await response.json() );
        return response.data;
    }

    /** 
     * Populate database with data from Noroff API
     */
    async populateDb() {

        const itemCount = await this.#sequelize.query("select count(*) as c from items", {type: QueryTypes.SELECT});
        if (itemCount[0].c > 0) return "Data exists in database"

        const data  = await this.#getInitialData();

        const report = {
            categoryAdded: 0,
            itemAdded: 0,
        }

        // create a mapped array for bulk import
        const mapped = []

        // use for loop to await each data entry in sync
        for (const d of data) {
            const item = {
                id: d.id,
                itemName: d.item_name,
                imageUrl: d.img_url,
                sku: d.sku,
                price: d.price,
                stockQuantity: d.stock_quantity,
                categoryId: await this.#findOrCreateCategory(d.category, report)       
            }
            mapped.push(item)
        };

        for (const item of mapped) {
            await this.#createItemEntity(item, report);
        }

        return {
            message: "Seed data fetched from external api",
            category: report.categoryAdded > 0 ? `${report.categoryAdded} categories were added` : "No new categories were added",
            items: report.itemAdded > 0 ? `${report.itemAdded} items were added` : "No new items were added",
        }
    }

    /** finds or create category entity, always return category id */
    async #findOrCreateCategory(category, report) {

        const queryResult = await this.#sequelize.query("select id from categories where name = ?", {
            replacements: [ category ], type: QueryTypes.SELECT,
        });

        if (queryResult.length > 0) {
            const id = queryResult[0].id;
            return id;
        }

        report.categoryAdded++;
        const newEntity = await this.#Category.create({name: category});
        const id = newEntity.id;
        return id;
    }

    /** check if entity exists, insert item if not */
    async #createItemEntity(item, report) {
        const res = await this.#sequelize.query("select count(*) as c from items where id = ?", {
            replacements: [ item.id ],
            type: QueryTypes.SELECT
        });

        const exist = res[0].c > 0;
        if (exist) return

        report.itemAdded++;
        await this.#Item.create(item);
    }

    /**
     *  Master method for search.
     *  Select search method from provided variables
     * 
     * @param {string | undefined} partialItemName 
     * @param {string | undefined} categoryName 
     * @param {string | undefined} sku 
     * 
     * @returns {Array}
     */
    async searchItem(partialItemName, categoryName, sku) {

        if (sku) return await this.#searchBySku(sku);
        if (!partialItemName && categoryName) return await this.#searchByCategoryOnly(categoryName)
        if (partialItemName && !categoryName) return await this.#searchByPartialItemName(partialItemName);
        if (partialItemName && categoryName) return await this.#searchByCategoryAndPartialName(partialItemName, categoryName)
        throw new NotFoundError("No values provided, no values found...")
    }

    /**
     * Search item by sku only
     * 
     * @param {string} sku 
     * @returns 
     */
    async #searchBySku(sku) {
        const result = await this.#Item.findOne({
            where: { sku },
            include: "category",
            attributes: {
                exclude: [ "categoryId" ]
            }
        })

        if (!result) throw new NotFoundError("No items found");
        return result;
    };

    /**
     *  Search items by partial item name
     * 
     * @param {string} partialItemName 
     * @returns 
     */
    async #searchByPartialItemName(partialItemName) {
        const result = await this.#Item.findAll({
            where: {
                itemName: {
                    [Op.like]: `%${partialItemName}%`
                }
            },
            include: "category",
            attributes: {
                exclude: ["categoryId"]
            }
        })
        if (result.length === 0) throw new NotFoundError("No items found!");
        return result
    }

    /**
     *  Search items by categories
     * 
     * @param {string} categoryName 
     * @returns 
     */
    async #searchByCategoryOnly(categoryName) {

        const category = await this.#Category.findOne({where: { name: categoryName }});
        if (!category) throw new NotFoundError("No item found!")

        const result = await this.#Item.findAll({ 
            where: { categoryId: category.id}, 
            include: "category", 
            attributes: {
                exclude: ["categoryId"]
            }
        });
        
        if (result.length === 0) throw new NotFoundError("No items found!");        
        return result;
    }

    /**
     * Search items category and partial item name
     * 
     * @param {string} partialItemName 
     * @param {string} categoryName 
     * @returns 
     */
    async #searchByCategoryAndPartialName(partialItemName, categoryName) {
        const category = await this.#Category.findOne({where: { name: categoryName }})
        if (!category) throw new NotFoundError("No items found");

        const result = await this.#Item.findAll({
            where: {
                itemName: {
                    [Op.like]: `%${partialItemName}%`
                },
                categoryId: category.id,
            }
        })

        if (result.length === 0) throw new NotFoundError("No items found!")
        return result;
    }
}

module.exports = UtilService;