// database/resources.jsx
const { getDB } = require("./db");
const { ObjectId } = require("mongodb");

function normalizeObjectId(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "object") {
        if (typeof value.$oid === "string") {
            return value.$oid;
        }

        if (typeof value.toHexString === "function") {
            return value.toHexString();
        }

        if (typeof value.toString === "function") {
            const maybeId = value.toString();
            if (maybeId && maybeId !== "[object Object]") {
                return maybeId;
            }
        }
    }

    return "";
}

async function attachCreatorUsernames(resources) {
    if (!Array.isArray(resources) || resources.length === 0) {
        return [];
    }

    const db = getDB();
    const users = db.collection("users");
    const idsToLookup = [];

    for (const resource of resources) {
        if (resource?.createdByUsername) {
            continue;
        }

        const createdBy = normalizeObjectId(resource?.createdBy);
        if (ObjectId.isValid(createdBy)) {
            idsToLookup.push(new ObjectId(createdBy));
        }
    }

    const uniqueLookupIds = Array.from(
        new Map(idsToLookup.map((id) => [id.toHexString(), id])).values()
    );

    const foundUsers =
        uniqueLookupIds.length > 0
            ? await users
                .find(
                    { _id: { $in: uniqueLookupIds } },
                    { projection: { username: 1 } }
                )
                .toArray()
            : [];

    const usernameByUserId = new Map(
        foundUsers.map((user) => [user._id.toHexString(), user.username])
    );

    return resources.map((resource) => {
        const createdBy = normalizeObjectId(resource?.createdBy);
        const resolvedUsername =
            resource?.createdByUsername ||
            usernameByUserId.get(createdBy) ||
            "Unknown user";

        return {
            ...resource,
            createdByUsername: resolvedUsername,
        };
    });
}

// CREATE a new resource
async function createResource(title, description, subject, link, userId, creatorUsername = "") {
    if (!title || !description || !subject || !link) {
        throw new Error("All fields are required");
    }
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const db = getDB();
    const resources = db.collection("resources");

    const resourceDoc = {
        title,
        description,
        subject,
        link,
        createdBy: new ObjectId(userId),
        createdByUsername: creatorUsername || "Unknown user",
        createdAt: new Date(),
    };

    const result = await resources.insertOne(resourceDoc);

    // Return the full inserted document
    return await resources.findOne({ _id: result.insertedId });
}

// GET all resources
async function getAllResources() {
    const db = getDB();
    const resources = db.collection("resources");
    const allResources = await resources.find().toArray();

    return await attachCreatorUsernames(allResources);
}

// GET resources created by a specific user
async function getResourcesByUser(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const db = getDB();
    const resources = db.collection("resources");
    const userResources = await resources
        .find({ createdBy: new ObjectId(userId) })
        .toArray();

    return await attachCreatorUsernames(userResources);
}

// DELETE a resource (only by its creator)
async function deleteResource(resourceId, userId) {
    if (!ObjectId.isValid(resourceId) || !ObjectId.isValid(userId)) {
        throw new Error("Invalid ID");
    }

    const db = getDB();
    const resources = db.collection("resources");

    const resource = await resources.findOne({ _id: new ObjectId(resourceId) });

    if (!resource) {
        throw new Error("Resource not found");
    }

    if (resource.createdBy.toString() !== userId.toString()) {
        throw new Error("Unauthorized");
    }

    await resources.deleteOne({ _id: new ObjectId(resourceId) });

    return true;
}

module.exports = {
    createResource,
    getAllResources,
    getResourcesByUser,
    deleteResource,
};
