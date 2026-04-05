# 🏥 Federated Learning with Blockchain for Distributed Hospitals

## 📌 Overview
This project explores a **privacy-preserving federated learning system** for distributed hospitals, supported by  **IPFS**, **XAI** and **blockchain** technologies.  
Hospitals collaboratively train a global model while keeping patient data local.

---
## 🖥️ User Interface (Dashboard)
The following screens represent the web dashboard used to manage the federated learning lifecycle, monitor hospital nodes, and verify blockchain transactions.

| **Overview & Analytics** | **Model Management** |
|:---:|:---:|
| ![Overview](/UI_ScreensOfWebDashBoard/Overview_pageUI.png) | ![Model Management](/UI_ScreensOfWebDashBoard/ModelManagement_pageUI.png) |
| *High-level system health and metrics.* | *Tracking FL rounds and aggregation.* |

| **Hospital Management** | **Diagnosis Support** |
|:---:|:---:|
| ![Hospital Management](/UI_ScreensOfWebDashBoard/HospitalManagement_pageUI.png) | ![Diagnosis](/UI_ScreensOfWebDashBoard/DiagnosisSupport_pageUI.png) |
| *Node monitoring and local logs.* | *Clinical AI-assisted diagnostics.* |

| **Security & Traceability** |
|:---:|
| ![Security](/UI_ScreensOfWebDashBoard/Security&Tracibility_pageUI.png) |
| *Blockchain verification and IPFS CID history.* |

---
## ✅ Completed Components

### 🧠 Federated Learning
- Local model training at multiple simulated hospitals
- Global model aggregation completed
- Multiple federated learning rounds executed
- Global model tested using `global_predict.py`
- Explainable AI (XAI) is added to make sure the training process is accurate (training the model is black box, in order to understand how the training is done XAI added via `global_explain_lime.py`)

### 🐳📦 IPFS (Docker + Kubo)
- Docker-based setup for hospitals and services
- Isolated environments for reproducibility
- IPFS nodes running inside Docker containers
- Model files can be added and retrieved manually
- **IPFS integration is fully automated now**
- **Kubo-related behavior are understood.**
- CID management and synchronization between nodes is done.

### ⛓️ Blockchain (Hardhat)
- Local Ethereum network running with Hardhat
- Smart contracts successfully deployed
- Model update logic prepared on-chain
- Contract is written and deployed to make sure autherized hospitals only participate

---

## 🚧 Currently Working On
- **IPFS & Blockchain**
- Blockchain–IPFS linkage is currently under development
- Contract logic is being refined to support CID updates per FL round

---

## 🏗️ Architecture Summary
- Hospitals train local models on private data
- Only model updates are shared
- Large model files intended to be stored on IPFS
- Blockchain intended to record and verify model updates
- Raw patient data never leaves hospitals

---

## 🧰 Technologies Used
- Python, PyTorch
- Federated Learning
- Explainable AI (XAI)
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
