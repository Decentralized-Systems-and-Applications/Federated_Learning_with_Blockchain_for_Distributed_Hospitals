import torch
from fl_utils import load_vocab, build_label_map, TextClassifier, fedavg, set_seed
from fl_client import train_one_client

def main(rounds=5):
    set_seed(42)

    vocab = load_vocab("vocab.json")
    label_to_id, _ = build_label_map("SeparatedDataSets")

    # Init global model
    global_model = TextClassifier(vocab_size=len(vocab), num_classes=len(label_to_id))
    torch.save(global_model.state_dict(), "global_round0.pt")
    print("✅ Initialized global_round0.pt")

    global_path = "global_round0.pt"

    for r in range(1, rounds + 1):
        print(f"\n===== Federated Round {r} =====")

        # Each hospital trains locally starting from global weights
        n1 = train_one_client(1, global_path, f"h1_round{r}.pt")
        n2 = train_one_client(2, global_path, f"h2_round{r}.pt")
        n3 = train_one_client(3, global_path, f"h3_round{r}.pt")

        # Load updates
        sd1 = torch.load(f"h1_round{r}.pt", map_location="cpu")
        sd2 = torch.load(f"h2_round{r}.pt", map_location="cpu")
        sd3 = torch.load(f"h3_round{r}.pt", map_location="cpu")

        # Weighted FedAvg by dataset size
        total = n1 + n2 + n3
        new_global = fedavg([sd1, sd2, sd3], weights=[n1/total, n2/total, n3/total])

        torch.save(new_global, f"global_round{r}.pt")
        print(f"✅ Saved global_round{r}.pt")

        global_path = f"global_round{r}.pt"

    print("\n🎉 Federated training finished.")
    print("Use the latest global_roundX.pt for inference.")

if __name__ == "__main__":
    main(rounds=5)
