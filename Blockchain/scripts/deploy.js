const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const REQUIRED_SUBMISSIONS = 3;

  console.log("🚀 Deploying ModelUpdateTracker...");

  const ModelUpdateTracker =
    await hre.ethers.getContractFactory("ModelUpdateTracker");

  const contract =
    await ModelUpdateTracker.deploy(REQUIRED_SUBMISSIONS);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const owner = await contract.owner();
  const round = await contract.currentRound();

  console.log("✅ Contract deployed");
  console.log("📍 Address:", address);
  console.log("👤 Owner / Aggregator:", owner);
  console.log("🔢 Current round:", round.toString());

  const info = {
    address,
    owner,
    requiredSubmissions: REQUIRED_SUBMISSIONS,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const outPath = path.join(__dirname, "..", "deployment_info.json");
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2));

  console.log("💾 deployment_info.json written");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deploy failed:", err);
    process.exit(1);
  });
