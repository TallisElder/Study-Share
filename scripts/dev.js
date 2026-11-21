const { spawn } = require("node:child_process");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const targets = [
    {
        name: "server",
        cwd: path.join(__dirname, "..", "server"),
        args: ["run", "dev"],
    },
    {
        name: "client",
        cwd: path.join(__dirname, "..", "client"),
        args: ["run", "dev"],
    },
];

const children = targets.map((target) =>
    spawn(npmCommand, target.args, {
        cwd: target.cwd,
        env: process.env,
        stdio: "inherit",
    })
);

let shuttingDown = false;
let runningChildren = children.length;

function stopChildren(signal = "SIGTERM") {
    for (const child of children) {
        if (!child.killed) {
            child.kill(signal);
        }
    }
}

function handleShutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    process.exitCode = 0;
    stopChildren(signal);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

children.forEach((child, index) => {
    child.on("error", (error) => {
        console.error(`Failed to start ${targets[index].name}:`, error);

        if (!shuttingDown) {
            shuttingDown = true;
            process.exitCode = 1;
            stopChildren("SIGTERM");
        }
    });

    child.on("exit", (code, signal) => {
        runningChildren -= 1;

        if (!shuttingDown) {
            shuttingDown = true;
            process.exitCode = code ?? (signal ? 1 : 0);
            stopChildren("SIGTERM");
        }

        if (runningChildren === 0) {
            process.exit(process.exitCode ?? 0);
        }
    });
});
