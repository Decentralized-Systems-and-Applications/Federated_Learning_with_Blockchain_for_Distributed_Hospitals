import pandas as pd

# Load your original dataset (the one that includes Name/Treatments/etc.)
df = pd.read_csv("DatasetHospital1.csv")
# Keep the mapping columns (this is your "database table")
mapping = df[["Disease_Code", "Name", "Treatments", "Contagious", "Chronic"]].copy()

# Clean
mapping["Disease_Code"] = mapping["Disease_Code"].astype(str).str.strip()
mapping["Name"] = mapping["Name"].astype(str).str.strip()

# Remove duplicates by Disease_Code (keep first occurrence)
mapping = mapping.drop_duplicates(subset=["Disease_Code"], keep="first")

# Save as CSV (simple “database”)
mapping.to_csv("disease_mapping.csv", index=False)

print("✅ Saved mapping table -> disease_mapping.csv")
print("Rows:", len(mapping))
