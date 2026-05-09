import urllib.request
try:
    req = urllib.request.Request('https://ampayer-api.onrender.com/api/seed/', method='POST')
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode())
except Exception as e:
    print(str(e))
