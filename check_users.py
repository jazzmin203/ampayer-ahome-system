import urllib.request
try:
    req = urllib.request.Request('https://ampayer-api.onrender.com/api/users/', method='GET')
    urllib.request.urlopen(req)
    print("Success")
except Exception as e:
    print(e.code if hasattr(e, 'code') else e)
