import re
import json
import pandas as pd
from pathlib import Path
from collections import Counter

#This file is making sure all hospital datasets are in this folder
#Like a universal word dictionary for all hospitals
#every word in the vocabulary gets a unique ID number
#When the model sees the word "eye" in the symptoms, it converts the word "eye" into the number 29 internally. The model doesn't actually understand words as text; it only understands numbers. So these IDs are a way to turn human language into something the model can process.
DATA_DIR = Path("..") / "SeperatedDataSets"
OUT_PATH = Path("vocab.json")

def tokenize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return [t for t in text.split() if t]

def main():
    dfs = []
    for i in [1, 2, 3]:
        dfs.append(pd.read_csv(DATA_DIR / f"hospital{i}.csv"))

    df = pd.concat(dfs, ignore_index=True)
    texts = df["Symptoms"].astype(str).fillna("").tolist()

    counter = Counter()
    for t in texts:
        counter.update(tokenize(t))

    max_vocab = 8000
    vocab_tokens = [w for w, _ in counter.most_common(max_vocab)]

    # Create vocab dictionary

    vocab = {"<PAD>": 0, "<UNK>": 1}
    for w in vocab_tokens:
        if w not in vocab:
            vocab[w] = len(vocab)

    OUT_PATH.write_text(json.dumps(vocab, indent=2))
    print(f"✅ vocab.json created | size={len(vocab)}")

if __name__ == "__main__":
    main()
