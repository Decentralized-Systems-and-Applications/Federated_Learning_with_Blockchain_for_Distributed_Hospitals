const hre = require("hardhat");

const CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ROUND = 5;

// Hospital index -> CID
const CIDS = {
  0: "QmPXnt6urEf8hmB3z4Epyt4NFpF13YmD1RHuzYid53rs6S", // H1
  1: "QmSTk1KCwtEdT8AkDkn8QDfoHU1CH2os1aGAtqntq9sp3U", // H2
  2: "Qmbcgg9ALbRxszuuSW8gHDzzdYWBGcqr7M45oQ2medD7Uq", // H3
};

async function main() {
  const hospitalIdx = Number(process.env.H || "0");
  if (![0,1,2].includes(hospitalIdx)) throw new Error("Set H=0 or H=1 or H=2");

  const registry = await hre.ethers.getContractAt("ModelRegistry2", CONTRACT);
  const signers = await hre.ethers.getSigners();
  const signer = signers[hospitalIdx];

  const cid = CIDS[hospitalIdx];
  const fileHash = "0x" + "00".repeat(32); // keep dummy for now

  const tx = await registry.connect(signer).submitLocalUpdate(ROUND, cid, fileHash);
  const receipt = await tx.wait();

  console.log(`Submitted H${hospitalIdx+1} round ${ROUND}. Tx:`, receipt.hash);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
