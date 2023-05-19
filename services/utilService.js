/**
 * Contain database connections and business logic for utility endpoints.
 */

const { response } = require("express");
const { where } = require("sequelize");

class UtilService {

    #sequelize
    #Role
    #Category
    #Item

    /**
     * 
     * @param {object} db sequelize db object
     */
    constructor (db) {
        this.#sequelize = db.sequelize
        this.#Role = db.Role;
        this.#Category = db.Category
        this.#Item = db.Item
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

    async populateDb() {
        const data = await this.#getInitialData();
        data.forEach(async item => {
            const categoryId = await this.#findOrCreateCategoryItem(item.category)
            await this.#createItem(item, categoryId)
        })
    }

    /**
     * Finds if of category entity if exists,
     * Create new category if entity does not exists
     * 
     * @param {string} category 
     * @returns {number} category entity ID
     */
    async #findOrCreateCategoryItem(category) {
        const [c,] = await this.#Category.findOrCreate({where: { name: category }});
        return c.id;
    }

    /** create item if not exist */
    async #createItem(item, categoryId) {

        const itemExist = await this.#Item.findOne({where: {id: item.id}});
        if (itemExist) return;

        await this.#Item.create({
            id: item.id,
            itemName: item.item_name,
            imageUrl: item.img_url,
            sku: item.sku,
            price: item.price,
            stockQuantity: item.stock_quantity,
            categoryId,
        });
    }
}

module.exports = UtilService;