import urllib.request, urllib.parse, urllib.error
data = urllib.parse.urlencode({'username':'admin', 'password':'admin123'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=data)
try:
    res = urllib.request.urlopen(req)
    print(res.read())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())
