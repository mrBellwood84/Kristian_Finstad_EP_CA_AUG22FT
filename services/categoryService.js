const { QueryTypes } = require("sequelize");
const { EntityExistError, NotFoundError, HappyEasterError } = require("../errors/dataErrors");

class CategoryService {
    
    #sequelize
    #Category

    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#Category = db.Category;
    }

    /** 
     *  Returns boolean value for category existing in database
     * 
     * @param {string} name 
     * @returns {boolean}
     */
    async #categoryExist(name) {
        const res = await this.#sequelize.query("select count(id) as c from categories where name = ?", {
            replacements: [name],
            type: QueryTypes.SELECT,
        });
        return res[0].c > 0;
    }

    async #hasDependentItems(id) {
        const res = await this.#sequelize.query("select count(id) as c from items where categoryId = ?", {
            replacements: [ id ],
            type: QueryTypes.SELECT,
        });

        return res[0].c > 0;
    }

    /** A simple get all query */
    async getAll() {
        return await this.#Category.findAll({});
    }

    /**
     * Create new category from provided name.
     * Throws Entity exist error if category name exists
     * 
     * @param {string} name 
     */
    async create(name) {

        // check if category exists in database, throw error if exists
        const exist = await this.#categoryExist(name)
        if (exist) throw new EntityExistError("Category already exists in database");

        // create new category item
        await this.#Category.create({ name });
    }

    /**
     * Updates an existing category by name.
     * Throws a corresponing error if change not possible or unsuccessful.
     *  
     * @param {number} id 
     * @param {string} name 
     */
    async update(id, name) {

        // check if entity exist
        const entity = await this.#Category.findOne({where: { id }})
        if (!entity) throw new NotFoundError("Category does not exist!")

        // throw an easter egg if new name match the old name
        if (entity.name === name) throw new HappyEasterError("The API states that it is not acceptable to replace the existing name with the existing name")
        
        // throw entity exist error if category exist in database
        const otherExist = await this.#categoryExist(name);
        if (otherExist) throw new EntityExistError("Category already exists in database");
        await entity.update({ name });
    }

    /**
     * Delete an existing category item if exist, else throws an notFound error
     * 
     * @param {number} id 
     */
    async delete(id) {
        const entity = await this.#Category.findOne({where: { id }})
        if (!entity) throw new NotFoundError("Category does not exist!")
        if (await this.#hasDependentItems(id)) throw new EntityExistError("Can not delete category with dependent item");
        
        await entity.destroy();
    }
}

module.exports = CategoryService;