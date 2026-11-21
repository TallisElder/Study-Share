const test = require("node:test");
const assert = require("node:assert/strict");
const { ObjectId } = require("mongodb");

const resourceModulePath = require.resolve("../database/resource");
const dbModulePath = require.resolve("../database/db");

function loadResourceModuleWithDbMock(getDBMock) {
    const originalResourceCache = require.cache[resourceModulePath];
    const originalDbCache = require.cache[dbModulePath];

    delete require.cache[resourceModulePath];
    delete require.cache[dbModulePath];

    require.cache[dbModulePath] = {
        id: dbModulePath,
        filename: dbModulePath,
        loaded: true,
        exports: { getDB: getDBMock },
    };

    const resourceModule = require("../database/resource");

    return {
        resourceModule,
        restore() {
            delete require.cache[resourceModulePath];
            delete require.cache[dbModulePath];

            if (originalResourceCache) {
                require.cache[resourceModulePath] = originalResourceCache;
            }
            if (originalDbCache) {
                require.cache[dbModulePath] = originalDbCache;
            }
        },
    };
}

function makeCursor(items) {
    return {
        async toArray() {
            return items;
        },
    };
}

test("createResource inserts resource and returns inserted document", async () => {
    const userId = "507f191e810c19729de860ea";
    const insertedId = new ObjectId();
    let insertedDoc = null;

    const resourcesCollection = {
        insertOne: async (doc) => {
            insertedDoc = doc;
            return { insertedId };
        },
        findOne: async (query) => ({
            _id: query._id,
            ...insertedDoc,
        }),
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection(name) {
            assert.equal(name, "resources");
            return resourcesCollection;
        },
    }));

    try {
        const result = await resourceModule.createResource(
            "Title",
            "Description",
            "Subject",
            "https://example.com",
            userId,
            "alice"
        );

        assert.equal(insertedDoc.title, "Title");
        assert.equal(insertedDoc.createdBy.toHexString(), userId);
        assert.equal(insertedDoc.createdByUsername, "alice");
        assert.equal(insertedDoc.createdAt instanceof Date, true);
        assert.equal(result._id.toHexString(), insertedId.toHexString());
    } finally {
        restore();
    }
});

test("createResource rejects when required fields are missing", async () => {
    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            throw new Error("DB should not be called");
        },
    }));

    try {
        await assert.rejects(
            () => resourceModule.createResource("", "", "", "", "507f191e810c19729de860ea"),
            /All fields are required/
        );
    } finally {
        restore();
    }
});

test("getAllResources attaches creator usernames from users collection", async () => {
    const creatorId = new ObjectId("507f191e810c19729de860ea");

    const resourcesCollection = {
        find() {
            return makeCursor([
                {
                    _id: new ObjectId(),
                    title: "Guide",
                    createdBy: creatorId,
                },
            ]);
        },
    };

    let usersQuery = null;
    const usersCollection = {
        find(query) {
            usersQuery = query;
            return makeCursor([
                {
                    _id: creatorId,
                    username: "alice",
                },
            ]);
        },
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection(name) {
            if (name === "resources") {
                return resourcesCollection;
            }
            if (name === "users") {
                return usersCollection;
            }
            throw new Error(`Unexpected collection: ${name}`);
        },
    }));

    try {
        const result = await resourceModule.getAllResources();

        assert.equal(usersQuery._id.$in.length, 1);
        assert.equal(result.length, 1);
        assert.equal(result[0].createdByUsername, "alice");
    } finally {
        restore();
    }
});

test("getResourcesByUser rejects invalid user id", async () => {
    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            throw new Error("DB should not be called");
        },
    }));

    try {
        await assert.rejects(() => resourceModule.getResourcesByUser("bad-id"), /Invalid user ID/);
    } finally {
        restore();
    }
});

test("getResourcesByUser preserves existing createdByUsername without lookup", async () => {
    let usersFindCalled = false;

    const resourcesCollection = {
        find(query) {
            assert.equal(query.createdBy.toHexString(), "507f191e810c19729de860ea");
            return makeCursor([
                {
                    _id: new ObjectId(),
                    title: "Mine",
                    createdBy: new ObjectId("507f191e810c19729de860ea"),
                    createdByUsername: "alice",
                },
            ]);
        },
    };

    const usersCollection = {
        find() {
            usersFindCalled = true;
            return makeCursor([]);
        },
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection(name) {
            if (name === "resources") {
                return resourcesCollection;
            }
            if (name === "users") {
                return usersCollection;
            }
            throw new Error(`Unexpected collection: ${name}`);
        },
    }));

    try {
        const result = await resourceModule.getResourcesByUser("507f191e810c19729de860ea");

        assert.equal(usersFindCalled, false);
        assert.equal(result[0].createdByUsername, "alice");
    } finally {
        restore();
    }
});

test("deleteResource rejects when resource id or user id is invalid", async () => {
    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            throw new Error("DB should not be called");
        },
    }));

    try {
        await assert.rejects(
            () => resourceModule.deleteResource("bad-resource-id", "507f191e810c19729de860ea"),
            /Invalid ID/
        );
    } finally {
        restore();
    }
});

test("deleteResource rejects when resource does not exist", async () => {
    const resourcesCollection = {
        findOne: async () => null,
        deleteOne: async () => ({ deletedCount: 0 }),
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            return resourcesCollection;
        },
    }));

    try {
        await assert.rejects(
            () =>
                resourceModule.deleteResource(
                    "507f191e810c19729de860ea",
                    "507f1f77bcf86cd799439011"
                ),
            /Resource not found/
        );
    } finally {
        restore();
    }
});

test("deleteResource rejects when caller is not the creator", async () => {
    const resourcesCollection = {
        findOne: async () => ({
            _id: new ObjectId("507f191e810c19729de860ea"),
            createdBy: new ObjectId("507f191e810c19729de860ea"),
        }),
        deleteOne: async () => ({ deletedCount: 0 }),
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            return resourcesCollection;
        },
    }));

    try {
        await assert.rejects(
            () =>
                resourceModule.deleteResource(
                    "507f191e810c19729de860ea",
                    "507f1f77bcf86cd799439011"
                ),
            /Unauthorized/
        );
    } finally {
        restore();
    }
});

test("deleteResource deletes resource when caller owns it", async () => {
    let deletedFilter = null;
    const resourcesCollection = {
        findOne: async () => ({
            _id: new ObjectId("507f191e810c19729de860ea"),
            createdBy: new ObjectId("507f1f77bcf86cd799439011"),
        }),
        deleteOne: async (filter) => {
            deletedFilter = filter;
            return { deletedCount: 1 };
        },
    };

    const { resourceModule, restore } = loadResourceModuleWithDbMock(() => ({
        collection() {
            return resourcesCollection;
        },
    }));

    try {
        const result = await resourceModule.deleteResource(
            "507f191e810c19729de860ea",
            "507f1f77bcf86cd799439011"
        );

        assert.equal(result, true);
        assert.equal(deletedFilter._id.toHexString(), "507f191e810c19729de860ea");
    } finally {
        restore();
    }
});
