#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, createWriteStream, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const SHFMT_VERSION = "v3.13.1";

const assetByTarget = {
	"aarch64-apple-darwin": "shfmt_v3.13.1_darwin_arm64",
	"x86_64-apple-darwin": "shfmt_v3.13.1_darwin_amd64",
	"aarch64-unknown-linux-gnu": "shfmt_v3.13.1_linux_arm64",
	"x86_64-unknown-linux-gnu": "shfmt_v3.13.1_linux_amd64",
	"i686-pc-windows-msvc": "shfmt_v3.13.1_windows_386.exe",
	"x86_64-pc-windows-msvc": "shfmt_v3.13.1_windows_amd64.exe",
};

const sha256ByAsset = {
	"shfmt_v3.13.1_darwin_amd64": "6feedafc72915794163114f512348e2437d080d0047ef8b8fa2ec63b575f12af",
	"shfmt_v3.13.1_darwin_arm64": "9680526be4a66ea1ffe988ed08af58e1400fe1e4f4aef5bd88b20bb9b3da33f8",
	"shfmt_v3.13.1_linux_arm64": "32d92acaa5cd8abb29fc49dac123dc412442d5713967819d8af2c29f1b3857c7",
	"shfmt_v3.13.1_linux_amd64": "fb096c5d1ac6beabbdbaa2874d025badb03ee07929f0c9ff67563ce8c75398b1",
	"shfmt_v3.13.1_windows_386.exe": "9b4f368b837feb883a3b2bf38a46a94dcab4bca4b7c3e19f6710e0e09a56ce7c",
	"shfmt_v3.13.1_windows_amd64.exe": "60cd368533d0ad73fa86d93d5bbf95ef40587245ce684ed138c1b31557b5fe97",
};

function readTarget() {
	const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
	if (targetArg) return targetArg.slice("--target=".length);

	const targetArgIndex = process.argv.indexOf("--target");
	if (targetArgIndex !== -1 && process.argv[targetArgIndex + 1]) {
		return process.argv[targetArgIndex + 1];
	}

	return execFileSync("rustc", ["-Vv"], { encoding: "utf8" })
		.split("\n")
		.find((line) => line.startsWith("host: "))
		?.slice("host: ".length)
		.trim();
}

const target = readTarget();
if (!target) {
	throw new Error("Could not determine Rust target triple");
}

const asset = assetByTarget[target];
if (!asset) {
	throw new Error(`No shfmt sidecar asset configured for target ${target}`);
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const extension = target.includes("windows") ? ".exe" : "";
const outputPath = join(root, "src-tauri", "binaries", `shfmt-${target}${extension}`);

if (existsSync(outputPath)) {
	console.log(`shfmt sidecar already exists: ${outputPath}`);
	process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });

const url = `https://github.com/mvdan/sh/releases/download/${SHFMT_VERSION}/${asset}`;
console.log(`Downloading ${url}`);

const response = await fetch(url);
if (!response.ok || !response.body) {
	throw new Error(`Failed to download shfmt: ${response.status} ${response.statusText}`);
}

await pipeline(response.body, createWriteStream(outputPath));

const actualSha256 = createHash("sha256")
	.update(readFileSync(outputPath))
	.digest("hex");
if (actualSha256 !== sha256ByAsset[asset]) {
	unlinkSync(outputPath);
	throw new Error(`Downloaded shfmt checksum mismatch for ${asset}`);
}

chmodSync(outputPath, 0o755);
console.log(`Prepared shfmt sidecar: ${outputPath}`);
