import joblib
import pandas as pd

# Load model (Hospital 1)
model = joblib.load("hospital1_model.joblib")

# Load mapping "database"
map_df = pd.read_csv("disease_mapping.csv")
map_df["Disease_Code"] = map_df["Disease_Code"].astype(str).str.strip()

# Create lookup dict: code -> row dict
code_to_info = {
    row["Disease_Code"]: {
        "Name": row.get("Name", ""),
        "Treatments": row.get("Treatments", ""),
        "Contagious": row.get("Contagious", ""),
        "Chronic": row.get("Chronic", "")
    }
    for _, row in map_df.iterrows()
}

tests = [
    "Intense itching at night with small bumps on skin",
    "Headache confusion dizziness nausea",
    "Cloudy eyes excessive tearing sensitivity to light"
]

for symptoms in tests:
    pred_code = model.predict([symptoms])[0]
    info = code_to_info.get(pred_code, {})

    print("\nSymptoms:", symptoms)
    print("Predicted Disease_Code:", pred_code)
    print("Disease Name:", info.get("Name", "Unknown"))
    print("Contagious:", info.get("Contagious", "Unknown"))
    print("Chronic:", info.get("Chronic", "Unknown"))
    print("Treatments:", info.get("Treatments", "Unknown"))
