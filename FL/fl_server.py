import torch
from fl_utils import load_vocab, build_label_map, TextClassifier, fedavg
from fl_client import train_client

 # Central server coordinating federated learning


def main(rounds=5):
    vocab = load_vocab()
    label_to_id, _ = build_label_map()

    global_model = TextClassifier(len(vocab), len(label_to_id))
    torch.save(global_model.state_dict(), "global_round0.pt")

    global_path = "global_round0.pt"


# Start federated learning rounds:
# Each round, send the global model to each hospital (client),
# have them train locally, then average their weights to form a new global model.
# Repeat for the specified number of rounds.
# Finally, save the final global model.

    for r in range(1, rounds + 1):
        print(f"\n🌍 Federated Round {r}")

        n1 = train_client(1, global_path, f"h1_round{r}.pt")
        n2 = train_client(2, global_path, f"h2_round{r}.pt")
        n3 = train_client(3, global_path, f"h3_round{r}.pt")

        sd1 = torch.load(f"h1_round{r}.pt")
        sd2 = torch.load(f"h2_round{r}.pt")
        sd3 = torch.load(f"h3_round{r}.pt")

        total = n1 + n2 + n3
        new_global = fedavg(
            [sd1, sd2, sd3],
            [n1/total, n2/total, n3/total]
        )

        global_path = f"global_round{r}.pt"
        torch.save(new_global, global_path)
        print(f"✅ Saved {global_path}")

    print("\n🎉 Federated Learning finished")

if __name__ == "__main__":
    main()
