const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log(`Deploying SkillSprintLedger with ${deployer.address} on chain ${network.chainId}...`);

  const factory = await hre.ethers.getContractFactory("SkillSprintLedger");
  const ledger = await factory.deploy();
  await ledger.waitForDeployment();

  const address = await ledger.getAddress();
  const deploymentRecord = {
    contractName: "SkillSprintLedger",
    address,
    chainId: Number(network.chainId),
    networkName: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentRecord, null, 2)
  );

  console.log(`SkillSprintLedger deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
