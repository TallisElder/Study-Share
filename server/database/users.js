const { getDB } = require("./db");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

async function createUser(username, password) {
    const db = getDB();
    const users = db.collection("users");

    if (!username || !password) {
        throw new Error("Username and password are required");
    }

    // Check if username already exists
    const existingUser = await users.findOne({ username });
    if (existingUser) {
        throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
        username,
        password: hashedPassword,
        createdAt: new Date(),
    });

    console.log("User created with id:", result.insertedId);
    return result;
}

async function loginUser(username, password) {
    const db = getDB();
    const users = db.collection("users");

    if (!username || !password) {
        throw new Error("Username and password are required");
    }

    const user = await users.findOne({ username });
    if (!user) {
        throw new Error("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid username or password");
    }

    return user;
}

async function changeUserPassword(userId, currentPassword, newPassword) {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    if (!currentPassword || !newPassword) {
        throw new Error("Current and new passwords are required");
    }

    if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
        throw new Error("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await users.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        }
    );

    return true;
}

async function deleteUserAccount(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const db = getDB();
    const users = db.collection("users");
    const resources = db.collection("resources");
    const userObjectId = new ObjectId(userId);

    const user = await users.findOne({ _id: userObjectId });
    if (!user) {
        throw new Error("User not found");
    }

    await Promise.all([
        resources.deleteMany({ createdBy: userObjectId }),
        users.deleteOne({ _id: userObjectId }),
    ]);

    return true;
}

module.exports = {
    createUser,
    loginUser,
    changeUserPassword,
    deleteUserAccount,
};
