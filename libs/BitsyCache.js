const fs = require('fs');
const LRU = require('lru-cache');
const cacheDirectory = './.bitsy-cache';
const cacheExtension = 'bcf';

module.exports = BitsyCache;

/**************
 * BitsyCache *
 **************/

function BitsyCache(cacheSizeBytes) {
    this._cache = LRU({
        max: cacheSizeBytes,
        length: function(value, key) {
            return value.length;
        },
        dispose: function(key, value) {
            this._addToDisk(key, value);
        }.bind(this)
    });

    this._disk = {};

    // Disk Cache Directory Setup
    if (!fs.existsSync(cacheDirectory)) {
        fs.mkdirSync(cacheDirectory);
    }
}

/**********************
 * BitsyCache Methods *
 **********************/

BitsyCache.prototype.add = function(key, value) {
    this._cache.set(key, value);
}

BitsyCache.prototype.get = function(key) {
    var value = this._cache.get(key);

    if (!value) {
        value = this._removeFromDisk(key, true);

        if (value) {
            this._cache.set(key, value);
        }
    }

    return value;
}

BitsyCache.prototype._addToDisk = function(key, value) {
    var filePath = cacheDirectory + `/${key}.${cacheExtension}`;

    fs.writeFileSync(filePath, value);

    this._disk[key] = filePath;
}

BitsyCache.prototype._removeFromDisk = function(key, returnContents) {
    var filePath = this._disk[key];
    var output = undefined;

    if (!filePath) {
        return;
    }

    if (returnContents) {
        output = fs.readFileSync(filePath);
    }

    fs.unlink(filePath);
    delete this._disk[key];

    return output;
}