import re
import json
import torch
from pathlib import Path
from fl_utils import TextClassifier, load_vocab

FL_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = FL_DIR.parent

def tokenize(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if t]

def encode(symptoms: str, vocab: dict, max_len: int = 64):
    tokens = tokenize(symptoms)
    ids = [vocab.get(t, vocab["<UNK>"]) for t in tokens][:max_len]
    ids += [vocab["<PAD>"]] * (max_len - len(ids))
    return torch.tensor([ids], dtype=torch.long)

def main():
    # pick latest global model automatically
    rounds = sorted(FL_DIR.glob("global_round*.pt"))
    if not rounds:
        raise FileNotFoundError("No global_round*.pt found in FL folder.")
    global_ckpt = rounds[-1]

    vocab = load_vocab()
    id_to_label = json.loads((FL_DIR / "label_map.json").read_text(encoding="utf-8"))
    num_classes = len(id_to_label)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = TextClassifier(vocab_size=len(vocab), num_classes=num_classes).to(device)
    model.load_state_dict(torch.load(global_ckpt, map_location=device))
    model.eval()

    # Optional: mapping DB (Name/Treatments/etc.)
    code_to_info = {}
    mapping_path = PROJECT_ROOT / "disease_mapping.csv"
    if mapping_path.exists():
        import pandas as pd
        df = pd.read_csv(mapping_path)
        df["Disease_Code"] = df["Disease_Code"].astype(str).str.strip()
        for _, row in df.iterrows():
            code_to_info[row["Disease_Code"]] = {
                "Name": row.get("Name", ""),
                "Treatments": row.get("Treatments", ""),
                "Contagious": row.get("Contagious", ""),
                "Chronic": row.get("Chronic", ""),
            }

    print(f"✅ Loaded global model: {global_ckpt.name}")
    print("Type symptoms (or 'exit' to quit)\n")

    while True:
        s = input("Symptoms> ").strip()
        if s.lower() in ("exit", "quit"):
            break

        x = encode(s, vocab).to(device)
        with torch.no_grad():
            logits = model(x)
            pred_id = int(torch.argmax(logits, dim=1).item())

        pred_code = id_to_label[str(pred_id)]
        info = code_to_info.get(pred_code, {})

        print("\nPredicted Disease_Code:", pred_code)
        if info:
            print("Disease Name:", info.get("Name", ""))
            print("Contagious:", info.get("Contagious", ""))
            print("Chronic:", info.get("Chronic", ""))
            print("Treatments:", info.get("Treatments", ""))
        print()

if __name__ == "__main__":
    main()
