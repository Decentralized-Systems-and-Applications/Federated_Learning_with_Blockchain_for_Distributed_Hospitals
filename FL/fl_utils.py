import re
import json
import torch
import pandas as pd
from torch.utils.data import Dataset

def tokenize(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if t]

class SymptomsDataset(Dataset):
    def __init__(self, csv_path: str, vocab: dict, label_to_id: dict, max_len: int = 64):
        df = pd.read_csv(csv_path)
        df = df[["Symptoms", "Disease_Code"]].copy()
        df["Symptoms"] = df["Symptoms"].astype(str).fillna("").str.strip()
        df["Disease_Code"] = df["Disease_Code"].astype(str).fillna("").str.strip()
        df = df[(df["Symptoms"] != "") & (df["Disease_Code"] != "")]
        self.texts = df["Symptoms"].tolist()
        self.labels = [label_to_id[x] for x in df["Disease_Code"].tolist()]
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self):
        return len(self.labels)

    def encode(self, text: str):
        tokens = tokenize(text)
        ids = [self.vocab.get(t, self.vocab["<UNK>"]) for t in tokens][: self.max_len]
        if len(ids) < self.max_len:
            ids += [self.vocab["<PAD>"]] * (self.max_len - len(ids))
        return torch.tensor(ids, dtype=torch.long)

    def __getitem__(self, idx):
        x = self.encode(self.texts[idx])
        y = torch.tensor(self.labels[idx], dtype=torch.long)
        return x, y

def load_vocab(path="vocab.json"):
    return json.loads(open(path, "r", encoding="utf-8").read())

def build_label_map(data_dir="SeparatedDataSets"):
    # Ensure all hospitals use SAME class ids
    import pathlib
    labels = set()
    for i in [1,2,3]:
        df = pd.read_csv(pathlib.Path(data_dir) / f"hospital{i}.csv")
        labels.update(df["Disease_Code"].astype(str).dropna().str.strip().tolist())
    labels = sorted([l for l in labels if l])
    label_to_id = {l:i for i,l in enumerate(labels)}
    id_to_label = {i:l for l,i in label_to_id.items()}
    return label_to_id, id_to_label

class TextClassifier(torch.nn.Module):
    # Embedding -> mean pooling -> linear classifier
    def __init__(self, vocab_size: int, num_classes: int, embed_dim: int = 64, pad_id: int = 0):
        super().__init__()
        self.emb = torch.nn.Embedding(vocab_size, embed_dim, padding_idx=pad_id)
        self.fc = torch.nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        # x: [B, L]
        emb = self.emb(x)              # [B, L, D]
        mask = (x != 0).float().unsqueeze(-1)  # PAD=0
        summed = (emb * mask).sum(dim=1)
        denom = mask.sum(dim=1).clamp(min=1.0)
        mean = summed / denom
        return self.fc(mean)

def set_seed(seed=42):
    import random
    random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

def fedavg(state_dicts, weights=None):
    # weighted average of model parameters
    if weights is None:
        weights = [1.0 / len(state_dicts)] * len(state_dicts)
    avg = {}
    for k in state_dicts[0].keys():
        avg[k] = sum(w * sd[k] for w, sd in zip(weights, state_dicts))
    return avg
