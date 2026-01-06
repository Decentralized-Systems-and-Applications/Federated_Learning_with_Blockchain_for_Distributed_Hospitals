const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Advance to the next federated learning round
 * Only contract owner can do this
 * 
 * Usage:
 *   npx hardhat run scripts/advance_round.js --network localhost
 */

async function main() {
  // Load contract address
  const deploymentPath = path.join(__dirname, "..", "deployment_info.json");
  let contractAddress;
  
  if (process.env.CONTRACT_ADDRESS) {
    contractAddress = process.env.CONTRACT_ADDRESS;
  } else if (fs.existsSync(deploymentPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    contractAddress = deploymentInfo.contractAddress;
  } else {
    console.error("❌ Contract address not found!");
    process.exit(1);
  }

  console.log("⛓️  Connecting to contract:", contractAddress);

  const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");
  const contract = ModelUpdateTracker.attach(contractAddress);
  const [owner] = await hre.ethers.getSigners();

  // Verify owner
  const contractOwner = await contract.owner();
  if (owner.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.error("❌ Only contract owner can advance rounds!");
    console.error(`   Contract owner: ${contractOwner}`);
    console.error(`   Your address: ${owner.address}`);
    process.exit(1);
  }

  const currentRound = Number(await contract.currentRound());
  console.log(`\n📊 Current round: ${currentRound}`);

  // Check updates in current round
  const updates = await contract.getRoundUpdates(currentRound);
  console.log(`   Updates in current round: ${updates.length}`);

  if (updates.length === 0) {
    console.error("❌ No updates in current round! Cannot advance.");
    process.exit(1);
  }

  // Advance round
  console.log(`\n🚀 Advancing to round ${currentRound + 1}...`);
  try {
    const tx = await contract.connect(owner).advanceRound();
    console.log("   Transaction:", tx.hash);
    await tx.wait();
    
    const newRound = Number(await contract.currentRound());
    console.log(`✅ Advanced to round ${newRound}`);
    
    // Get updates for the completed round
    const completedUpdates = await contract.getRoundUpdates(currentRound);
    console.log(`\n📊 Round ${currentRound} Summary:`);
    console.log(`   Total updates: ${completedUpdates.length}`);
    completedUpdates.forEach((update, index) => {
      console.log(`   ${index + 1}. ${update.hospitalAddress.substring(0, 10)}... - ${update.ipfsHash}`);
    });
  } catch (error) {
    console.error("❌ Failed to advance round:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });


