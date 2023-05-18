const { UserExistError, UserEmailMaxError } = require("../errors/authErrors")
const { NotFoundError } = require("../errors/dataErrors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Manage login existing users or creating new users.
 */
class AuthService {

    #User;
    #UserEmail;
    #Role;

    /**
     * @param {object} db sequelize db object
     */
    constructor(db) {

        this.#User = db.User;
        this.#UserEmail = db.UserEmail;
        this.#Role = db.Role;
    }

    /** 
     * Query for user by username.
     * 
     * @param {string} username 
     * @returns username if any, else null
     */
    async #getUserByUserName(username) {
        return this.#User.findOne({where: { username }});
    }

    /**
     * Get count of users sharing email address
     * 
     * @param {string} email email address
     * @returns {number}
     */
    async #getEmailCount(email) {
        const UserEmailId = await this.#getEmailId(email);
        return await this.#User.count({where: {UserEmailId}})
    }

    /**
     * Encrypt clear text password with salt using sha256.
     * 
     * @param {string} password clear text password
     * @param {string} salt salt string
     * @returns {string} password hash
     */
    #encryptPassword(password, salt) {
        return crypto.pbkdf2Sync(password,salt, 320000, 32, "sha256");
    }

    /**
     *  Get Role id. Primary for User role (default value).
     * 
     * @param {string} role default "User"
     * @returns {number} role entity id
     */
    async #getRoleId(role = "User") {
        const [ r, _ ] = await this.#Role.findOrCreate({where: { role }});
        return r.id;
    }

    /**
     *  Get role from role entity queried by id.
     * 
     * @param {number} id 
     * @returns {string} role
     */
    async #getRoleById(id) {
        const role = await this.#Role.findOne({where: { id }})
        return role.role;
    }

    /**
     * Get id of UserEmail entity from provided email.
     * Creates a new entity if not exist.
     * 
     * @param {string} email 
     * @returns {number} id of UserEmail entity
     */
    async #getEmailId(email) {
        const [ userEmail, _ ] = await this.#UserEmail.findOrCreate({where: { email }});
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
        const user = await this.#getUserByUserName(username);
        if (!user) throw new NotFoundError();

        // check password, throw not found if no match
        const encryptedPassword = this.#encryptPassword(password, user.salt);
        if (!crypto.timingSafeEqual(encryptedPassword, user.encryptedPassword))
            throw new NotFoundError();
        
        // create payload for token
        const payload = { 
            id: user.id,
            role: await this.#getRoleById(user.RoleId),
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
     * @param {string} username 
     * @param {string} email 
     * @param {string} password 
     */
    async signup(username, email, password, roleId = undefined) {

        if (Boolean(await this.#getUserByUserName(username))) throw new UserExistError();
        if (await this.#getEmailCount(email) >= 4) throw new UserEmailMaxError();

        const salt = crypto.randomBytes(32);
        const encryptedPassword = this.#encryptPassword(password, salt);

        await this.#User.create({
            username,
            UserEmailId: await this.#getEmailId(email),
            encryptedPassword,
            salt,
            RoleId: roleId ?? await this.#getRoleId(),
        });
    }

    async createAdmin() {
        const roleId = await this.#getRoleId("Admin");
        const userName = "Admin";
        const password = "P@ssword2023";
        const email = "admin@admin.app";
        await this.signup(userName,email,password, roleId);
    }

    /**
     * DEV :: added for dev purposes.
     * @param {string} username 
     */
    async deleteUser(username) {
        console.log("DEV :: USER " + username.toString() + " was deleted!!");
        const user = await this.#getUserByUserName(username);
        if (user) await user.destroy();
    }
}

module.exports = AuthService