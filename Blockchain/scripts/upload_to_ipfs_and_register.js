const hre = require("hardhat");
const { create } = require("ipfs-http-client");
const fs = require("fs");
const path = require("path");

/**
 * Script to upload model file to IPFS and register CID on blockchain
 * 
 * Usage:
 *   node scripts/upload_to_ipfs_and_register.js <contract_address> <model_file_path> <round> <hospital_address>
 * 
 * Example:
 *   node scripts/upload_to_ipfs_and_register.js 0x123... ../FL/h1_round1.pt 1 0xabc...
 */

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error("❌ Usage: node upload_to_ipfs_and_register.js <contract_address> <model_file_path> <round> <hospital_address>");
    console.error("   Example: node upload_to_ipfs_and_register.js 0x123... ../FL/h1_round1.pt 1 0xabc...");
    process.exit(1);
  }

  const [contractAddress, modelFilePath, round, hospitalAddress] = args;

  // Validate inputs
  if (!contractAddress || !contractAddress.startsWith("0x")) {
    console.error("❌ Invalid contract address");
    process.exit(1);
  }

  if (!fs.existsSync(modelFilePath)) {
    console.error(`❌ Model file not found: ${modelFilePath}`);
    process.exit(1);
  }

  const roundNumber = parseInt(round);
  if (isNaN(roundNumber) || roundNumber < 1) {
    console.error("❌ Invalid round number (must be >= 1)");
    process.exit(1);
  }

  console.log("📋 Configuration:");
  console.log("  Contract Address:", contractAddress);
  console.log("  Model File:", modelFilePath);
  console.log("  Round:", roundNumber);
  console.log("  Hospital Address:", hospitalAddress);
  console.log("");

  // Step 1: Connect to IPFS
  console.log("🔗 Connecting to IPFS...");
  let ipfs;
  try {
    // Try connecting to local IPFS node (default: http://127.0.0.1:5001)
    // For Docker IPFS, might be http://localhost:5001 or http://ipfs:5001
    const ipfsApiUrl = process.env.IPFS_API_URL || "http://127.0.0.1:5001";
    ipfs = create({ url: ipfsApiUrl });
    
    // Test connection
    const version = await ipfs.version();
    console.log("✅ Connected to IPFS version:", version.version);
  } catch (error) {
    console.error("❌ Failed to connect to IPFS:", error.message);
    console.error("💡 Make sure IPFS is running. Try:");
    console.error("   - Local: ipfs daemon");
    console.error("   - Docker: docker-compose up (in ipfs-hospitals/)");
    console.error("   - Or set IPFS_API_URL environment variable");
    process.exit(1);
  }

  // Step 2: Upload model file to IPFS
  console.log(`\n📤 Uploading ${path.basename(modelFilePath)} to IPFS...`);
  let cid;
  try {
    const fileContent = fs.readFileSync(modelFilePath);
    const result = await ipfs.add(fileContent, {
      pin: true, // Pin the file to keep it available
      cidVersion: 0, // Use CIDv0 format (starts with Qm...)
    });
    cid = result.cid.toString();
    console.log("✅ File uploaded successfully!");
    console.log("   CID:", cid);
    console.log("   Size:", result.size, "bytes");
  } catch (error) {
    console.error("❌ Failed to upload to IPFS:", error.message);
    process.exit(1);
  }

  // Step 3: Connect to blockchain and submit CID
  console.log("\n⛓️  Connecting to blockchain...");
  try {
    const ModelUpdateTracker = await hre.ethers.getContractFactory("ModelUpdateTracker");
    const contract = ModelUpdateTracker.attach(contractAddress);

    // Get the hospital signer
    const signers = await hre.ethers.getSigners();
    let hospitalSigner = signers.find(s => s.address.toLowerCase() === hospitalAddress.toLowerCase());
    
    if (!hospitalSigner) {
      // If hospital address not in signers, try to use the address directly
      console.log("⚠️  Hospital address not found in available signers");
      console.log("   Available signers:", signers.map(s => s.address));
      console.log("   Using first signer as hospital...");
      hospitalSigner = signers[0];
    }

    // Check if hospital is registered
    const isRegistered = await contract.hospitalContributions(hospitalSigner.address);
    if (!isRegistered.isRegistered) {
      console.error("❌ Hospital not registered!");
      console.error("   Register the hospital first using the interact.js script");
      process.exit(1);
    }

    // Check if already submitted for this round
    const hasSubmitted = await contract.hasSubmittedForRound(roundNumber, hospitalSigner.address);
    if (hasSubmitted) {
      console.error("❌ Hospital already submitted for round", roundNumber);
      process.exit(1);
    }

    // Submit the CID to blockchain
    console.log(`\n📝 Submitting CID to blockchain (Round ${roundNumber})...`);
    const tx = await contract.connect(hospitalSigner).submitModelUpdate(cid, roundNumber);
    console.log("   Transaction hash:", tx.hash);
    console.log("   Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Verify the submission
    const updates = await contract.getRoundUpdates(roundNumber);
    const lastUpdate = updates[updates.length - 1];
    console.log("\n📊 Verification:");
    console.log("   Hospital:", lastUpdate.hospitalAddress);
    console.log("   Round:", lastUpdate.round.toString());
    console.log("   IPFS CID:", lastUpdate.ipfsHash);
    console.log("   Timestamp:", new Date(Number(lastUpdate.timestamp) * 1000).toLocaleString());
    console.log("   Valid:", lastUpdate.isValid);

    // Save to log file
    const logPath = path.join(__dirname, "..", "..", "FL", "ipfs_blockchain_log.json");
    let log = [];
    if (fs.existsSync(logPath)) {
      log = JSON.parse(fs.readFileSync(logPath, "utf8"));
    }
    log.push({
      round: roundNumber,
      hospital: hospitalSigner.address,
      modelFile: path.basename(modelFilePath),
      cid: cid,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log("\n💾 Log saved to:", logPath);

  } catch (error) {
    console.error("❌ Blockchain transaction failed:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }

  console.log("\n🎉 Success! Model uploaded to IPFS and registered on blockchain.");
  console.log(`   CID: ${cid}`);
  console.log(`   View on IPFS: https://ipfs.io/ipfs/${cid}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });


