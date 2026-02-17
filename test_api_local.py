import requests

url = "http://localhost:8000/analyze"
try:
    with open('test_rfp.pdf', 'rb') as f:
        files = {'file': ('test_rfp.pdf', f, 'application/pdf')}
        print(f"Sending POST request to {url}...")
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:", response.json())
        except:
            print("Response Text:", response.text)
except FileNotFoundError:
    print("Error: test_rfp.pdf not found. Run create_pdf.py first.")
except Exception as e:
    print(f"Request Error: {e}")
