# QingStor Demo - Signature Server (NodeJS)

This project demonstrates how to use [`qingstor-sdk-js`](https://github.com/yunify/qingstor-sdk-js) to create the signature server, and a demo client written in JavaScript is also provided.

## Data Flow

Assume that we have a client that knows nothing about the access key and secret access key, such as a JavaScript application runs in the web browser or a mobile iOS application. If the client wants to access to non-public bucket directly, it needs the signature generated from the signature server for every request.

Here's a diagram describes the data flow:

```
+---------------------------------------------------------------------------+
|                                                                           |
|                           +-----------------------------+                 |
|                           |                             |                 |
|               +---------> |   QingStor Object Storage   |                 |
|               |           |                             |                 |
|               |           +--------------+--------------+                 |
|       3. Send |                          |                                |
|        Signed |    +---------------------+                                |
|       Request |    |   4. Response                                        |
|               |    v                                                      |
|               |                                                           |
|      +--------+--------+                                                  |
|      |                 |        2. Get Signature                          |
|      |     Client      | <-----------------------------+                  |
|      |                 |                               |                  |
|      +--------+--------+                    +----------+-----------+      |
|               |                             |                      |      |
|               +---------------------------> |   Signature Server   |      |
|                      1. Sign Request        |                      |      |
|                                             +----------------------+      |
|                                                                           |
+---------------------------------------------------------------------------+
```


## Getting Started

Clone this repository and install dependencies.

``` bash
git clone https://github.com/yunify/qingstor-demo-signature-server-nodejs.git
cd qingstor-demo-signature-server-nodejs
npm install
```

Setup configurations.

``` bash
cp server_config.yaml.example server_config.yaml
vim server_config.yaml

cp client_config.yaml.example client_config.yaml
vim client_config.yaml
```

Start the demo signature server.

``` bash
npm run server
```

Run the demo client.

``` bash
npm run client
```

___Notice:___ _Please read the source code for more details._

## Signature Server Usage

### Sign operation by query parameters.

_Request Example:_

``` http
POST /operation?channel=query HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: 127.0.0.1:9000
Connection: close
User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
Content-Length: 127

{
  "method": "GET",
  "uri": "https://pek3a.qingstor.com:443/aspire-test?prefix=test%2F",
  "body": "",
  "headers": {
    "Host": "pek3a.qingstor.com",
    "X-QS-Date": "Wed, 15 Mar 2017 09:44:38 GMT",
    "Content-Type": "application/octet-stream",
    "Content-Length": 0,
    "User-Agent": "qingstor-sdk-js/2.2.1 (Node.js v7.7.2; darwin x64)"
  },
  "expires": 1489571836
}
```

_Response Example:_

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 147
Date: Wed, 15 Mar 2017 07:07:52 GMT
Connection: close

{
  "access_key_id": "OGFTIRSEHFOJPZQFYLZQ",
  "signature": "+2FHsEepCCbgMlamqU88ZUP6QZh2Vp7BxTASvAiZBlo=",
  "expires": 1489571836
}
```

### Sign operation by Authorization header.

_Request Example:_

``` http
POST /operation?channel=header HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: 127.0.0.1:9000
Connection: close
User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
Content-Length: 327

{
  "method": "PUT",
  "uri": "https://pek3a.qingstor.com:443/aspire-test/test-file",
  "body": "Hello",
  "headers": {
    "Host": "pek3a.qingstor.com",
    "X-QS-Date": "Wed, 15 Mar 2017 08:57:16 GMT",
    "Content-Type": "",
    "Content-Length": 5,
    "User-Agent": "qingstor-sdk-js/2.2.1 (Node.js v7.7.2; darwin x64)"
  }
}
```

_Response Example:_

``` http
Response Example:
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 92
Date: Wed, 15 Mar 2017 07:07:52 GMT
Connection: close

{
  "authorization": "QS GFTIRSEHJPZQFYLZQOFO:ed+84K2ZGigwF76eWm56aR2/MF5FkqMVJMr18FkBSoc="
}
```



### Sign operation by query parameters.


_Request Example:_

``` http
POST /operation?channel=query HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: 127.0.0.1:9000
Connection: close
User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
Content-Length: 127

{
  "string_to_sign": "GET\n\napplication/octet-stream\1489571836\n/aspire-test/test-file",
  "expires": 1489571836
}
```

_Response Example:_

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 147
Date: Wed, 15 Mar 2017 07:07:52 GMT
Connection: close

{
  "access_key_id": "OGFTIRSEHFOJPZQFYLZQ",
  "signature": "+gZYDVc91cxaqpSDj5tFmkL8VDv4+Ay25VQVrQTXsLg=",
  "expires": 1489571836
}
```

### Sign operation by Authorization header.

_Request Example:_

``` http
POST /operation?channel=header HTTP/1.1
Content-Type: application/json; charset=utf-8
Host: 127.0.0.1:9000
Connection: close
User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
Content-Length: 327

{
  "method": "PUT",
  "uri": "https://pek3a.qingstor.com:443/aspire-test/test-file",
  "body": "Hello",
  "headers": {
    "Host": "pek3a.qingstor.com",
    "X-QS-Date": "Wed, 15 Mar 2017 08:57:16 GMT",
    "Content-Type": "",
    "Content-Length": 5,
    "User-Agent": "qingstor-sdk-js/2.2.1 (Node.js v7.7.2; darwin x64)"
  }
}
```

_Response Example:_

``` http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 92
Date: Wed, 15 Mar 2017 07:07:52 GMT
Connection: close
{
  "authorization": "QS GFTIRJPZQFYLZQOSEHFO:8otBnH4VqE+v8J4TEHAPg9O95nJNQyK22SAWF7PfGhY="
}
```

## Reference Documentations

- [QingStor Documentation](https://docs.qingcloud.com/qingstor/index.html)
- [QingStor Guide](https://docs.qingcloud.com/qingstor/guide/index.html)
- [QingStor APIs](https://docs.qingcloud.com/qingstor/api/index.html)
- [QingStor Signature](https://docs.qingcloud.com/qingstor/api/common/signature.html)

## LICENSE

The Apache License (Version 2.0, January 2004).
