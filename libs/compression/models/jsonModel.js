/*
 * Methods required for various portions of the compression & decompression process for JSON payloads.
 */

module.exports.objectData = objectData;
module.exports.objectStructure = objectStructure;
module.exports.rebuildObject = rebuildObject;

/***********
 * Methods *
 ***********/

function objectData(object) {
    if (object === null) {
        return null;
    }

    if (Array.isArray(object)) {
        var output = [];

        for (var i = 0; i < object.length; i++) {
            output.push(objectData(object[i]));
        }

        return output;
    }

    if (typeof object === 'object') {
        var output = [];
        var sortedObjectKeys = sortObjectKeys(object);

        for (var i = 0; i < sortedObjectKeys.length; i++) {
            output.push(objectData(object[sortedObjectKeys[i]]));
        }

        return output;
    }

    return object;
}

function objectStructure(object) {
    if (object === null) {
        return null;
    }

    if (Array.isArray(object)) {
        var output = [];

        for (var i = 0; i < object.length; i++) {
            output.push(objectStructure(object[i]));
        }

        return output;
    }

    if (typeof(object) === 'object') {
        var output = {};
        var sortedObjectKeys = sortObjectKeys(object);

        for (var i = 0; i < sortedObjectKeys.length; i++) {
            var key = sortedObjectKeys[i];
            var value = object[key];

            output[key] = objectStructure(value);
        }

        return output;
    }

    return [];
}

function rebuildObject(structure, data) {
    if (structure === null || data === null) {
        return null;
    }

    if (Array.isArray(structure) && structure.length === 0) {
        return data;
    }

    if (Array.isArray(structure)) {
        var output = [];

        for (var i = 0; i < data.length; i++) {
            output.push(rebuildObject(structure[i], data[i]));
        }

        return output;
    }

    if (typeof structure === 'object') {
        var output = {};
        var sortedObjectKeys = sortObjectKeys(structure);

        for (var i = 0; i < sortedObjectKeys.length; i++) {
            output[sortedObjectKeys[i]] = rebuildObject(structure[sortedObjectKeys[i]], data[i]);
        }

        return output;
    }

    return data;
}

/***********
 * Helpers *
 ***********/

function sortObjectKeys(object) {
    return Object.keys(object).sort(function(keyA, keyB) {
        if (keyA < keyB) {
            return -1;
        }

        if (keyA > keyB) {
            return 1;
        }

        return 0;
    });
}