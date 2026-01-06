const hre = require("hardhat");

async function main() {
  console.log("Deploying ModelUpdateTracker contract...");

  // Get the contract factory
  const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");

  // Deploy the contract
  const modelTracker = await ModelUpdateTracker.deploy();

  // Wait for deployment to be mined
  await modelTracker.waitForDeployment();

  const contractAddress = await modelTracker.getAddress();
  console.log("✅ ModelUpdateTracker deployed to:", contractAddress);
  console.log("📝 Contract owner:", await modelTracker.owner());
  console.log("🔢 Current round:", (await modelTracker.currentRound()).toString());

  // Save deployment info to file
  const deploymentInfo = {
    contractAddress: contractAddress,
    owner: await modelTracker.owner(),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    currentRound: (await modelTracker.currentRound()).toString()
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "..", "deployment_info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  console.log("\n📋 Deployment Summary:");
  console.log("  Network:", hre.network.name);
  console.log("  Contract Address:", contractAddress);
  console.log("\n🚀 Next steps:");
  console.log("  1. Register hospitals: npx hardhat run scripts/interact.js");
  console.log("  2. Start IPFS node or docker-compose (in ipfs-hospitals/)");
  console.log("  3. Upload models: node scripts/upload_to_ipfs_and_register.js <contract> <file> <round> <hospital>");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
