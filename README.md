# 🏥 Decentralized Federated Learning with Blockchain for Distributed Hospitals

## 📌 Overview 
This project explores a **privacy-preserving decentralized federated learning system** where hospitals collaboratively train local models while keeping patient data on-site, with a smart contract (Orchestrator) coordinating and validating the aggregation process.

---
## 🖥️ User Interface (Dashboard)
The following screens represent the web dashboard used to manage the federated learning lifecycle, monitor hospital nodes, and verify blockchain transactions.

| **Overview & Analytics** | **Model Management** |
|:---:|:---:|
| ![Overview](/UI_ScreensOfWebDashBoard/Overview%20Dashboard%20Page.png) | ![Model Management](/UI_ScreensOfWebDashBoard/Model%20Management%20Console.png) |
| *High-level system health and metrics.* | *Tracking FL rounds and aggregation.* |

| **Hospital Management** | **Diagnosis Support** |
|:---:|:---:|
| ![Hospital Management](/UI_ScreensOfWebDashBoard/Doctor%20Console%20Page.png) | ![Diagnosis](/UI_ScreensOfWebDashBoard/Diagnosis%20Support%20Tool%20Page.png) |
| *Node monitoring and local logs.* | *Clinical AI-assisted diagnostics.* |

| **Security & Traceability** |
|:---:|
| ![Security](/UI_ScreensOfWebDashBoard/Security%20&%20Traceability%20Page.png) |
| *Blockchain verification and IPFS CID history.* |

--- 

## 🧠 How the System Works?
![](/UI_ScreensOfWebDashBoard/HowSystemWorks.jpeg)

--- 

## 🎥 Project Demo (Prototype)
> ### ⏳ Coming Very Soon!
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
- **Decentralization**
- Full decentralization (removing central server/global model)
- Monitoring network traffic and model size
- Encrypting model updates before sharing

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
- Federated Learning (FedAvg)
- Explainable AI (XAI)
- IPFS 
- Private Blcokchain Network legder
- Git

---

## 👩‍💻 Team
- Seham Hakim Othman  
- Hatice Kübra Selvi  
