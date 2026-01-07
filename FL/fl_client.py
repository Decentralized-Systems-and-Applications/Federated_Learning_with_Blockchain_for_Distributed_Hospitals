import sys
import torch
from torch.utils.data import DataLoader
from fl_utils import (
    load_vocab,
    build_label_map,
    SymptomsDataset,
    TextClassifier,
    DATA_DIR
)

def train_client(hospital_id, global_model_path, out_path, local_epochs=3):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    vocab = load_vocab()
    label_to_id, _ = build_label_map()

    # Use the centralized DATA_DIR from fl_utils
    csv_path = DATA_DIR / f"hospital{hospital_id}.csv"

    dataset = SymptomsDataset(
        csv_path,
        vocab,
        label_to_id
    )

    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    model = TextClassifier(len(vocab), len(label_to_id)).to(device)
    model.load_state_dict(torch.load(global_model_path, map_location=device))

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = torch.nn.CrossEntropyLoss()

    model.train()
    # --- START LOCAL TRAINING ROUNDS ---
    for epoch in range(local_epochs):
        epoch_loss = 0.0
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            
            outputs = model(x)
            loss = loss_fn(outputs, y)
            
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        # This print statement makes the local training visible in the terminal
        avg_loss = epoch_loss / len(loader)
        print(f"   [Hospital {hospital_id}] Local Epoch {epoch+1}/{local_epochs} - Loss: {avg_loss:.4f}")
    # --- END LOCAL TRAINING ROUNDS ---

    torch.save(model.state_dict(), out_path)
    return len(dataset)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python fl_client.py <hospital_id> <global_model_path> <out_path>")
        sys.exit(1)
        
    hid = int(sys.argv[1])
    train_client(hid, sys.argv[2], sys.argv[3])