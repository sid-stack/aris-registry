import logging
from aris.client import Aris

logging.basicConfig(level=logging.INFO, format='%(message)s')
print("--- 💰 Aris Professional Demo ---")
client = Aris(api_key="sk-aris-demo-key")


try:
    print("USER: Why is the ocean salty?")
    response = client.generate("Why is the ocean salty?")
    print(f"\n🤖 ARIS: {response}")
except Exception as e:
    print(f"❌ ERROR: {e}")