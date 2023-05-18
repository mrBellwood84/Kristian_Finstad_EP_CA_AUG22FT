/**
 * Contain database connections and business logic for utility endpoints.
 */

class UtilService {

    #sequelize
    #Role

    /**
     * 
     * @param {object} db sequelize db object
     */
    constructor (db) {
        this.#sequelize = db.sequelize
        this.#Role = db.Role;
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
}

module.exports = UtilService;