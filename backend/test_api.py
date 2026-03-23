import requests

response = requests.post(
    "http://127.0.0.1:5000/api/intent",
    json={"intent": "Block Instagram after 11pm"}
)
print(response.json())