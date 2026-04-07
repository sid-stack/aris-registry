import { spawn } from "node:child_process";
import os from "node:os";

const isMacArm = os.platform() === "darwin" && os.arch() === "arm64";
const args = ["playwright", "test", ...process.argv.slice(2)];

const command = isMacArm ? "arch" : "npx";
const commandArgs = isMacArm ? ["-arm64", "npx", ...args] : args;

const child = spawn(command, commandArgs, { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
