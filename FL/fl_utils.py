import re
import json
import torch
import pandas as pd
from torch.utils.data import Dataset
from pathlib import Path

DATA_DIR = Path("..") / "SeperatedDataSets"

def tokenize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if t]

def load_vocab():
    return json.loads(Path("vocab.json").read_text())

def build_label_map():
    labels = set()
    for i in [1, 2, 3]:
        df = pd.read_csv(DATA_DIR / f"hospital{i}.csv")
        labels.update(df["Disease_Code"].astype(str).dropna().tolist())

    labels = sorted(labels)
    label_to_id = {l: i for i, l in enumerate(labels)}
    id_to_label = {i: l for l, i in label_to_id.items()}
    return label_to_id, id_to_label

class SymptomsDataset(Dataset):
    def __init__(self, csv_path, vocab, label_to_id, max_len=64):
        df = pd.read_csv(csv_path)
        df = df[["Symptoms", "Disease_Code"]].dropna()

        self.texts = df["Symptoms"].astype(str).tolist()
        self.labels = [label_to_id[x] for x in df["Disease_Code"].astype(str)]

        self.vocab = vocab
        self.max_len = max_len

    def encode(self, text):
        tokens = tokenize(text)
        ids = [self.vocab.get(t, self.vocab["<UNK>"]) for t in tokens][:self.max_len]
        ids += [self.vocab["<PAD>"]] * (self.max_len - len(ids))
        return torch.tensor(ids)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.encode(self.texts[idx]), torch.tensor(self.labels[idx])

class TextClassifier(torch.nn.Module):
    def __init__(self, vocab_size, num_classes, embed_dim=64):
        super().__init__()
        self.embedding = torch.nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.fc = torch.nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        emb = self.embedding(x)
        mask = (x != 0).unsqueeze(-1)
        pooled = (emb * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1)
        return self.fc(pooled)

def fedavg(states, weights):
    avg = {}
    for k in states[0]:
        avg[k] = sum(w * s[k] for w, s in zip(weights, states))
    return avg
