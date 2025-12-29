const hre = require("hardhat");

async function main() {
  const MR2 = await hre.ethers.getContractFactory("ModelRegistry2");

  // ModelRegistry2 constructor requires uint256 _requiredSubmissions
  const mr2 = await MR2.deploy(3);

  await mr2.waitForDeployment();
  console.log("ModelRegistry2 deployed to:", await mr2.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
