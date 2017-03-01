const Proxy = require('http-mitm-proxy');
const path = require('path');
const url = require('url');

module.exports = BitsyProxyServer;

/********************
 * BitsyProxyServer *
 ********************/

function BitsyProxyServer(port) {
    this._proxy = Proxy();
    this._port  = port;

    this._compressionHandlers   = {};
    this._decompressionHandlers = {};
    this._silenceServerStatus   = false;
    this._targetHostnameRegexes = [ '.*' ];
    this._useGunzip             = true;
    this._useWildcard           = true;
}

/****************************
 * BitsyProxyServer Methods *
 ****************************/

BitsyProxyServer.prototype.start = function() {
    this._setupMiddlewares();

    this._proxy.onRequest(this._proxyRequestCallback.bind(this));

    this._proxy.listen({
        port: this._port,
        silent: this._silenceServerStatus
    });
}

BitsyProxyServer.prototype._proxyRequestCallback = function(ctx, callback) {
    var bitsyProxyServer = this;
    var responseBodyChunks = [];

    for (var i = bitsyProxyServer._targetHostnameRegexes.length - 1; i >= 0; i--) {
        var targetHostnameRegex = bitsyProxyServer._targetHostnameRegexes[i];

        if (ctx.proxyToServerRequestOptions.host.match(targetHostnameRegex) !== null) {
            break;
        } else if (i === 0) {
            return callback();
        }
    }

    ctx.onResponseData(function(ctx, chunk, callback) {
        responseBodyChunks.push(chunk);

        // This prevents automatic writing of data chunks to the client.
        // We defer this to the onResponseEnd callback.
        callback(null, null);
    });

    ctx.onResponseEnd(function(ctx, callback) {
        var requestHost = ctx.proxyToServerRequestOptions.host;
        var requestPath = ctx.proxyToServerRequestOptions.path;
        var requestEndpoint = path.join(requestHost, url.parse(requestPath).pathname);

        var responseHeaders = ctx.serverToProxyResponse.headers;
        var responseBody = Buffer.concat(responseBodyChunks);
        var responseContentType = ctx.serverToProxyResponse.headers['content-type'];

        // Hook! ==

        var compressionHandler = bitsyProxyServer._compressionHandlers[responseContentType];
        var decompressionHandler = bitsyProxyServer._decompressionHandlers[responseContentType];

        if (compressionHandler && decompressionHandler) {
            var compressedResponse = compressionHandler(requestEndpoint, responseHeaders, responseBody);
            var decompressedResponseBody = decompressionHandler(requestEndpoint, responseHeaders, compressedResponse);

            //if (responseBody === decompressedResponseBody) {
                responseBody = decompressedResponseBody
            //} else {
            //    console.error('FAILED TO COMPRESS & DECOMPRESS');
            //}
        }

        // ==

        ctx.proxyToClientResponse.write(responseBody);

        return callback();
    });

    callback();
}

BitsyProxyServer.prototype._setupMiddlewares = function() {
    if (this._useGunzip) {
        this._proxy.use(Proxy.gunzip);
    }

    if (this._useWildcard) {
        this._proxy.use(Proxy.wildcard);
    }
}

/****************************
 * BitsyProxyServer Setters *
 ****************************/

BitsyProxyServer.prototype.addCompressionHandler = function(contentType, compressionHandler) {
    if (Array.isArray(contentType)) {
        for (var i = 0; i < contentType.length; i++) {
            this._compressionHandlers[contentType[i]] = compressionHandler;
        }
    } else {
        this._compressionHandlers[contentType] = compressionHandler;
    }
}

BitsyProxyServer.prototype.addDecompressionHandler = function(contentType, decompressionHandler) {
    if (Array.isArray(contentType)) {
        for (var i = 0; i < contentType.length; i++) {
            this._decompressionHandlers[contentType[i]] = decompressionHandler;
        }
    } else {
        this._decompressionHandlers[contentType] = decompressionHandler;
    }
}

BitsyProxyServer.prototype.setSilenceServerStatus = function(silenceServerStatus) {
    this._silenceServerStatus = silenceServerStatus;
}

BitsyProxyServer.prototype.setTargetHostnameRegexes = function(targetHostnameRegexes) {
    this._targetHostnameRegexes = targetHostnameRegexes;
}

BitsyProxyServer.prototype.setUseGunzip = function(useGunzip) {
    this._useGunzip = useGunzip;
}

BitsyProxyServer.prototype.setUseWildcard = function(useWildcard) {
    this._useWildcard = useWildcard;
}