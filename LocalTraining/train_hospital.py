import sys
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path

def main():
    # Usage: python train_hospital.py 2
    if len(sys.argv) != 2:
        print("Usage: python train_hospital.py <hospital_id>")
        print("Example: python train_hospital.py 2")
        sys.exit(1)

    hospital_id = sys.argv[1].strip()

    # Folder name must match your real folder
    base_path = Path(__file__).resolve().parent
    data_path = base_path / "SeparatedDataSets" / f"hospital{hospital_id}.csv"
    model_path = Path(f"hospital{hospital_id}_model.joblib")

    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found: {data_path.resolve()}")

    print(f"\n🏥 Training Hospital {hospital_id}")
    print(f"📄 Loading dataset: {data_path}")

    df = pd.read_csv(data_path)
    df = df[["Symptoms", "Disease_Code"]].copy()

    # Basic cleaning
    df["Symptoms"] = df["Symptoms"].astype(str).str.strip()
    df["Disease_Code"] = df["Disease_Code"].astype(str).str.strip()
    df = df[(df["Symptoms"] != "") & (df["Disease_Code"] != "")]

    print("Total samples:", len(df))
    print("Unique disease codes:", df["Disease_Code"].nunique())

    X = df["Symptoms"]
    y = df["Disease_Code"]

    # IMPORTANT: no stratify (hospital splits often have rare classes)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            stop_words="english"
        )),
        ("clf", LogisticRegression(
            max_iter=2000,
            class_weight="balanced"
        ))
    ])

    print("Training...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\nAccuracy:", accuracy_score(y_test, y_pred))
    print("\nReport:\n")
    print(classification_report(y_test, y_pred, zero_division=0))

    joblib.dump(model, model_path)
    print(f"\n✅ Saved model -> {model_path}")

if __name__ == "__main__":
    main()
