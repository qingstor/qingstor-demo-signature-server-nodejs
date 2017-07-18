// +-------------------------------------------------------------------------
// | Copyright (C) 2017 Yunify, Inc.
// +-------------------------------------------------------------------------
// | Licensed under the Apache License, Version 2.0 (the "License");
// | you may not use this work except in compliance with the License.
// | You may obtain a copy of the License in the LICENSE file, or at:
// |
// | http://www.apache.org/licenses/LICENSE-2.0
// |
// | Unless required by applicable law or agreed to in writing, software
// | distributed under the License is distributed on an "AS IS" BASIS,
// | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// | See the License for the specific language governing permissions and
// | limitations under the License.
// +-------------------------------------------------------------------------

import fs from 'fs';
import _ from 'lodash';
import yaml from 'js-yaml';
import express from 'express';
import body from 'body-parser';
import cors from 'cors';
import {Config, Signer} from 'qingstor-sdk';

// Load settings.
const settings = yaml.safeLoad(
  fs.readFileSync('./server_config.yaml', 'utf8'),
);

// Initialize server.
const server = express();
server.disable('x-powered-by');
server.disable('etag');
server.use(body.urlencoded({extended: false}));
server.use(body.json());
server.use(cors());


// Setup config.
const config = new Config().loadConfig({
  'access_key_id':     settings.access_key_id,
  'secret_access_key': settings.secret_access_key,
  'log_level':         settings.log_level,
});

// Setup handlers.
const router = express.Router();

// Sign operation.
router.post('/operation', (request, response) => {
  const defaultOperation = {
    method:  'GET',
    uri:     '',
    body:    '',
    headers: {},
    params:  {},
  };

  const operation = _.merge({}, defaultOperation, request.body);
  const signer    = new Signer(
    operation, config.access_key_id, config.secret_access_key,
  );

  switch (request.query.channel) {
    // Sign operation by query parameters.
    //
    // Request Example:
    //
    // POST /operation?channel=query HTTP/1.1
    // Content-Type: application/json; charset=utf-8
    // Host: 127.0.0.1:9000
    // Connection: close
    // User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
    // Content-Length: 127
    //
    // {
    //   "method": "GET",
    //   "uri": "https://pek3a.qingstor.com:443/aspire-test?prefix=test%2F",
    //   "body": "",
    //   "headers": {
    //     "Host": "pek3a.qingstor.com",
    //     "X-QS-Date": "Wed, 15 Mar 2017 09:44:38 GMT",
    //     "Content-Type": "application/octet-stream",
    //     "Content-Length": 0,
    //     "User-Agent": "qingstor-sdk-js/2.2.1 (Node.js v7.7.2; darwin x64)"
    //   },
    //   "expires": 1489571836
    // }
    //
    // Response Example:
    //
    // HTTP/1.1 200 OK
    // Content-Type: application/json; charset=utf-8
    // Content-Length: 147
    // Date: Wed, 15 Mar 2017 07:07:52 GMT
    // Connection: close
    //
    // {
    //   "access_key_id": "OGFTIRSEHFOJPZQFYLZQ",
    //   "signature": "+2FHsEepCCbgMlamqU88ZUP6QZh2Vp7BxTASvAiZBlo=",
    //   "expires": 1489571836
    // }
    case 'query': {
      const params = signer.signQuery(operation.expires).params;
      const data   = {
        'access_key_id': params.access_key_id,
        'signature':     params.signature,
        'expires':       params.expires,
      };
      console.log('Sending response: ', JSON.stringify(data, null, 2));
      response.json(data);
      break;
    }
    // Sign operation by Authorization header.
    //
    // Request Example:
    //
    // POST /operation?channel=header HTTP/1.1
    // Content-Type: application/json; charset=utf-8
    // Host: 127.0.0.1:9000
    // Connection: close
    // User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
    // Content-Length: 327
    //
    // {
    //   "method": "PUT",
    //   "uri": "https://pek3a.qingstor.com:443/aspire-test/test-file",
    //   "body": "Hello",
    //   "headers": {
    //     "Host": "pek3a.qingstor.com",
    //     "X-QS-Date": "Wed, 15 Mar 2017 08:57:16 GMT",
    //     "Content-Type": "",
    //     "Content-Length": 5,
    //     "User-Agent": "qingstor-sdk-js/2.2.1 (Node.js v7.7.2; darwin x64)"
    //   }
    // }
    //
    // Response Example:
    //
    // HTTP/1.1 200 OK
    // Content-Type: application/json; charset=utf-8
    // Content-Length: 92
    // Date: Wed, 15 Mar 2017 07:07:52 GMT
    // Connection: close
    //
    // {
    //   "authorization": "QS GFTIRSEHJPZQFYLZQOFO:ed+84K2ZGigwF76eWm56aR2/MF5FkqMVJMr18FkBSoc="
    // }
    case 'header': {
      const data = {
        'authorization': signer.sign().headers.Authorization,
      };
      console.log('Sending response: ', JSON.stringify(data, null, 2));
      response.json(data);
      break;
    }
    default: {
      response.json({});
    }
  }
});

// Sign string to sign.
router.post('/string-to-sign', (request, response) => {
  const signer    = new Signer(
    {}, config.access_key_id, config.secret_access_key,
  );
  const signature = signer.calculateSignature(request.body.string_to_sign);

  switch (request.query.channel) {
    // Sign operation by query parameters.
    //
    // Request Example:
    //
    // POST /string-to-sign?channel=query HTTP/1.1
    // Content-Type: application/json; charset=utf-8
    // Host: 127.0.0.1:9000
    // Connection: close
    // User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
    // Content-Length: 127
    //
    // {
    //   "string_to_sign": "GET\n\napplication/octet-stream\1489571836\n/aspire-test/test-file",
    //   "expires": 1489571836
    // }
    //
    // Response Example:
    //
    // HTTP/1.1 200 OK
    // Content-Type: application/json; charset=utf-8
    // Content-Length: 147
    // Date: Wed, 15 Mar 2017 07:07:52 GMT
    // Connection: close
    //
    // {
    //   "access_key_id": "OGFTIRSEHFOJPZQFYLZQ",
    //   "signature": "+gZYDVc91cxaqpSDj5tFmkL8VDv4+Ay25VQVrQTXsLg=",
    //   "expires": 1489571836
    // }
    case 'query': {
      const data = {
        'access_key_id': config.access_key_id,
        'expires':       request.body.expires,
        signature,
      };
      console.log('Sending response: ', JSON.stringify(data, null, 2));
      response.json(data);
      break;
    }
    // Sign operation by Authorization header.
    //
    // Request Example:
    //
    // POST /string-to-sign?channel=header HTTP/1.1
    // Content-Type: application/json; charset=utf-8
    // Host: 127.0.0.1:9000
    // Connection: close
    // User-Agent: WTF/3.0.16 (Macintosh; OS X/10.12.3) GCDHTTPRequest
    // Content-Length: 327
    //
    // {
    //   "string_to_sign": "GET\n\napplication/octet-stream\Wed, 15 Mar 2017 07:07:52 GMT\n/aspire-test/test-file",
    // }
    //
    // Response Example:
    //
    // HTTP/1.1 200 OK
    // Content-Type: application/json; charset=utf-8
    // Content-Length: 92
    // Date: Wed, 15 Mar 2017 07:07:52 GMT
    // Connection: close
    //
    // {
    //   "authorization": "QS GFTIRJPZQFYLZQOSEHFO:8otBnH4VqE+v8J4TEHAPg9O95nJNQyK22SAWF7PfGhY="
    // }
    case 'header': {
      const data = {
        'authorization': `QS ${config.access_key_id}:${signature}`,
      };
      console.log('Sending response: ', JSON.stringify(data, null, 2));
      response.json(data);
      break;
    }
    default: {
      response.json({});
    }
  }
});

// Apply router.
server.use('/', router);

// Run server.
server.listen(settings.port, settings.host, () => {
  console.log(`Demo server running at: ${settings.host}:${settings.port}`)
});
