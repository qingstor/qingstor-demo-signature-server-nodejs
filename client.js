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
import request from 'request';
import async from 'async';
import {Config, QingStor} from 'qingstor-sdk';

// Load settings.
const settings = yaml.safeLoad(
  fs.readFileSync('./client_config.yaml', 'utf8'),
);

// Setup config.
const config = new Config().loadConfig({
  'host':      settings.host,
  'port':      settings.port,
  'protocol':  settings.protocol,
  'log_level': settings.log_level,
});

const signatureServer = `${
  settings.signature_server_protocol}://${
  settings.signature_server_host}:${
  settings.signature_server_port}`;

// Initialize bucket.
const qsService = new QingStor(config);
const bucket    = qsService.Bucket(settings.bucket_name, settings.zone);

// List objects.
const listObjectsExample = callback => {
  const listObjectsRequest = bucket.listObjectsRequest({prefix: 'test/'});
  const expires            = parseInt(Date.now() / 1000 + 3600);

  // Sign request operation by query parameters.
  const body = JSON.stringify(_.extend({expires}, listObjectsRequest.operation), null, 2);
  console.log('Sending request to signature server: ', body);
  request({
    method:  'POST',
    uri:     `${signatureServer}/operation?channel=query`,
    headers: {'Content-Type': 'application/json'},
    body,
  }, (error, response) => {
    // Apply signature.
    const data = JSON.parse(response.body);
    listObjectsRequest.applyQuerySignature(data.access_key_id, data.signature, data.expires);

    // Send signed request.
    listObjectsRequest.send((error, response) => {
      console.log('Finished list objects request.');
      console.log(JSON.stringify(JSON.parse(response.body), null, 2));
      callback();
    });
  });
};

// Put object.
const putObjectExample = callback => {
  const putObjectRequest = bucket.putObjectRequest('test-file', {body: 'Hello'});

  // Sign request operation by Authorization header.
  const body = JSON.stringify(putObjectRequest.operation, null, 2);
  console.log('Sending request to signature server: ', body);
  request({
    method:  'POST',
    uri:     `${signatureServer}/operation?channel=header`,
    headers: {'Content-Type': 'application/json'},
    body,
  }, (error, response) => {
    // Apply signature.
    putObjectRequest.applySignature(JSON.parse(response.body).authorization);

    // Send signed request.
    putObjectRequest.send((error, response) => {
      console.log('Finished put object request.');
      console.log(response.body);
      callback();
    });
  });
};

// Get object.
const getObjectExample = callback => {
  const getObjectRequest = bucket.getObjectRequest('test-file');
  const expires          = parseInt(Date.now() / 1000 + 3600);

  // Sign request operation by string to sign.
  const body = JSON.stringify({
    'string_to_sign': getObjectRequest.getQueryStringToSign(expires),
    expires,
  }, null, 2);
  console.log('Sending request to signature server: ', body);
  request({
    method:  'POST',
    uri:     `${signatureServer}/string-to-sign?channel=query`,
    headers: {'Content-Type': 'application/json'},
    body,
  }, (error, response) => {
    // Apply signature.
    const data = JSON.parse(response.body);
    getObjectRequest.applyQuerySignature(data.access_key_id, data.signature, data.expires);

    // Send signed request.
    getObjectRequest.send((error, response) => {
      console.log('Finished get object request.');
      console.log(response.body);
      callback();
    });
  });
};

// Delete object.
const deleteObjectExample = callback => {
  const deleteObjectRequest = bucket.deleteObjectRequest('test-file');

  // Sign request operation by string to sign.
  const body = JSON.stringify({
    'string_to_sign': deleteObjectRequest.getStringToSign(),
  }, null, 2);
  console.log('Sending request to signature server: ', body);
  request({
    method:  'POST',
    uri:     `${signatureServer}/string-to-sign?channel=header`,
    headers: {'Content-Type': 'application/json'},
    body,
  }, (error, response) => {
    // Apply signature.
    const data = JSON.parse(response.body);
    deleteObjectRequest.applySignature(JSON.parse(response.body).authorization);

    // Send signed request.
    deleteObjectRequest.send((error, response) => {
      console.log('Finished delete object request.');
      console.log(response.body);
      callback();
    });
  });
};

// Execute.
async.waterfall([
  listObjectsExample, putObjectExample, getObjectExample, deleteObjectExample,
]);
