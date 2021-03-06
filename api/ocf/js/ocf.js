/* Copyright (c) 2017-2020 SKKU ESLAB, and contributors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var console = require('console');
var assert = require('assert');

/**
 * ANT OCF API
 */
function OCF() {
  // Interface constants
  this.OC_IF_BASELINE = 1 << 1;
  this.OC_IF_LL = 1 << 2;
  this.OC_IF_B = 1 << 3;
  this.OC_IF_R = 1 << 4;
  this.OC_IF_RW = 1 << 5;
  this.OC_IF_A = 1 << 6;
  this.OC_IF_S = 1 << 7;
  this.OC_IF_CREATE = 1 << 8;

  // Method constants
  this.OC_GET = 1;
  this.OC_POST = 2;
  this.OC_PUT = 3;
  this.OC_DELETE = 4;

  // QoS constants
  this.OC_HIGH_QOS = 0;
  this.OC_LOW_QOS = 1;

  // Status constants
  this.OC_STATUS_OK = 0;
  this.OC_STATUS_CREATED = 1;
  this.OC_STATUS_CHANGED = 2;
  this.OC_STATUS_DELETED = 3;
  this.OC_STATUS_NOT_MODIFIED = 4;
  this.OC_STATUS_BAD_REQUEST = 5;
  this.OC_STATUS_UNAUTHORIZED = 6;
  this.OC_STATUS_BAD_OPTION = 7;
  this.OC_STATUS_FORBIDDEN = 8;
  this.OC_STATUS_NOT_FOUND = 9;
  this.OC_STATUS_METHOD_NOT_ALLOWED = 10;
  this.OC_STATUS_NOT_ACCEPTABLE = 11;
  this.OC_STATUS_REQUEST_ENTITY_TOO_LARGE = 12;
  this.OC_STATUS_UNSUPPORTED_MEDIA_TYPE = 13;
  this.OC_STATUS_INTERNAL_SERVER_ERROR = 14;
  this.OC_STATUS_NOT_IMPLEMENTED = 15;
  this.OC_STATUS_BAD_GATEWAY = 16;
  this.OC_STATUS_SERVICE_UNAVAILABLE = 17;
  this.OC_STATUS_GATEWAY_TIMEOUT = 18;
  this.OC_STATUS_PROXYING_NOT_SUPPORTED = 19;
}

var sOCFAdapter = undefined;
OCF.prototype.getAdapter = function () {
  if (sOCFAdapter === undefined) {
    sOCFAdapter = new OCFAdapter();
  }
  return sOCFAdapter;
};
OCF.prototype.createResource = function (
  device,
  name,
  uri,
  types,
  interfaceMasks
) {
  return new OCFResource(device, name, uri, types, interfaceMasks);
};

var gOCFAdapterRequestId = 0;
gObserveRequestList = [];
gGetRequestList = [];
gDeleteRequestList = [];
gPostRequestList = [];
gPutRequestList = [];
gOnewayRequestLists = [
  gGetRequestList,
  gDeleteRequestList,
  gPostRequestList,
  gPutRequestList
];

/**
 * OCF Adapter
 */
function OCFAdapter() {
  this._mfgName = '';
  this._devices = [];
  this._resources = [];
  this._nextDeviceId = 0;

  // Default handler
  var self = this;
  this.initialize();
  this.onPrepareEventLoop(function () {
    self.setPlatform('ant');
    self.addDevice('/oic/d', 'oic.d.light', 'Light', 'ocf.res.1.0.0');
  });
}
OCFAdapter.prototype.initialize = function () {
  native.ocf_adapter_initialize();
};
OCFAdapter.prototype.deinitialize = function () {
  native.ocf_adapter_deinitialize();
};
OCFAdapter.prototype.setPlatform = function (mfgName) {
  this._mfgName = mfgName;
  native.ocf_adapter_setPlatform(mfgName);
};
OCFAdapter.prototype.getPlatform = function () {
  return this._mfgName;
};
OCFAdapter.prototype.addDevice = function (
  uri,
  resourceType,
  name,
  specVersion,
  dataModelVersion
) {
  var device = new OCFDevice(
    this._nextDeviceId++,
    uri,
    resourceType,
    name,
    specVersion,
    dataModelVersion
  );
  this._devices.push(device);
  native.ocf_adapter_addDevice(
    uri,
    resourceType,
    name,
    specVersion,
    dataModelVersion
  );
};
OCFAdapter.prototype.getDevices = function () {
  return this._devices;
};
OCFAdapter.prototype.getDevice = function (i) {
  return this._devices[i];
};

OCFAdapter.prototype.onPrepareEventLoop = function (handler) {
  // Handler: void function(void)
  native.ocf_adapter_onPrepareEventLoop(handler);
};
OCFAdapter.prototype.onPrepareClient = function (handler) {
  // Handler: void function(void)
  native.ocf_adapter_onPrepareClient(handler);
};
OCFAdapter.prototype.onPrepareServer = function (handler) {
  // Handler: void function(void)
  native.ocf_adapter_onPrepareServer(handler);
};
OCFAdapter.prototype.start = function () {
  oaStartRequestListCleaner();
  native.ocf_adapter_start();
};
OCFAdapter.prototype.stop = function () {
  native.ocf_adapter_stop();
  oaStopRequestListCleaner();
};

OCFAdapter.prototype.addResource = function (resource) {
  this._resources.push(resource);
  native.ocf_adapter_addResource(resource);
};
OCFAdapter.prototype.deleteResource = function (resource) {
  resource.destroyer();
  var index = this._resources.indexOf(resource);
  this._resources.splice(index, 1);
};
OCFAdapter.prototype.getResources = function () {
  return this._resources;
};

OCFAdapter.prototype.repStartRootObject = function () {
  native.ocf_adapter_repStartRootObject();
};
OCFAdapter.prototype.repSet = function (key, value) {
  if (typeof value === 'boolean') {
    native.ocf_adapter_repSetBoolean(key, value);
  } else if (typeof value === 'number') {
    if (value == parseInt(value, 10)) {
      native.ocf_adapter_repSetInt(key, value);
    } else {
      native.ocf_adapter_repSetDouble(key, value);
    }
  } else if (typeof value === 'string') {
    native.ocf_adapter_repSetString(key, value);
  } else {
    console.log('repSet(): Not supported type (' + typeof value + ')');
  }
};
OCFAdapter.prototype.repEndRootObject = function () {
  native.ocf_adapter_repEndRootObject();
};
OCFAdapter.prototype.sendResponse = function (ocfRequest, statusCode) {
  native.ocf_adapter_sendResponse(ocfRequest, statusCode);
};

OCFAdapter.prototype.stopDiscovery = function () {
  return native.ocf_adapter_stopDiscovery();
};
OCFAdapter.prototype.isDiscovering = function () {
  return native.ocf_adapter.isDiscovering();
};
OCFAdapter.prototype.discovery = function (resourceType, discoveryHandler) {
  return native.ocf_adapter_discovery(resourceType, discoveryHandler);
};
OCFAdapter.prototype.discoveryAll = function (discoveryHandler) {
  return native.ocf_adapter_discovery(' ', discoveryHandler);
};

var makeRequest = function (requestId, query, qos, endpoint, uri, userHandler) {
  var request = {};
  request.id = requestId;
  request.query = query;
  request.qos = qos;
  request.endpoint = endpoint;
  request.uri = uri;
  request.userHandler = userHandler;
  request.timestamp = new Date();
  return request;
};

var oaObserveResponseHandler = function (requestId, response) {
  return oaResponseHandler(requestId, response, gObserveRequestList, false);
};
var oaGetResponseHandler = function (requestId, response) {
  return oaResponseHandler(requestId, response, gGetRequestList, true);
};
var oaDeleteResponseHandler = function (requestId, response) {
  return oaResponseHandler(requestId, response, gDeleteRequestList, true);
};
var oaPostResponseHandler = function (requestId, response) {
  return oaResponseHandler(requestId, response, gPostRequestList, true);
};
var oaPutResponseHandler = function (requestId, response) {
  return oaResponseHandler(requestId, response, gPutRequestList, true);
};
var oaResponseHandler = function (requestId, response, requestList, isOneway) {
  var request = undefined;
  for (var i = 0; i < requestList.length; i++) {
    var item = requestList[i];
    if (item !== undefined && item.id == requestId) {
      request = item;
      break;
    }
  }
  if (request !== undefined) {
    var userHandler = request.userHandler;
    if (userHandler !== undefined) {
      userHandler(response);
      if (isOneway) {
        requestList.splice(requestId, 1);
      }
    }
  }
};
var responseTimeoutMs = 2000;
var requestListCleanerFrequencyMS = 2000;
var requestListCleaner = undefined;
var requestListCleanerFn = function () {
  var now = new Date();
  for (var i = 0; i < gOnewayRequestLists.length; i++) {
    var requestList = gOnewayRequestLists[i];
    for (var j = 0; j < requestList.length; j++) {
      var request = requestList[j];
      if (request === undefined) continue;
      if (now - request.timestamp > responseTimeoutMs) {
        requestList.splice(j, 1);
      }
    }
  }
};
var oaStartRequestListCleaner = function () {
  requestListCleaner = setInterval(
    requestListCleanerFn,
    requestListCleanerFrequencyMS
  );
};
var oaStopRequestListCleaner = function () {
  clearInterval(requestListCleaner);
};

OCFAdapter.prototype.observe = function (
  endpoint,
  uri,
  userHandler,
  query,
  qos
) {
  if (query === undefined) {
    query = '';
  }
  if (qos == undefined) {
    qos = 0; // HIGH_QOS
  }

  var requestId = gOCFAdapterRequestId++;
  var request = makeRequest(requestId, query, qos, endpoint, uri, userHandler);

  var result = native.ocf_adapter_observe(request, oaObserveResponseHandler);
  if (result) {
    gObserveRequestList.push(request);
  }
  return result;
};

OCFAdapter.prototype.stopObserve = function (endpoint, uri) {
  var requestId = undefined;
  for (var i = 0; i < gObserveRequestList.length; i++) {
    var request = gObserveRequestList[i];
    if (request.endpoint == endpoint && request.uri == request.uri) {
      requestId = request.id;
      gObserveRequestList.splice(i, 1);
      break;
    }
  }

  if (requestId !== undefined) {
    var result = native.ocf_adapter_stopObserve(requestId, endpoint, uri);
    return result;
  } else {
    console.log('Error: cannot find observe request for ' + uri);
    return false;
  }
};

OCFAdapter.prototype.get = function (endpoint, uri, userHandler, query, qos) {
  if (query === undefined) {
    query = '';
  }
  if (qos == undefined) {
    qos = 0; // HIGH_QOS
  }

  var requestId = gOCFAdapterRequestId++;
  var request = makeRequest(requestId, query, qos, endpoint, uri, userHandler);
  var result = native.ocf_adapter_get(request, oaGetResponseHandler);
  if (result) {
    gGetRequestList.push(request);
  }
  return result;
};

OCFAdapter.prototype.delete = function (
  endpoint,
  uri,
  userHandler,
  query,
  qos
) {
  if (query === undefined) {
    query = '';
  }
  if (qos == undefined) {
    qos = 0; // HIGH_QOS
  }

  var requestId = gOCFAdapterRequestId++;
  var request = makeRequest(requestId, query, qos, endpoint, uri, userHandler);
  var result = native.ocf_adapter_delete(request, oaDeleteResponseHandler);
  if (result) {
    gDeleteRequestList.push(request);
  }
  return result;
};

OCFAdapter.prototype.initPost = function (
  endpoint,
  uri,
  userHandler,
  query,
  qos
) {
  if (query === undefined) {
    query = '';
  }
  if (qos == undefined) {
    qos = 0; // HIGH_QOS
  }

  var requestId = gOCFAdapterRequestId++;
  var request = makeRequest(requestId, query, qos, endpoint, uri, userHandler);
  var result = native.ocf_adapter_initPost(request, oaPostResponseHandler);
  if (result) {
    gPostRequestList.push(request);
  }
  return result;
};

OCFAdapter.prototype.initPut = function (
  endpoint,
  uri,
  userHandler,
  query,
  qos
) {
  if (query === undefined) {
    query = '';
  }
  if (qos == undefined) {
    qos = 0; // HIGH_QOS
  }

  var requestId = gOCFAdapterRequestId++;
  var request = makeRequest(requestId, query, qos, endpoint, uri, userHandler);
  var result = native.ocf_adapter_initPut(request, oaPutResponseHandler);
  if (result) {
    gPutRequestList.push(request);
  }
  return result;
};

OCFAdapter.prototype.post = function () {
  var result = native.ocf_adapter_post();
  return result;
};

OCFAdapter.prototype.put = function () {
  var result = native.ocf_adapter_put();
  return result;
};

/**
 * OCF Device
 * @param {int} id OCF device's ID that is internally managed.
 * @param {string} uri URI of the OCF device
 * @param {string} resourceType OCF device's resource type
 * @param {string} name the OCF device's name
 * @param {string} specVersion version of the device's spec
 * @param {string} dataModelVersion version of the device's data model
 */
function OCFDevice(id, uri, resourceType, name, specVersion, dataModelVersion) {
  this.id = id;
  this.uri = uri;
  this.resourceType = resourceType;
  this.name = name;
  this.specVersion = specVersion;
  this.dataModelVersion = dataModelVersion;
}

/**
 * OCF Resource
 * @param {object} device OCF device that serves this resource
 * @param {string} name the resource's name
 * @param {string} uri URI of the resource
 * @param {array} types the array of resource's types.
 * each element's type is string.
 * @param {interfaceMasks} interfaceMasks the array of interface masks.
 * each element's type is string.
 */
function OCFResource(device, name, uri, types, interfaceMasks) {
  assert(device !== undefined && device.id !== undefined);

  this.device = device;
  this.name = name;
  this.uri = uri;
  this.types = types;
  this.interfaceMask = 0;
  for (var i = 0; i < interfaceMasks.length; i++) {
    this.interfaceMask |= interfaceMasks[i];
  }
  this.defaultInterfaceMask = interfaceMasks[0];
  this.isDiscoverable = undefined;
  this.periodSec = undefined;
  this.handlerIDMap = {};

  native.ocf_resource_constructor(this);
}

OCFResource.prototype.destroyer = function () {
  var handlerIDs = [];
  for (var i = 0; i < this.handlerIDMap.length; i++) {
    handlerIDs.push(this.handlerIDMap[i]);
  }
  native.ocf_resource_destroyer(this, handlerIDs);
};

OCFResource.prototype.setDiscoverable = function (isDiscoverable) {
  this.isDiscoverable = isDiscoverable;
  native.ocf_resource_setDiscoverable(this, isDiscoverable);
};

OCFResource.prototype.setPeriodicObservable = function (periodSec) {
  this.periodSec = periodSec;
  native.ocf_resource_setPeriodicObservable(this, periodSec);
};

var gOCFResourceHandlerId = 0;
OCFResource.prototype.setHandler = function (method, handler) {
  // Handler: void function(OCFRequest request, int method)
  var handlerId = gOCFResourceHandlerId;
  this.handlerIDMap[method] = handlerId;
  native.ocf_resource_setHandler(this, handlerId, method, handler);
  gOCFResourceHandlerId++;
};

module.exports = new OCF();
module.exports.OCF = OCF;
