require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const resourceRoute = require("./routes/resourceRoute");
const { connectDB } = require("./database/db");

const codioOriginPattern = /^https:\/\/[a-z0-9-]+\.codio\.io$/i;
const configuredOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
const defaultAllowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    if (defaultAllowedOrigins.includes(origin)) {
        return true;
    }

    if (configuredOrigins.includes(origin)) {
        return true;
    }

    return codioOriginPattern.test(origin);
}

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/resources", resourceRoute);

async function StartServer() {
    await connectDB();
    const PORT = process.env.PORT || 8080;
    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));
}

StartServer();
