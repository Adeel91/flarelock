import { execSync } from "node:child_process";
import fs from "node:fs";

const version = process.argv[2];
const releaseType = process.argv[3];

if (!version) {
  throw new Error("Missing release version");
}

const packagePath = "package.json";
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

pkg.version = version;

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

if (releaseType === "patch") {
  try {
    execSync("git checkout -- CHANGELOG.md", { stdio: "ignore" });
  } catch {}
}
