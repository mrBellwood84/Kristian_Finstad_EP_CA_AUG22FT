const { QueryTypes } = require("sequelize");
const { UserExistError, UserEmailMaxError } = require("../errors/authErrors")
const { NotFoundError } = require("../errors/dataErrors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Manage login existing users or creating new users.
 */
class AuthService {

    #sequelize;
    #User;
    #UserEmail;

    /**
     * @param {object} db sequelize db object
     */
    constructor(db) {
        this.#sequelize = db.sequelize;
        this.#User = db.User;
        this.#UserEmail = db.UserEmail;
    }

    /** 
     * Query for user by username.
     * 
     * @param {string} username 
     * @returns User sequelize model 
     */
    async #findUserByUsername(username) {
        return this.#User.findOne({where: { username }});
    }

    /**
     * Get count of users sharing email address
     * 
     * @param {string} email email address
     * @returns {number}
     */
    async #getEmailCount(email) {
        const query = "select count(*) as c from users as u join useremails as e on u.UserEmailId  = e.id where e.email = ?"
        const result = await this.#sequelize.query(query, { replacements: [ email ], type: QueryTypes.SELECT, });
        return result[0].c
    }

    /**
     * Encrypt clear text password with salt using sha256.
     * 
     * @param {string} password clear text password
     * @param {string} salt salt string
     * @returns password hash
     */
    #encryptPassword(password, salt) {
        return crypto.pbkdf2Sync(password,salt, 320000, 32, "sha256");
    }

    /**
     *  Query role id by role name
     * 
     * @param {string} role default "User"
     * @returns {number} role entity id
     */
    async #findRoleIdByRoleName(role = "User") {
        const result = await this.#sequelize.query("select id from roles where role = ?", {
            replacements: [ role ],
            type: QueryTypes.SELECT,
        });
        const roleId = result[0].id
        return roleId;
    }

    /**
     *  Query role name by id
     * 
     * @param {number} id 
     * @returns {string} role
     */
    async #findRoleNameByRoleId(id) {

        const result = await this.#sequelize.query("select role from roles where id = ?", {
            replacements: [ id ],
            type: QueryTypes.SELECT,
        });
        return result[0].role;

    }


    /**
     * Get id of UserEmail entity from provided email.
     * Creates a new entity if not exist.
     * 
     * @param {string} email 
     * @returns {number} id of UserEmail entity
     */
    async #getEmailId(email) {
        const [ userEmail, _ ] = await this.#UserEmail.findOrCreate({ where: { email }});
        return userEmail.id;
    }

    /**
     *  Try login with provided username and password.
     *  Throws NotFoundError if credentials doesn't match.
     * 
     * @param {string} username 
     * @param {string} password clear text
     * @returns {string} Json Web Token
     */
    async login(username, password) {

        // get user, throw error if not exist
        const user = await this.#findUserByUsername(username);
        if (!user) throw new NotFoundError();

        // check password, throw not found if no match
        const encryptedPassword = this.#encryptPassword(password, user.salt);
        if (!crypto.timingSafeEqual(encryptedPassword, user.encryptedPassword))
            throw new NotFoundError();
        
        // create payload for token
        const payload = { 
            id: user.id,
            role: await this.#findRoleNameByRoleId(user.RoleId),
        };

        // create and return token
        const token = jwt.sign(
            payload,
            process.env.TOKEN_SECRET,
            { expiresIn: "2h"}
        );

        return token;
    }

    /**
     *  Creates a new user entity.
     *  Throws an error if any application rules for creating an user account is broken.
     *  If no errors are thrown, an user account was created.
     * 
     * @param {string} firstName
     * @param {string} lastName
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     */
    async signup(firstName, lastName, username, email, password, roleId = undefined) {

        if (Boolean(await this.#findUserByUsername(username))) throw new UserExistError();
        if (await this.#getEmailCount(email) >= 4) throw new UserEmailMaxError();

        const salt = crypto.randomBytes(32);
        const encryptedPassword = this.#encryptPassword(password, salt);

        await this.#User.create({
            firstName,
            lastName,
            username,
            UserEmailId: await this.#getEmailId(email),
            encryptedPassword,
            salt,
            RoleId: roleId ?? await this.#findRoleIdByRoleName(),
        });
    }

    /** creates a new admin account */
    async createAdmin() {
        const roleId = await this.#findRoleIdByRoleName("Admin");
        const firstName = "admin";
        const lastName = "admin";
        const userName = "Admin";
        const password = "P@ssword2023";
        const email = "admin@admin.app";
        await this.signup(firstName, lastName, userName,email,password, roleId);
    }

    /**
     * @param {string} username 
     */
    async deleteUser(username) {
        const user = await this.#findUserByUsername(username);
        if (!user) throw new NotFoundError("Username not found");
        await user.destroy();
    }
}

module.exports = AuthService