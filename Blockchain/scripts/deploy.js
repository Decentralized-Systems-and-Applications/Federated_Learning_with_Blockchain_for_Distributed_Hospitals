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
  console.log("🔢 Current round:", await modelTracker.currentRound());

  // Save deployment info (optional - for future reference)
  console.log("\n📋 Deployment Summary:");
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", contractAddress);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
