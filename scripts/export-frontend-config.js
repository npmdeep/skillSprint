const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const artifactPath = path.join(
  rootDir,
  "artifacts",
  "contracts",
  "SkillSprintLedger.sol",
  "SkillSprintLedger.json"
);
const outputPath = path.join(rootDir, "frontend", "src", "lib", "contract-config.js");

function getPreferredDeployment() {
  const deploymentsDir = path.join(rootDir, "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    return null;
  }

  const preferredNetworks = ["localhost", "sepolia", "hardhat"];
  for (const networkName of preferredNetworks) {
    const candidate = path.join(deploymentsDir, `${networkName}.json`);
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }

  return null;
}

if (!fs.existsSync(artifactPath)) {
  throw new Error("Contract artifact not found. Run `npm run compile` first.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const deployment = getPreferredDeployment();
const generatedAt = new Date().toISOString();

const fileContents = `export const skillSprintConfig = ${JSON.stringify(
  {
    contractName: "SkillSprintLedger",
    fallbackAddress: deployment?.address || "",
    fallbackChainId: deployment?.chainId || 31337,
    generatedAt,
    abi: artifact.abi
  },
  null,
  2
)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents);

console.log(`Frontend contract config written to ${outputPath}`);
