const test = require("node:test");
const assert = require("node:assert/strict");

const controllerPath = require.resolve("../controllers/authController");
const usersModulePath = require.resolve("../database/users");

function createMockResponse() {
    return {
        statusCode: null,
        jsonBody: null,
        clearedCookie: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.jsonBody = payload;
            return this;
        },
        clearCookie(name, options) {
            this.clearedCookie = { name, options };
            return this;
        },
    };
}

function loadAuthControllerWithUsersMock(usersMock) {
    const originalUsersCache = require.cache[usersModulePath];
    const originalControllerCache = require.cache[controllerPath];

    delete require.cache[usersModulePath];
    delete require.cache[controllerPath];

    require.cache[usersModulePath] = {
        id: usersModulePath,
        filename: usersModulePath,
        loaded: true,
        exports: usersMock,
    };

    const controller = require("../controllers/authController");

    return {
        controller,
        restore() {
            delete require.cache[controllerPath];
            delete require.cache[usersModulePath];

            if (originalUsersCache) {
                require.cache[usersModulePath] = originalUsersCache;
            }
            if (originalControllerCache) {
                require.cache[controllerPath] = originalControllerCache;
            }
        },
    };
}

test("register returns 201 and user id on success", async () => {
    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({}),
        changeUserPassword: async () => true,
        deleteUserAccount: async () => true,
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = { body: { username: "alice", password: "password123" } };
    const res = createMockResponse();
    await controller.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonBody.userId, "user-1");
    restore();
});

test("login returns cookie and 200 on success", async () => {
    process.env.JWT_SECRET = "test-secret";

    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({
            _id: { toString: () => "507f191e810c19729de860ea" },
            username: "alice",
        }),
        changeUserPassword: async () => true,
        deleteUserAccount: async () => true,
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = { body: { username: "alice", password: "password123" } };
    const res = {
        ...createMockResponse(),
        cookieName: null,
        cookieValue: null,
        cookieOptions: null,
        cookie(name, value, options) {
            this.cookieName = name;
            this.cookieValue = value;
            this.cookieOptions = options;
            return this;
        },
    };

    await controller.login(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.cookieName, "token");
    assert.equal(typeof res.cookieValue, "string");
    assert.equal(res.cookieOptions.httpOnly, true);
    assert.equal(res.jsonBody.username, "alice");
    restore();
});

test("updatePassword returns 200 on success", async () => {
    let capturedArgs = null;
    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({}),
        changeUserPassword: async (...args) => {
            capturedArgs = args;
            return true;
        },
        deleteUserAccount: async () => true,
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = {
        user: { userId: "507f191e810c19729de860ea" },
        body: { currentPassword: "old-pass", newPassword: "new-pass-123" },
    };
    const res = createMockResponse();
    await controller.updatePassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedArgs, [
        "507f191e810c19729de860ea",
        "old-pass",
        "new-pass-123",
    ]);
    restore();
});

test("updatePassword returns 400 when change function throws", async () => {
    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({}),
        changeUserPassword: async () => {
            throw new Error("Current password is incorrect");
        },
        deleteUserAccount: async () => true,
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = {
        user: { userId: "507f191e810c19729de860ea" },
        body: { currentPassword: "wrong", newPassword: "new-pass-123" },
    };
    const res = createMockResponse();
    await controller.updatePassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonBody.message, "Current password is incorrect");
    restore();
});

test("removeAccount clears token cookie and returns 200 on success", async () => {
    let capturedUserId = null;
    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({}),
        changeUserPassword: async () => true,
        deleteUserAccount: async (userId) => {
            capturedUserId = userId;
            return true;
        },
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = { user: { userId: "507f191e810c19729de860ea" } };
    const res = createMockResponse();
    await controller.removeAccount(req, res);

    assert.equal(capturedUserId, "507f191e810c19729de860ea");
    assert.equal(res.statusCode, 200);
    assert.equal(res.clearedCookie.name, "token");
    assert.equal(res.clearedCookie.options.httpOnly, true);
    restore();
});

test("removeAccount returns 400 when delete function throws", async () => {
    const mockUsers = {
        createUser: async () => ({ insertedId: "user-1" }),
        loginUser: async () => ({}),
        changeUserPassword: async () => true,
        deleteUserAccount: async () => {
            throw new Error("User not found");
        },
    };
    const { controller, restore } = loadAuthControllerWithUsersMock(mockUsers);

    const req = { user: { userId: "507f191e810c19729de860ea" } };
    const res = createMockResponse();
    await controller.removeAccount(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonBody.message, "User not found");
    restore();
});
