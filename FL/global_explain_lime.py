import json
import re
import numpy as np
import torch
import torch.nn.functional as F
from pathlib import Path
from lime.lime_text import LimeTextExplainer

from fl_utils import TextClassifier  # uses your same model class

FL_DIR = Path(__file__).resolve().parent

# Remove useless words from explanations
STOPWORDS = {
    "or", "to", "the", "and", "a", "an", "of", "in", "on", "with", "for", "at",
    "is", "are", "was", "were", "be", "been", "being", "by", "as", "it", "this",
    "that", "these", "those", "from", "into", "over", "under", "than", "then",
    "very", "more", "most", "less", "no", "not"
}

def tokenize(text: str):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [t for t in text.split() if t and t not in STOPWORDS]
    return tokens

def encode(symptoms: str, vocab: dict, max_len: int = 64):
    tokens = tokenize(symptoms)
    ids = [vocab.get(t, vocab["<UNK>"]) for t in tokens][:max_len]
    ids += [vocab["<PAD>"]] * (max_len - len(ids))
    return torch.tensor([ids], dtype=torch.long)  # [1, L]

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def main():
    # Load vocab and label map from FL folder
    vocab = load_json(FL_DIR / "vocab.json")
    id_to_label = load_json(FL_DIR / "label_map.json")
    num_classes = len(id_to_label)

    # Load latest global model automatically
    rounds = sorted(FL_DIR.glob("global_round*.pt"))
    if not rounds:
        raise FileNotFoundError("No global_round*.pt found in FL folder.")
    global_ckpt = rounds[-1]

    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = TextClassifier(vocab_size=len(vocab), num_classes=num_classes).to(device)
    model.load_state_dict(torch.load(global_ckpt, map_location=device))
    model.eval()

    # For LIME, we need: list[str] -> np.array probs (N, num_classes)
    def predict_proba(text_list):
        probs = []
        with torch.no_grad():
            for text in text_list:
                x = encode(text, vocab).to(device)
                logits = model(x)
                p = F.softmax(logits, dim=1).cpu().numpy()[0]
                probs.append(p)
        return np.vstack(probs)

    # LIME display names (could be large; OK for demo)
    class_names = [id_to_label[str(i)] for i in range(num_classes)]
    explainer = LimeTextExplainer(class_names=class_names)

    print(f"✅ Loaded global model: {global_ckpt.name}")
    print("Type symptoms (or 'exit')\n")

    while True:
        text = input("Symptoms> ").strip()
        if text.lower() in ("exit", "quit"):
            break

        # Get prediction
        proba = predict_proba([text])[0]
        pred_id = int(np.argmax(proba))
        pred_code = id_to_label[str(pred_id)]
        conf = float(proba[pred_id])

        print(f"\nPredicted Disease_Code: {pred_code}")
        print(f"Confidence: {conf:.4f}")

        # ✅ Top-5 predictions (trustworthiness)
        top5 = np.argsort(proba)[-5:][::-1]
        print("\nTop-5 predictions:")
        for idx in top5:
            print(f"  {id_to_label[str(int(idx))]:>6s}  ->  {float(proba[idx]):.4f}")

        # ✅ Confidence warning
        if conf < 0.02:
            print("\n⚠️ Low confidence: model is uncertain (likely guessing).")

        print()

        # Explain ONLY top labels (faster + cleaner)
        exp = explainer.explain_instance(
            text_instance=text,
            classifier_fn=predict_proba,
            num_features=10,  # show top 10 contributing words
            top_labels=3      # explain top 3 predicted labels
        )

        print("🔍 LIME Explanation (top words):")
        for word, score in exp.as_list(label=pred_id):
            direction = "↑ supports" if score > 0 else "↓ against"
            print(f"  {word:>15s}  {score:+.4f}  {direction}")

        print()

if __name__ == "__main__":
    main()
