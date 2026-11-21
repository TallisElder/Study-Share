const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const verifyToken = require("../controllers/verifyToken");

function createMockResponse() {
    return {
        statusCode: null,
        sendStatus(code) {
            this.statusCode = code;
            return code;
        },
    };
}

test("verifyToken returns 401 when cookie token is missing", () => {
    process.env.JWT_SECRET = "test-secret";

    const req = { cookies: {} };
    const res = createMockResponse();
    let calledNext = false;

    verifyToken(req, res, () => {
        calledNext = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(calledNext, false);
});

test("verifyToken returns 403 when token is invalid", () => {
    process.env.JWT_SECRET = "test-secret";

    const req = { cookies: { token: "not-a-valid-token" } };
    const res = createMockResponse();
    let calledNext = false;

    verifyToken(req, res, () => {
        calledNext = true;
    });

    assert.equal(res.statusCode, 403);
    assert.equal(calledNext, false);
});

test("verifyToken attaches user and calls next when token is valid", () => {
    process.env.JWT_SECRET = "test-secret";

    const token = jwt.sign(
        { userId: "507f191e810c19729de860ea", username: "alice" },
        process.env.JWT_SECRET
    );
    const req = { cookies: { token } };
    const res = createMockResponse();
    let calledNext = false;

    verifyToken(req, res, () => {
        calledNext = true;
    });

    assert.equal(res.statusCode, null);
    assert.equal(calledNext, true);
    assert.equal(req.user.userId, "507f191e810c19729de860ea");
    assert.equal(req.user.username, "alice");
});
