const { EntityExistError, NotFoundError, HappyEasterError } = require("../errors/dataErrors");

class CategoryService {
    
    #Category

    constructor(db) {
        this.#Category = db.Category;
    }

    /**
     *  Method for capitalizing strings.
     * 
     * @param {string} name 
     * @returns {string} capitalized string
     */
    #capitalize(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    /** 
     *  Returns boolean value for category existing in database
     * 
     * @param {string} name 
     * @returns {boolean}
     */
    async #categoryExist(name) {
        const result = await this.#Category.findAndCountAll({ where: { name }});
        return result.count > 0;
    }

    /** A simple get all query */
    async getAll() {
        return await this.#Category.findAll({});
    }

    /**
     * 
     * @param {string} name 
     */
    async create(name) {

        // capitalize name
        const nameNorm = this.#capitalize(name);

        // check if category exists in database, throw error if exists
        const exist = await this.#categoryExist(name)
        if (exist) throw new EntityExistError("Category already exists in database");

        // create new category item
        await this.#Category.create({
            name: nameNorm,
        });
    }

    /**
     * Updates an existing category by name.
     * Throws a corresponing error if change not possible or unsuccessful.
     *  
     * @param {number} id 
     * @param {string} name 
     */
    async update(id, name) {

        const nameNorm = this.#capitalize(name);

        // check if entity exist
        const entity = await this.#Category.findOne({where: { id }})
        if (!entity) throw new NotFoundError("Category does not exist!")

        // throw an easter egg if new name match the old name
        if (entity.name === nameNorm) throw new HappyEasterError("An error did not occured when changing the existing category name with with the existing category name.")
        
        // throw entity exist error if category exist in database
        const otherExist = await this.#categoryExist(name);
        if (otherExist) throw new EntityExistError("Category already exists in database");

        await entity.update({name: nameNorm});
    }

    /**
     * Delete an existing category item if exist, else throws an notFound error
     * 
     * @param {number} id 
     */
    async delete(id) {
        const entity = await this.#Category.findOne({where: { id }})
        if (!entity) throw new NotFoundError("Category does not exist!")
        await entity.destroy();
    }
}

module.exports = CategoryService;