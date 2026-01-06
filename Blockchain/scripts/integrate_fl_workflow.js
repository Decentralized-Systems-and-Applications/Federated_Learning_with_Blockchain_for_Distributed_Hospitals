const hre = require("hardhat");
const { create } = require("ipfs-http-client");
const fs = require("fs");
const path = require("path");

/**
 * Complete integration script for Federated Learning workflow
 * 
 * This script:
 * 1. Reads model files from FL directory
 * 2. Uploads each hospital's model to IPFS
 * 3. Submits CIDs to blockchain
 * 4. Advances rounds when all hospitals have submitted
 * 
 * Usage:
 *   npx hardhat run scripts/integrate_fl_workflow.js --network localhost
 * 
 * Requires:
 * - CONTRACT_ADDRESS environment variable or deployment_info.json
 * - IPFS node running
 * - Hospitals registered on contract
 * - Model files in ../FL/ directory (h1_roundX.pt, h2_roundX.pt, h3_roundX.pt)
 */

async function main() {
  console.log("🚀 Starting Federated Learning + IPFS + Blockchain Integration\n");

  // Load contract address
  const deploymentPath = path.join(__dirname, "..", "deployment_info.json");
  let contractAddress;
  
  if (process.env.CONTRACT_ADDRESS) {
    contractAddress = process.env.CONTRACT_ADDRESS;
    console.log("📋 Using contract from environment:", contractAddress);
  } else if (fs.existsSync(deploymentPath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    contractAddress = deploymentInfo.contractAddress;
    console.log("📋 Using contract from deployment_info.json:", contractAddress);
  } else {
    console.error("❌ Contract address not found!");
    console.error("   Either set CONTRACT_ADDRESS environment variable or run deploy.js first");
    process.exit(1);
  }

  // Connect to IPFS
  console.log("\n🔗 Connecting to IPFS...");
  const ipfsApiUrl = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
  let ipfs;
  try {
    ipfs = create({ url: ipfsApiUrl });
    const version = await ipfs.version();
    console.log("✅ Connected to IPFS version:", version.version);
  } catch (error) {
    console.error("❌ Failed to connect to IPFS:", error.message);
    console.error("💡 Make sure IPFS is running (ipfs daemon or docker-compose)");
    process.exit(1);
  }

  // Connect to contract
  console.log("\n⛓️  Connecting to blockchain...");
  const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");
  const contract = ModelUpdateTracker.attach(contractAddress);
  const [owner, ...hospitalSigners] = await hre.ethers.getSigners();

  // Get current round
  let currentRound = Number(await contract.currentRound());
  console.log("📊 Current round:", currentRound);
  
  // Get registered hospitals
  const registeredHospitals = await contract.getRegisteredHospitals();
  console.log("🏥 Registered hospitals:", registeredHospitals.length);
  if (registeredHospitals.length === 0) {
    console.error("❌ No hospitals registered! Run scripts/interact.js first to register hospitals.");
    process.exit(1);
  }

  // Map hospital signers to addresses
  const hospitalMap = new Map();
  for (let i = 0; i < Math.min(hospitalSigners.length, registeredHospitals.length); i++) {
    hospitalMap.set(i + 1, hospitalSigners[i]);
  }

  // Find model files for current round + 1
  const targetRound = currentRound + 1;
  const flDir = path.join(__dirname, "..", "..", "FL");
  
  console.log(`\n🔍 Looking for model files for round ${targetRound}...`);
  const modelFiles = [];
  for (let i = 1; i <= 3; i++) {
    const modelFile = path.join(flDir, `h${i}_round${targetRound}.pt`);
    if (fs.existsSync(modelFile)) {
      modelFiles.push({ hospital: i, path: modelFile });
      console.log(`  ✅ Found: h${i}_round${targetRound}.pt`);
    } else {
      console.log(`  ⚠️  Missing: h${i}_round${targetRound}.pt`);
    }
  }

  if (modelFiles.length === 0) {
    console.log("\n💡 No model files found for round", targetRound);
    console.log("   Train models first using FL/fl_server.py");
    process.exit(0);
  }

  // Process each model file
  const uploadResults = [];
  for (const { hospital, path: modelPath } of modelFiles) {
    const hospitalSigner = hospitalMap.get(hospital);
    if (!hospitalSigner) {
      console.log(`⚠️  No signer found for hospital ${hospital}, skipping...`);
      continue;
    }

    console.log(`\n📤 Processing Hospital ${hospital}...`);
    console.log(`   File: ${path.basename(modelPath)}`);

    // Check if already submitted
    const hasSubmitted = await contract.hasSubmittedForRound(targetRound, hospitalSigner.address);
    if (hasSubmitted) {
      console.log(`   ⚠️  Already submitted for round ${targetRound}, skipping...`);
      continue;
    }

    // Upload to IPFS
    try {
      const fileContent = fs.readFileSync(modelPath);
      const result = await ipfs.add(fileContent, { pin: true, cidVersion: 0 });
      const cid = result.cid.toString();
      console.log(`   ✅ Uploaded to IPFS: ${cid}`);

      // Submit to blockchain
      const tx = await contract.connect(hospitalSigner).submitModelUpdate(cid, targetRound);
      console.log(`   📝 Transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Submitted to blockchain`);

      uploadResults.push({
        hospital,
        cid,
        txHash: tx.hash,
        modelFile: path.basename(modelPath)
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Round: ${targetRound}`);
  console.log(`   Models uploaded: ${uploadResults.length}/${modelFiles.length}`);
  
  if (uploadResults.length > 0) {
    console.log("\n📋 Upload Results:");
    uploadResults.forEach(result => {
      console.log(`   Hospital ${result.hospital}: ${result.cid}`);
      console.log(`     IPFS: https://ipfs.io/ipfs/${result.cid}`);
      console.log(`     TX: ${result.txHash}`);
    });

    // Check if all registered hospitals have submitted
    const updates = await contract.getRoundUpdates(targetRound);
    const registeredCount = registeredHospitals.length;
    
    console.log(`\n📈 Round ${targetRound} Status:`);
    console.log(`   Submissions: ${updates.length}/${registeredCount}`);
    
    if (updates.length === registeredCount) {
      console.log("\n🎉 All hospitals have submitted!");
      console.log("   Ready to advance to next round.");
      console.log("   Run: npx hardhat run scripts/advance_round.js");
    }
  }

  // Save log
  const logPath = path.join(flDir, "ipfs_blockchain_integration_log.json");
  let log = [];
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, "utf8"));
  }
  log.push({
    round: targetRound,
    timestamp: new Date().toISOString(),
    results: uploadResults
  });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`\n💾 Log saved to: ${logPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });


