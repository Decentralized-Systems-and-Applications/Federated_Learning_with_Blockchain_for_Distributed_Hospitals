import pandas as pd
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib

# =========================
# 1) Load dataset
# =========================
df = pd.read_csv("C:\\Users\\seham\\Desktop\\BC_Project\\LocalModelHospital1\\SeperatedDataSets\\hospital1.csv")

# =========================
# 2) Keep only required columns
# =========================
df = df[["Symptoms", "Disease_Code"]].copy()

# =========================
# 3) Basic cleaning
# =========================
df["Symptoms"] = df["Symptoms"].astype(str).str.strip()
df["Disease_Code"] = df["Disease_Code"].astype(str).str.strip()

df = df[(df["Symptoms"] != "") & (df["Disease_Code"] != "")]

print("Total samples after cleaning:", len(df))
print("Unique disease codes:", df["Disease_Code"].nunique())

# =========================
# 4) Train / test split (FORCE SAFE)
# =========================
X = df["Symptoms"]
y = df["Disease_Code"]

class_counts = Counter(y)
print("Class counts:", class_counts)

# 🚨 IMPORTANT: disable stratify completely for hospital datasets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# =========================
# 5) Model pipeline
# =========================
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

# =========================
# 6) Train model
# =========================
print("Training local hospital model...")
model.fit(X_train, y_train)

# =========================
# 7) Evaluate
# =========================
y_pred = model.predict(X_test)

print("\nAccuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, zero_division=0))

# =========================
# 8) Save model
# =========================
joblib.dump(model, "hospital1_model.joblib")
print("\n✅ Model saved as hospital1_model.joblib")
