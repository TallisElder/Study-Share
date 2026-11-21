const test = require("node:test");
const assert = require("node:assert/strict");

const usersModulePath = require.resolve("../database/users");
const dbModulePath = require.resolve("../database/db");
const bcryptModulePath = require.resolve("bcryptjs");

function loadUsersModuleWithMocks({ getDBMock, bcryptMock }) {
    const originalUsersCache = require.cache[usersModulePath];
    const originalDbCache = require.cache[dbModulePath];
    const originalBcryptCache = require.cache[bcryptModulePath];

    delete require.cache[usersModulePath];
    delete require.cache[dbModulePath];
    delete require.cache[bcryptModulePath];

    require.cache[dbModulePath] = {
        id: dbModulePath,
        filename: dbModulePath,
        loaded: true,
        exports: { getDB: getDBMock },
    };

    require.cache[bcryptModulePath] = {
        id: bcryptModulePath,
        filename: bcryptModulePath,
        loaded: true,
        exports: bcryptMock,
    };

    const usersModule = require("../database/users");

    return {
        usersModule,
        restore() {
            delete require.cache[usersModulePath];
            delete require.cache[dbModulePath];
            delete require.cache[bcryptModulePath];

            if (originalUsersCache) {
                require.cache[usersModulePath] = originalUsersCache;
            }
            if (originalDbCache) {
                require.cache[dbModulePath] = originalDbCache;
            }
            if (originalBcryptCache) {
                require.cache[bcryptModulePath] = originalBcryptCache;
            }
        },
    };
}

test("createUser inserts a hashed password for a new username", async () => {
    let insertedDoc = null;

    const usersCollection = {
        findOne: async () => null,
        insertOne: async (doc) => {
            insertedDoc = doc;
            return { insertedId: "user-1" };
        },
    };

    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection(name) {
                assert.equal(name, "users");
                return usersCollection;
            },
        }),
        bcryptMock: {
            hash: async (password, rounds) => `hashed:${password}:${rounds}`,
            compare: async () => false,
        },
    });

    try {
        const result = await usersModule.createUser("alice", "password123");

        assert.equal(result.insertedId, "user-1");
        assert.equal(insertedDoc.username, "alice");
        assert.equal(insertedDoc.password, "hashed:password123:10");
        assert.equal(insertedDoc.createdAt instanceof Date, true);
    } finally {
        restore();
    }
});

test("createUser rejects when username already exists", async () => {
    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection() {
                return {
                    findOne: async () => ({ _id: "existing" }),
                    insertOne: async () => {
                        throw new Error("should not insert");
                    },
                };
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => false,
        },
    });

    try {
        await assert.rejects(
            () => usersModule.createUser("alice", "password123"),
            /Username already exists/
        );
    } finally {
        restore();
    }
});

test("loginUser rejects with missing credentials", async () => {
    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection() {
                return {
                    findOne: async () => null,
                };
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => false,
        },
    });

    try {
        await assert.rejects(() => usersModule.loginUser("", ""), /Username and password are required/);
    } finally {
        restore();
    }
});

test("loginUser returns user for valid username and password", async () => {
    const mockUser = { _id: "user-1", username: "alice", password: "stored-hash" };

    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection() {
                return {
                    findOne: async () => mockUser,
                };
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => true,
        },
    });

    try {
        const result = await usersModule.loginUser("alice", "password123");

        assert.equal(result, mockUser);
    } finally {
        restore();
    }
});

test("changeUserPassword updates password hash for a valid current password", async () => {
    const userId = "507f191e810c19729de860ea";
    const dbState = {
        users: {
            findOne: async () => ({ _id: userId, password: "old-hash" }),
            updateOne: async (filter, update) => ({ filter, update }),
        },
        resources: {},
    };

    let updateArgs = null;
    dbState.users.updateOne = async (filter, update) => {
        updateArgs = { filter, update };
        return { modifiedCount: 1 };
    };

    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection(name) {
                return dbState[name];
            },
        }),
        bcryptMock: {
            hash: async (password) => `new-hash:${password}`,
            compare: async () => true,
        },
    });

    try {
        const result = await usersModule.changeUserPassword(userId, "old-pass", "new-pass-123");

        assert.equal(result, true);
        assert.equal(updateArgs.filter._id.toHexString(), userId);
        assert.equal(updateArgs.update.$set.password, "new-hash:new-pass-123");
        assert.equal(updateArgs.update.$set.updatedAt instanceof Date, true);
    } finally {
        restore();
    }
});

test("changeUserPassword rejects invalid user id", async () => {
    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection() {
                throw new Error("DB should not be called");
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => false,
        },
    });

    try {
        await assert.rejects(
            () => usersModule.changeUserPassword("bad-id", "old-pass", "new-pass-123"),
            /Invalid user ID/
        );
    } finally {
        restore();
    }
});

test("deleteUserAccount removes user and their resources", async () => {
    const userId = "507f191e810c19729de860ea";
    const calls = [];

    const usersCollection = {
        findOne: async () => ({ _id: userId, username: "alice" }),
        deleteOne: async (filter) => {
            calls.push({ type: "deleteOne", filter });
            return { deletedCount: 1 };
        },
    };

    const resourcesCollection = {
        deleteMany: async (filter) => {
            calls.push({ type: "deleteMany", filter });
            return { deletedCount: 2 };
        },
    };

    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection(name) {
                if (name === "users") {
                    return usersCollection;
                }
                if (name === "resources") {
                    return resourcesCollection;
                }
                throw new Error(`Unexpected collection: ${name}`);
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => false,
        },
    });

    try {
        const result = await usersModule.deleteUserAccount(userId);

        assert.equal(result, true);
        assert.equal(calls.length, 2);
        assert.equal(calls[0].type, "deleteMany");
        assert.equal(calls[0].filter.createdBy.toHexString(), userId);
        assert.equal(calls[1].type, "deleteOne");
        assert.equal(calls[1].filter._id.toHexString(), userId);
    } finally {
        restore();
    }
});

test("deleteUserAccount rejects when user does not exist", async () => {
    const { usersModule, restore } = loadUsersModuleWithMocks({
        getDBMock: () => ({
            collection(name) {
                if (name === "users") {
                    return {
                        findOne: async () => null,
                        deleteOne: async () => ({ deletedCount: 0 }),
                    };
                }
                return {
                    deleteMany: async () => ({ deletedCount: 0 }),
                };
            },
        }),
        bcryptMock: {
            hash: async () => "unused",
            compare: async () => false,
        },
    });

    try {
        await assert.rejects(
            () => usersModule.deleteUserAccount("507f191e810c19729de860ea"),
            /User not found/
        );
    } finally {
        restore();
    }
});
