const hre = require("hardhat");

async function main() {
  const CONTRACT = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // your deployed address
  const round = 5;

  // Example CID and hash (replace with your real IPFS CID + sha256)
  const cid = "QmSTk1KCwtEdT8AkDkn8QDfoHU1CH2os1aGAtqntq9sp3u";
  const fileHash = "0x" + "00".repeat(32); // TODO replace

  const registry = await hre.ethers.getContractAt("ModelRegistry2", CONTRACT);

  // Use one of the Hardhat node accounts as a hospital
  const [hospital1] = await hre.ethers.getSigners();

  // If you want allowlist behavior: owner must call addHospital(hospitalAddr) first
  // (In constructor we already allow deployer as hospital for easy testing.)

  const tx = await registry.connect(hospital1).submitLocalUpdate(round, cid, fileHash);
  const receipt = await tx.wait();

  console.log("Submitted local update. Tx:", receipt.hash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
