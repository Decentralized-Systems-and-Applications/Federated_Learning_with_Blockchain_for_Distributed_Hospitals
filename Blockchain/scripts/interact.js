const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Example interaction script with the ModelUpdateTracker contract
 * This demonstrates how to register hospitals and submit model updates
 */
async function main() {
  // Load contract address from deployment_info.json or environment variable
  const deploymentPath = path.join(__dirname, "..", "deployment_info.json");
  let CONTRACT_ADDRESS;
  
  if (process.env.CONTRACT_ADDRESS) {
    CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
    console.log("📋 Using contract from environment:", CONTRACT_ADDRESS);
  } else if (fs.existsSync(deploymentPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    CONTRACT_ADDRESS = deploymentInfo.contractAddress;
    console.log("📋 Using contract from deployment_info.json:", CONTRACT_ADDRESS);
  } else {
    console.error("❌ Contract address not found!");
    console.error("   Either set CONTRACT_ADDRESS environment variable or run deploy.js first");
    process.exit(1);
  }

  console.log("Connecting to ModelUpdateTracker contract at:", CONTRACT_ADDRESS);

  // Get the contract instance
  const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");
  const contract = ModelUpdateTracker.attach(CONTRACT_ADDRESS);

  // Get signers
  const [owner, hospital1, hospital2, hospital3] = await hre.ethers.getSigners();

  console.log("\n📋 Contract Info:");
  console.log("Owner:", await contract.owner());
  console.log("Current Round:", (await contract.currentRound()).toString());
  console.log("Registered Hospitals:", await contract.getRegisteredHospitalsCount());

  // Example: Register hospitals (only owner can do this)
  console.log("\n🏥 Registering hospitals...");
  try {
    await contract.connect(owner).registerHospital(hospital1.address);
    console.log("✅ Hospital 1 registered:", hospital1.address);
  } catch (error) {
    console.log("⚠️  Hospital 1 might already be registered");
  }

  try {
    await contract.connect(owner).registerHospital(hospital2.address);
    console.log("✅ Hospital 2 registered:", hospital2.address);
  } catch (error) {
    console.log("⚠️  Hospital 2 might already be registered");
  }

  try {
    await contract.connect(owner).registerHospital(hospital3.address);
    console.log("✅ Hospital 3 registered:", hospital3.address);
  } catch (error) {
    console.log("⚠️  Hospital 3 might already be registered");
  }

  // Example: Submit model updates (hospitals can do this)
  console.log("\n📤 Submitting model updates...");
  const currentRound = await contract.currentRound();
  const exampleIpfsHash = "QmExampleHash123";

  try {
    const tx = await contract.connect(hospital1).submitModelUpdate(exampleIpfsHash, currentRound);
    await tx.wait();
    console.log("✅ Hospital 1 submitted update for round", currentRound.toString());
    console.log("   IPFS Hash:", exampleIpfsHash);
  } catch (error) {
    console.log("⚠️  Error submitting update:", error.message);
  }

  // Get round updates
  console.log("\n📊 Round Updates:");
  const updates = await contract.getRoundUpdates(currentRound);
  console.log(`Round ${currentRound.toString()} has ${updates.length} update(s)`);
  
  updates.forEach((update, index) => {
    console.log(`  Update ${index + 1}:`);
    console.log(`    Hospital: ${update.hospitalAddress}`);
    console.log(`    IPFS Hash: ${update.ipfsHash}`);
    console.log(`    Timestamp: ${new Date(Number(update.timestamp) * 1000).toLocaleString()}`);
  });

  // Get hospital contributions
  console.log("\n📈 Hospital Contributions:");
  const hospitals = [hospital1, hospital2, hospital3];
  for (const hospital of hospitals) {
    const contribution = await contract.getHospitalContribution(hospital.address);
    if (contribution.isRegistered) {
      console.log(`  ${hospital.address}:`);
      console.log(`    Total Contributions: ${contribution.totalContributions.toString()}`);
      console.log(`    Last Round: ${contribution.lastContributionRound.toString()}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
