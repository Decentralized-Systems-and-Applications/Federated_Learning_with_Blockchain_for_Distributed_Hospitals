# 🏥 Federated Learning with Blockchain for Distributed Hospitals

## 🔍 Overview
This project implements a **federated learning framework enhanced with blockchain concepts** to enable hospitals to collaboratively train AI models **without sharing patient data**.  
The system ensures **privacy 🔒, transparency 📊, trust 🤝, and auditability 🧾** in medical AI collaboration.

---

## 💡 Motivation
Healthcare institutions cannot share patient data due to strict privacy regulations, leading to isolated data silos.  
**Federated Learning** enables decentralized training across hospitals, while **Blockchain** provides a trusted and auditable coordination layer.

> *Bring the AI to the data — not the data to the AI.*

---

## 🧪 Current Project Status (Updated)
The project has progressed beyond local training and now includes a **working federated learning pipeline** with multiple simulated hospitals.

### ✅ Implemented Features
- 🏥 **Multiple simulated hospitals**, each training a local model on private data  
- 🔄 **Federated learning server–client architecture** for model aggregation  
- 🌐 **Global model generation** after multiple federated rounds  
- 🧠 Disease prediction based on **patient symptoms only**  
- 🔢 Model outputs **only a disease code**  
- 📚 Medical details (disease name, treatments, contagious & chronic status) retrieved from a **separate lookup table**  
- 🧪 Global model successfully tested using `global_predict.py`

This confirms that **collaborative learning works without sharing raw patient data**.

---

## 🏗️ Architecture Summary
- Local hospital training (data stays local)
- Federated aggregation into a global model
- Metadata lookup separated from prediction logic
- Blockchain integration planned for secure model update tracking

---

## 🚀 Next Phase
- 🔗 Blockchain integration for model update verification  
- 📦 Smart contracts for contribution tracking  
- 🗂️ IPFS for decentralized storage  
- 📊 Evaluation of scalability, security, and performance  

---

## 👩‍💻 Team
- **Hatice Kübra Selvi** — Federated Learning & System Architecture  
- **Seham Hakim Othman** — Blockchain, Smart Contracts, IPFS & Frontend  

---

## 🎓 Course
**CENG 3550 – Decentralized Systems and Applications**
