const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Load deployed contract address
  const infoPath = path.join(__dirname, "..", "deployment_info.json");
  if (!fs.existsSync(infoPath)) {
    throw new Error("deployment_info.json not found. Deploy first.");
  }

  const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  const CONTRACT_ADDRESS = info.address;

  console.log("📋 Using contract:", CONTRACT_ADDRESS);

  // Attach contract
  const ModelUpdateTracker =
    await hre.ethers.getContractFactory("ModelUpdateTracker");
  const contract = ModelUpdateTracker.attach(CONTRACT_ADDRESS);

  // Get signers
  const [owner, hospital1, hospital2, hospital3] =
    await hre.ethers.getSigners();

  console.log("\n👤 Owner:", owner.address);
  console.log("🧠 Aggregator:", await contract.aggregator());

  // Register hospitals if needed
  console.log("\n🏥 Registering hospitals...");

  async function registerIfNeeded(h) {
    const c = await contract.hospitalContributions(h.address);
    if (!c.isRegistered) {
      await (await contract.connect(owner).registerHospital(h.address)).wait();
      console.log("✅ Registered:", h.address);
    } else {
      console.log("ℹ️ Already registered:", h.address);
    }
  }

  await registerIfNeeded(hospital1);
  await registerIfNeeded(hospital2);
  await registerIfNeeded(hospital3);

  // Current FL round
  const round = await contract.currentRound();
  console.log("\n🔄 Current round:", round.toString());

  // Submit local models
  console.log("\n📤 Submitting local models...");

  async function submitLocal(h, label) {
    const submitted = await contract.hasSubmitted(round, h.address);
    if (submitted) {
      console.log(`ℹ️ ${label} already submitted`);
      return;
    }

    // Dummy CID & hash (replace with real IPFS output)
    const cid = `cid-${label}-r${round}`;
    const hash = "0x" + "1".repeat(64);

    await (
      await contract
        .connect(h)
        .submitLocalModel(cid, hash)
    ).wait();

    console.log(`✅ ${label} submitted`);
  }

  await submitLocal(hospital1, "Hospital1");
  await submitLocal(hospital2, "Hospital2");
  await submitLocal(hospital3, "Hospital3");

  // Check if enough hospitals submitted
  const required = await contract.requiredSubmissions();
  const hospitals = await contract.getRoundHospitals(round);

  console.log(
    `\n📊 Round ${round} submissions: ${hospitals.length}/${required}`
  );

  // Publish global model if condition satisfied
  if (hospitals.length >= required) {
    console.log("\n🌍 Publishing global model...");

    const globalCid = `global-cid-round-${round}`;
    const globalHash = "0x" + "2".repeat(64);

    await (
      await contract
        .connect(owner)
        .publishGlobalModel(globalCid, globalHash)
    ).wait();

    console.log("✅ Global model published");
    console.log(
      "➡️ New round:",
      (await contract.currentRound()).toString()
    );
  } else {
    console.log("⏳ Not enough submissions, global model not published");
  }
}

// Run script
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
