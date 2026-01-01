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

  // Also create/update .env.example
  const envExamplePath = path.join(__dirname, "..", ".env.example");
  const envContent = `# Contract Address\nCONTRACT_ADDRESS=${contractAddress}\n\n# IPFS Configuration\nIPFS_API_URL=http://127.0.0.1:5001\n`;
  fs.writeFileSync(envExamplePath, envContent);
  console.log("📝 .env.example created/updated");

  console.log("\n📋 Deployment Summary:");
  console.log("  Network:", hre.network.name);
  console.log("  Contract Address:", contractAddress);
  console.log("\n🚀 Next steps:");
  console.log("  1. Copy .env.example to .env (if needed)");
  console.log("  2. Register hospitals: npx hardhat run scripts/interact.js");
  console.log("  3. Start IPFS node or docker-compose (in ipfs-hospitals/)");
  console.log("  4. Upload models: node scripts/upload_to_ipfs_and_register.js <contract> <file> <round> <hospital>");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
