const hre = require("hardhat");

/**
 * This script configures my "authorized list." In my contract, the onlyHospital modifier prevents random people from submitting models.

What it does: It takes the first three accounts provided by Hardhat (h1, h2, h3) and marks them as true in the isHospital mapping.

Terminal Output: When you see isHospital h1: true, it means the blockchain has successfully saved that Account #0 is now an authorized hospital.
 */

async function main() {
  const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your deployed contract address
  const registry = await hre.ethers.getContractAt("ModelRegistry2", CONTRACT);

  const [h1, h2, h3] = await hre.ethers.getSigners();

  await (await registry.addHospital(h2.address)).wait();
  await (await registry.addHospital(h3.address)).wait();

  console.log("isHospital h1:", await registry.isHospital(h1.address));
  console.log("isHospital h2:", await registry.isHospital(h2.address));
  console.log("isHospital h3:", await registry.isHospital(h3.address));
}

main().catch((e) => { console.error(e); process.exitCode = 1; });