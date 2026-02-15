# Aris SDK 🚀
### The Decentralized AI Network Layer

Aris is a lightweight, decentralized infrastructure for local LLM inference. It allows users to contribute compute power as "Worker Nodes" and developers to consume that AI compute via a unified SDK with built-in micro-payments and registry management.

---

## 🛠 Features
- **Decentralized Registry**: On-chain style ledger for managing API keys and balances.
- **Worker Nodes**: Easily turn any machine with a local LLM into a revenue-generating node.
- **Standardized SDK**: OpenAI-compatible interface for easy integration.
- **Transparent Billing**: Built-in balance deduction per inference request.

---

## 📦 Installation

Install the core SDK via pip:

```bash
pip install aris-sdk

```

---

## 🚀 Quick Start (Client Side)

To use the network as a developer, simply initialize the `Aris` client with your API key.

```python
from aris.client import Aris

# Initialize with your minted key
client = Aris(api_key="sk-aris-your-unique-key")

# Generate a response from the decentralized swarm
response = client.generate("Why is the ocean salty?")

print(f"🤖 ARIS: {response}")

```

---

## 🏗 Infrastructure Setup

### 1. Start the Registry

The Registry acts as the "Bank" and "DNS" of the network.

```bash
# Run the registry server (Default port: 8000)
python3 -m registry.main

```

### 2. Join as a Worker Node

Nodes register themselves with the Registry and wait for inference jobs.

```bash
# Start a node on port 9006
aris-node --port 9006

```

### 3. Admin: Minting New Keys

Manage your network users using the admin CLI.

```bash
# Create a new user with a 500 credit balance
aris-admin --email user@example.com --balance 500.0

```

---

## 📂 Project Structure

* `/aris`: The core Client SDK logic.
* `/agent_node`: Worker node infrastructure and LLM integration (TinyLlama).
* `/registry`: Centralized ledger for account and node management.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

**Built with ❤️ for the Decentralized AI Community.**

```

---

### **Final Pro-Tip for the Launch**
Before you run `python3 -m twine upload dist/*`, make sure your `LICENSE` file exists. You can create a quick one like this:

```bash
echo "Copyright (c) 2026 Sid - MIT License" > LICENSE

```