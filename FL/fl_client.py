import sys
import torch
from torch.utils.data import DataLoader
from fl_utils import (
    load_vocab,
    build_label_map,
    SymptomsDataset,
    TextClassifier,
)

def train_client(hospital_id, global_model_path, out_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    vocab = load_vocab()
    label_to_id, _ = build_label_map()

    dataset = SymptomsDataset(
        f"../SeperatedDataSets/hospital{hospital_id}.csv",
        vocab,
        label_to_id
    )

    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    model = TextClassifier(len(vocab), len(label_to_id)).to(device)
    model.load_state_dict(torch.load(global_model_path, map_location=device))

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = torch.nn.CrossEntropyLoss()

    model.train()
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        loss_fn(model(x), y).backward()
        optimizer.step()

    torch.save(model.state_dict(), out_path)
    return len(dataset)

if __name__ == "__main__":
    hid = int(sys.argv[1])
    train_client(hid, sys.argv[2], sys.argv[3])
