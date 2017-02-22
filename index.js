/*********
 * Setup *
 *********/

const BitsyProxyServer = require('./libs/BitsyProxyServer');
const jsonModel = require('./libs/compression/models/jsonModel');
const http = require('http');
const crc = require('crc');
const zlib = require('zlib');

/*
var input = {
    "a" : ["1", {
        "test" : "a"
    }],
    "test" : {},
    "somethingmore": [
        {
            "something": []
        },
        [
            1,2,3
        ],
        {
            "else": {}
        }
    ],
    "b": true
};


var st = jsonModel.objectStructure(input);
var data = jsonModel.objectData(input);
var rebuilt = jsonModel.rebuildObject(st, data);

console.log(st);
console.log(data);
console.log();
console.log(input);
console.log(rebuilt);

return;
*/



var targetContentTypes = [
    'application/json; charset=UTF-8',
    'application/x-javascript; charset=utf-8',
    'application/json',
    'application/x-javascript'
];

var structures = {};
var dictionaries = {};

//var jsonPrelude = 'for (;;);';
var jsonPrelude = '';

var rollingBytesSaved = 0;
var rollingGzipBytesSaved = 0;

var proxy = new BitsyProxyServer(8080);

/********
 * Main *
 ********/

proxy.setSilenceServerStatus(true);
proxy.setTargetHostnameRegexes(['instagram.com']);

proxy.addCompressionHandler(targetContentTypes, function(requestEndpoint, responseHeaders, responseBody) {
    var originalResponse = responseBody.toString().replace(jsonPrelude, '');
    var response = parseJson(originalResponse);

    if (!response) {
        return {
            compressed: false,
            responseBody: responseBody
        }; // JSON couldn't parse.
    }

    var responseStructure = jsonModel.objectStructure(response);
    var responseStructureHash = crc.crc32(JSON.stringify(responseStructure));

    if (!structures[responseStructureHash]) {
        structures[responseStructureHash] = responseStructure;

        return {
            compressed: false,
            responseBody: responseBody
        }
    }

    var compressedResponse = jsonModel.objectData(response);

    // DICTIONARY ==

    // ==

    var JSONcompressedResponse = JSON.stringify(compressedResponse);

    return {
        compressed: true,
        originalResponseBody: originalResponse,
        responseStructureHash: responseStructureHash,
        responseBody: zlib.deflateSync(JSONcompressedResponse).toString('base64')
    }
});

proxy.addDecompressionHandler(targetContentTypes, function(requestEndpoint, responseHeaders, compressedResponseBody) {
    if (!compressedResponseBody.compressed) {
        return compressedResponseBody.responseBody;
    }

    // LOGGING ===
    var originalResponseBodyLength = compressedResponseBody.originalResponseBody.length;
    var originalResponseBodyGzipLength = zlib.gzipSync(compressedResponseBody.originalResponseBody).toString('base64').length;
    var responseBody = compressedResponseBody.responseBody;
    var responseBodyLength = responseBody.length;
    var bytesSaved = originalResponseBodyLength - responseBodyLength;
    var gzippedBytesSaved = originalResponseBodyGzipLength - responseBodyLength;

    rollingBytesSaved += bytesSaved;
    rollingGzipBytesSaved += gzippedBytesSaved;

    console.log('===========================');
    console.log('Request To Endpoint: ', requestEndpoint);
    console.log();
    console.log('Original Response Size:', originalResponseBodyLength, 'Bytes');
    console.log('GZIP Response Size: ', originalResponseBodyGzipLength);
    console.log('Bitsy Response Size:', responseBodyLength, 'Bytes');
    console.log();
    console.log('Saved Over Original:', bytesSaved,'Bytes!');
    console.log('Saved Over GZIP:', gzippedBytesSaved, 'Bytes!');
    console.log()
    console.log('Since Proxy Start, Over Original, In Total:', rollingBytesSaved, 'Bytes Saved!');
    console.log('Since Proxy Start, Over GZIP, In Total:', rollingGzipBytesSaved, 'Bytes Saved!');
    console.log()
    console.log('Compression Savings Over Original: ', (1 - responseBodyLength / originalResponseBodyLength) * 100 + '%');
    console.log('Compression Savings Over GZIP: ', (1 - responseBodyLength / originalResponseBodyGzipLength) * 100 + '%');
    // ===

    var rebuiltResponse = jsonModel.rebuildObject(
        structures[compressedResponseBody.responseStructureHash],
        JSON.parse(zlib.inflateSync(new Buffer(responseBody, 'base64')).toString())
    );

    // hacky for now
    var decompressedResponse = jsonPrelude + JSON.stringify(rebuiltResponse);

    return decompressedResponse;
});


proxy.start();


/***********
 * Helpers *
 ***********/

function parseJson(json) {
    var obj;

    try {
        obj = JSON.parse(json);
    } catch (e) {
        console.log();
        console.log('COULD NOT PARSE JSON:', json.toString().substr(0, 200), ' (...) ');
        obj = false;
    }

    return obj;
}
