# 🏥 Federated Learning with Blockchain for Distributed Hospitals

## 📌 Overview
This project implements a **privacy-preserving federated learning system** for distributed hospitals, enhanced with **IPFS** and **blockchain** technologies.  
Hospitals collaboratively train a global AI model **without sharing patient data**.

---

## ✅ Current Implementation Status

### 🧠 Federated Learning
- Local training performed independently at each hospital
- Global model aggregation completed successfully
- Multiple federated learning rounds executed
- Global model tested using `global_predict.py`

### 📦 IPFS (Docker + Kubo)
- IPFS nodes running inside Docker containers
- Local and global model files stored on IPFS
- Model files identified and shared using **CIDs**
- Each hospital maintains its own IPFS node

### ⛓️ Blockchain (Hardhat)
- Local Ethereum network using **Hardhat**
- Smart contracts deployed
- IPFS CIDs and model update hashes recorded on-chain
- Immutable tracking of federated learning rounds

---

## 🏗️ Architecture Summary
- Hospitals train local models on private data
- Only model updates are shared
- Large model files stored on IPFS
- Blockchain records and verifies model updates
- No raw patient data leaves hospitals

---

## 🧰 Technologies Used
- Python, PyTorch
- Federated Learning
- IPFS (Kubo, Docker)
- Ethereum, Solidity, Hardhat
- Docker & Git

---

## 👩‍💻 Team
- Seham Hakim Othman  
- Hatice Kübra Selvi  

---

## 🎓 Course
**CENG 3550 – Decentralized Systems and Applications**
