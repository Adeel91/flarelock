import { execSync } from "node:child_process";
import fs from "node:fs";

const releaseType = process.argv[2];

if (!["minor", "major"].includes(releaseType)) {
  throw new Error("Release type must be minor or major");
}

const packagePath = "package.json";
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const currentVersion = pkg.version || "0.1.0";
const [major, minor] = currentVersion.split(".").map(Number);

const nextVersion = releaseType === "major" ? `${major + 1}.0.0` : `${major}.${minor + 1}.0`;

pkg.version = nextVersion;
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

let previousTag = "";
try {
  previousTag = execSync("git describe --tags --abbrev=0", {
    encoding: "utf8",
  }).trim();
} catch {
  previousTag = "";
}

const logRange = previousTag ? `${previousTag}..HEAD` : "HEAD";
const commits = execSync(`git log ${logRange} --pretty=format:"- %s (%h)"`, {
  encoding: "utf8",
}).trim();

const date = new Date().toISOString().slice(0, 10);
const changelogEntry = `## v${nextVersion} - ${date}\n\n${commits || "- Initial release"}\n\n`;

const existingChangelog = fs.existsSync("CHANGELOG.md")
  ? fs.readFileSync("CHANGELOG.md", "utf8")
  : "";

fs.writeFileSync("CHANGELOG.md", `${changelogEntry}${existingChangelog}`);

fs.writeFileSync("release-notes.md", `# v${nextVersion}\n\n${commits || "- Initial release"}\n`);

execSync("git add package.json CHANGELOG.md", { stdio: "inherit" });
execSync(`git commit -m "chore(release): ${nextVersion} [skip ci]"`, {
  stdio: "inherit",
});
execSync(`git tag v${nextVersion}`, { stdio: "inherit" });
execSync("git push origin HEAD:main --follow-tags", { stdio: "inherit" });
execSync(
  `gh release create v${nextVersion} --title "v${nextVersion}" --notes-file release-notes.md`,
  {
    stdio: "inherit",
  },
);
