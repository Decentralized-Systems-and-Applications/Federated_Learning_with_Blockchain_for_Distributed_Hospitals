This project builds a privacy-preserving medical diagnosis system using Federated Learning and Blockchain.
In the current stage, single-hospital local model training implemented and validated , where a machine learning model learns to predict a disease code from patient symptoms without sharing raw data.

The model predicts only the disease code, while all additional medical information (disease name, treatments, contagious and chronic status) is retrieved from a separate lookup table.
To prepare for federated learning, the dataset was split into three simulated hospital datasets.

This setup establishes a working foundation for the next phase: distributed federated training and blockchain-based model update tracking.
