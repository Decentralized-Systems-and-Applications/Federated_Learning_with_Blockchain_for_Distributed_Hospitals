# Federated Learning with Blockchain for Distributed Hospitals

## Overview
This project develops a **blockchain-based federated learning framework** that enables hospitals to collaboratively train AI models **without sharing patient data**. The system ensures **privacy, transparency, trust, and auditability** in medical AI collaboration.

---

## Motivation
Healthcare data cannot be shared due to strict privacy regulations, leading to isolated data silos.  
Federated learning solves this by training models locally, while blockchain ensures secure and verifiable coordination between hospitals.

---

## Current Project Status
At the current stage, a **single-hospital local training pipeline** has been implemented and validated.

### Implemented Features
- Local machine learning model trained on hospital data
- Disease prediction based on patient symptoms only
- The model predicts **only a disease code**
- Additional medical information (disease name, treatment, contagious and chronic status) is retrieved from a **separate lookup table**
- Dataset split into **three simulated hospital datasets** to prepare for federated learning

This setup establishes a solid foundation for distributed training.

---

## Next Phase
- Distributed federated training across hospitals
- Model aggregation and update sharing
- Blockchain-based tracking and verification of model updates
- Integration of smart contracts and IPFS

---

## Team
- **Hatice Kübra Selvi** – Federated Learning & System Architecture  
- **Seham Hakim Othman** – Blockchain, Smart Contracts, IPFS, Frontend

---

## Course
CENG 3550 – Decentralized Systems and Applications
