import sys
import torch
from torch.utils.data import DataLoader
from fl_utils import load_vocab, build_label_map, SymptomsDataset, TextClassifier, set_seed

def train_one_client(hospital_id: int, global_path: str, out_path: str, epochs=1, lr=1e-3, batch_size=32):
    set_seed(42)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    vocab = load_vocab("vocab.json")
    label_to_id, _ = build_label_map("SeparatedDataSets")

    ds = SymptomsDataset(f"SeparatedDataSets/hospital{hospital_id}.csv", vocab, label_to_id)
    loader = DataLoader(ds, batch_size=batch_size, shuffle=True)

    model = TextClassifier(vocab_size=len(vocab), num_classes=len(label_to_id)).to(device)
    model.load_state_dict(torch.load(global_path, map_location=device))

    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = torch.nn.CrossEntropyLoss()

    model.train()
    for _ in range(epochs):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            logits = model(x)
            loss = loss_fn(logits, y)
            loss.backward()
            opt.step()

    torch.save(model.state_dict(), out_path)
    return len(ds)  # sample count for weighted FedAvg

if __name__ == "__main__":
    # Usage: python fl_client.py 2 global.pt hospital2_update.pt
    hid = int(sys.argv[1])
    global_path = sys.argv[2]
    out_path = sys.argv[3]
    n = train_one_client(hid, global_path, out_path)
    print(f"✅ Hospital {hid} trained. Samples={n}. Saved -> {out_path}")
