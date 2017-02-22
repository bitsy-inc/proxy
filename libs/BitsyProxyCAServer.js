const http = require('http');
const fs = require('fs');

module.exports = BitsyProxyCA;

/**********************
 * BitsyProxyCAServer *
 **********************/

function BitsyProxyCA(port, caPath) {
    this._port = port;
    this._caPath = (caPath) ? caPath : './.http-mitm-proxy/certs/ca.pem';
}

/******************************
 * BitsyProxyCAServer Methods *
 ******************************/

BitsyProxyCA.prototype.start = function() {
    http.createServer(function(request, response) {
        response.writeHead(200, {
            'Content-Transfer-Encoding': 'binary',
            'Content-Disposition': 'attachment; filename="BitsyCA.pem"'
        });

        response.end(fs.readFileSync(this._caPath));
    }.bind(this)).listen(this._port);
}