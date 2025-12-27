import pandas as pd

# Load original dataset
df = pd.read_csv("DatasetHospital1.csv")

# Keep training columns only
df = df[["Symptoms", "Disease_Code"]].dropna()
df["Symptoms"] = df["Symptoms"].astype(str).str.strip()
df["Disease_Code"] = df["Disease_Code"].astype(str).str.strip()
df = df[(df["Symptoms"] != "") & (df["Disease_Code"] != "")]

# Shuffle
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Split into 3 hospitals
n = len(df)
h1 = df.iloc[: n//3]
h2 = df.iloc[n//3 : 2*n//3]
h3 = df.iloc[2*n//3 :]

h1.to_csv("SeperatedDataSets/hospital1.csv", index=False)
h2.to_csv("SeperatedDataSets/hospital2.csv", index=False)
h3.to_csv("SeperatedDataSets/hospital3.csv", index=False)

print("✅ Created hospital datasets:")
print("hospital1.csv:", len(h1))
print("hospital2.csv:", len(h2))
print("hospital3.csv:", len(h3))
