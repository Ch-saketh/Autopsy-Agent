# upload_test.py
import requests
files = {'file': open('demo_data/sample_case_1.json','rb')}
r = requests.post('http://127.0.0.1:8000/api/upload', files=files)
print(r.status_code)
print(r.text)
