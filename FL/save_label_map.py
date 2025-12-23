import json
from pathlib import Path
from fl_utils import build_label_map

def main():
    _, id_to_label = build_label_map()
    Path("label_map.json").write_text(json.dumps(id_to_label, indent=2), encoding="utf-8")
    print("✅ Saved label_map.json")

if __name__ == "__main__":
    main()
