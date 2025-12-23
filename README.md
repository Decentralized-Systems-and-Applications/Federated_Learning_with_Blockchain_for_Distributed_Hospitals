
In the current stage, each single-hospital (1,2 and 3) local model training implemented and validated , where a machine learning model learns to predict a disease code from patient symptoms without sharing raw data.

The model predicts only the disease code, while all additional medical information (disease name, treatments, contagious and chronic status) is retrieved from a separate lookup table.
To prepare for federated learning, the dataset was split into three simulated hospital datasets.

This setup establishes a working foundation for the next phase: distributed federated training and blockchain-based model update tracking.
NEXT STEP IS : improving global model: by using PyTorch + FedAvg (global model = average of local weights each round). 