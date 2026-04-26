import os
import subprocess

class IPFSAdder:
    def __init__(self, containers, pt_folder):
        """
        containers: list of Docker container names to add files to
        pt_folder: path to the folder containing .pt files
        """
        self.containers = containers
        self.pt_folder = pt_folder

    def add_file_to_container(self, container_name, file_path):
        """
        Copies a single file to a container and adds it to IPFS.
        Returns the CID string.
        """
        file_name = os.path.basename(file_path)

        # 1️⃣ Copy file to container (into /tmp folder)
        subprocess.run(
            ["docker", "cp", file_path, f"{container_name}:/tmp/{file_name}"],
            check=True
        )

        # 2️⃣ Run ipfs add inside the container
        result = subprocess.run(
            ["docker", "exec", container_name, "ipfs", "add", f"/tmp/{file_name}"],
            capture_output=True,
            text=True,
            check=True
        )

        return result.stdout.strip()

    def add_all_files(self):
        """
        Adds all .pt files from pt_folder to all containers.
        Prints each file and the resulting CID.
        """
        pt_files = [
            os.path.join(self.pt_folder, f)
            for f in os.listdir(self.pt_folder)
            if f.endswith(".pt")
        ]

        if not pt_files:
            print(f"No .pt files found in {self.pt_folder}")
            return

        for file_path in pt_files:
            for container in self.containers:
                try:
                    cid = self.add_file_to_container(container, file_path)
                    print(f"{file_path} -> {container} | CID: {cid}")
                except subprocess.CalledProcessError as e:
                    print(f"Failed to add {file_path} to {container}. Error:\n{e.stderr}")


if __name__ == "__main__":
    # Example usage:
    # List of your IPFS Docker containers
    containers = ["ipfs_hospital1", "ipfs_hospital2", "ipfs_hospital3", "ipfs_global"]

    # Path to your FL folder containing .pt files
    pt_folder = os.path.join(os.path.dirname(__file__), "..", "FL")  # relative path example

    ipfs_adder = IPFSAdder(containers, pt_folder)
    ipfs_adder.add_all_files()
