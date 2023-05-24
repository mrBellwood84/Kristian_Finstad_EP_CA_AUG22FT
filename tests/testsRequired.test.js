require("dotenv").config();

const express = require("express");
const request = require("supertest");
const bodyParser = require("body-parser");
const jsend = require("jsend");

const app = express();
const authRoutes = require("../routes/auth");
const categoryRoutes = require("../routes/categories");
const itemRoutes = require("../routes/items");
const utilRoutes = require("../routes/utils");

app.use(bodyParser.json());
app.use(jsend.middleware);
app.use("/", authRoutes);
app.use("/", categoryRoutes);
app.use("/", itemRoutes);
app.use("/", utilRoutes);

const testAccount = {
    firstName: "test",
    lastName: "user",
    username: "testuser",
    email: "test@app.com",
    password: "test123",
    token: undefined,
}

const adminAccount = {
    username: "Admin",
    password: "P@ssword2023",
    token: undefined,
}

const testCategoryName = "CAT_TEST";
const testItemName = "ITEM_TEST";
const testItemSKU = "TEST_123";

describe("Required tests", () => {

    test("1: POST /setup - 200 Success, data exist, was created, or imported", async () => {
        const { status } = await request(app).post("/setup");
        expect(status).toEqual(200);
    });

    test("2: POST /signup - 200 Create test user", async () => {
        const { status, body } = await 
            request(app)
                .post("/signup")
                .send(testAccount);
        expect(status).toEqual(200);
    });

    test("3: POST /login - 200, Login test user", async () => {
        const { status, body } = await request(app).post("/login").send(testAccount);
        expect(status).toEqual(200)
        expect(body.data.token).toBeDefined();
        testAccount.token = body.data.token;
    })

    test("4: POST /category - SUCCESS, new category created", async () => {

        // login admin
        const adminLoginResponse = await
            request(app).post("/login").send(adminAccount);
        expect(adminLoginResponse.status).toEqual(200);
        expect(adminLoginResponse.body.data.token).toBeDefined();
        adminAccount.token = adminLoginResponse.body.data.token;

        const { status, body } = await request(app)
            .post("/category")
            .set("Authorization", `Bearer ${adminAccount.token}`)
            .send({name: testCategoryName});
        expect(status).toEqual(200);
    });

    test("5: POST /item - Success - new item created", async () => {

        const categorySearchResponse = await request(app).get("/categories")
        expect(categorySearchResponse.status).toEqual(200)

        const catId = categorySearchResponse.body.data.filter(x => x.name === testCategoryName)[0].id;

        const testItem = {
            itemName: testItemName,
            imageUrl: ".",
            categoryId: catId,
            sku: testItemSKU,
            price: 0,
            stockQuantity: 0,            
        };

        const { status } = await
            request(app)
            .post("/item")
            .set("Authorization", `Bearer ${adminAccount.token}`)
            .send(testItem);
        
        expect(status).toEqual(200);

    });

    test("6: POST /search - Success, items with partial text \"mart\"", async () => {
        const requestBody = { itemName: "mart" }
        const { status, body } = await request(app).post("/search").send(requestBody);
        expect(status).toEqual(200)
        expect(body.data).toBeDefined();
        expect(body.data.length).toBeGreaterThanOrEqual(3)
    });

    test("7: POST /search - Success, Get least 1 item with category \"Laptop\"", async () => {
        const requestBody = { category: "Laptop" }
        const { status, body } = await request(app).post("/search").send(requestBody);
        expect(status).toEqual(200);
        expect(body.data).toBeDefined()
        expect(body.data.length).toBeGreaterThanOrEqual(1)
        expect(body.data[0].category.name).toEqual(requestBody.category);
    });

    test("8: Test admin routes with user account", async () => {

        const categoryPutResponse = await 
            request(app)
            .put("/category/123")
            .set("Authorization", `Bearer ${testAccount.token}`);
        expect(categoryPutResponse.status).toEqual(403)

        const itemPutResponse = await 
            request(app)
            .put("/item/123")
            .set("Authorization", `Bearer ${testAccount.token}`);
        expect(itemPutResponse.status).toEqual(403)

        const itemDeleteResponse = await
            request(app)
            .delete("/item/123")
            .set("Authorization", `Bearer ${testAccount.token}`);
        expect(itemDeleteResponse.status).toEqual(403);
    });

    test("9: Delete test item, test category, test user", async () => {

        // delete item
        const itemSearchResponse = await request(app)
            .post("/search")
            .send({sku: testItemSKU });
        expect(itemSearchResponse.status).toEqual(200);

        const itemId = itemSearchResponse.body.data.id;
        const itemDeleteResponse = await request(app)
            .delete(`/item/${itemId}`)
            .set("Authorization", `Bearer ${adminAccount.token}`);
        expect(itemDeleteResponse.status).toEqual(200);

        // delete category
        const categorySearchResponse = await request(app).get("/categories")
        expect(categorySearchResponse.status).toEqual(200)

        const catId = categorySearchResponse.body.data.filter(x => x.name === testCategoryName)[0].id;
        const deleteCategoryResponse = await request(app)
            .delete(`/category/${catId}`)
            .set("Authorization", `Bearer ${adminAccount.token}`);
        expect(deleteCategoryResponse.status).toEqual(200);

        // delete user
        const deleteUserResponse = await 
            request(app)
                .delete(`/users/${testAccount.username}`)
                .set("Authorization", `Bearer ${adminAccount.token}`);
        expect(deleteUserResponse.status).toEqual(200);
    });

    test("10: Run setup with no api call", async () => {
        const { status, body } = await request(app).post("/setup");
        expect(status).toEqual(200);
        expect(body.data.apiCall).toEqual("Data exists in database");
    })
});
