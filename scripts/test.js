const { spawn } = require("node:child_process");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const targets = [
    {
        name: "server",
        cwd: path.join(__dirname, "..", "server"),
        args: ["run", "test"],
    },
    {
        name: "client",
        cwd: path.join(__dirname, "..", "client"),
        args: ["run", "test"],
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
let combinedExitCode = 0;

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
    combinedExitCode = 1;
    stopChildren(signal);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

children.forEach((child, index) => {
    child.on("error", (error) => {
        console.error(`Failed to start ${targets[index].name} tests:`, error);

        if (!shuttingDown) {
            shuttingDown = true;
            combinedExitCode = 1;
            stopChildren("SIGTERM");
        }
    });

    child.on("exit", (code, signal) => {
        runningChildren -= 1;

        if (code !== 0 || signal) {
            combinedExitCode = 1;
        }

        if (runningChildren === 0) {
            process.exit(combinedExitCode);
        }
    });
});
