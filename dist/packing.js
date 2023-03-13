"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeAlgorithms = void 0;
const binpacking = require("binpacking");
var TypeAlgorithms;
(function (TypeAlgorithms) {
    TypeAlgorithms[TypeAlgorithms["growingBinpacking"] = 0] = "growingBinpacking";
    TypeAlgorithms[TypeAlgorithms["binpacking"] = 1] = "binpacking";
    TypeAlgorithms[TypeAlgorithms["horizontal"] = 2] = "horizontal";
    TypeAlgorithms[TypeAlgorithms["vertical"] = 3] = "vertical";
})(TypeAlgorithms = exports.TypeAlgorithms || (exports.TypeAlgorithms = {}));
function growingBinpacking(files) {
    var packer = new binpacking.GrowingPacker();
    packer.fit(files);
    files.forEach(function (item) {
        item.x = item.fit.x;
        item.y = item.fit.y;
        delete item.fit;
        delete item.w;
        delete item.h;
    });
    return { width: packer.root.w, height: packer.root.h };
}
function binpackingStrict(files, width, height) {
    var packer = new binpacking.Packer(width, height);
    packer.fit(files);
    files.forEach(function (item) {
        item.x = item.fit ? item.fit.x : 0;
        item.y = item.fit ? item.fit.y : 0;
        delete item.fit;
        delete item.w;
        delete item.h;
    });
    return { width: packer.root.w, height: packer.root.h };
}
function vertical(files) {
    var y = 0;
    var maxWidth = 0;
    files.forEach(function (item) {
        item.x = 0;
        item.y = y;
        maxWidth = Math.max(maxWidth, item.width);
        y += item.height;
    });
    return { width: maxWidth, height: y };
}
function horizontal(files) {
    var x = 0;
    var maxHeight = 0;
    files.forEach(function (item) {
        item.x = x;
        item.y = 0;
        maxHeight = Math.max(maxHeight, item.height);
        x += item.width;
    });
    return { width: x, height: maxHeight };
}
function default_1(algorithm = TypeAlgorithms.growingBinpacking, files, options) {
    switch (algorithm) {
        case TypeAlgorithms.growingBinpacking:
            ({ width: options.width, height: options.height } = growingBinpacking(files));
            break;
        case TypeAlgorithms.binpacking:
            ({ width: options.width, height: options.height } = binpackingStrict(files, options.width, options.height));
            break;
        case TypeAlgorithms.horizontal:
            ({ width: options.width, height: options.height } = horizontal(files));
            break;
        case TypeAlgorithms.vertical:
            ({ width: options.width, height: options.height } = vertical(files));
            break;
    }
    if (options.validate) {
        validate(files, options);
    }
    return files;
}
exports.default = default_1;
;
function validate(files, options) {
    files.forEach(function (item) {
        if (item.x + item.width > options.width || item.y + item.height > options.height) {
            throw new Error("Can't fit all textures in given spritesheet size");
        }
    });
    var intersects = function (x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2) {
        return !(x_1 >= x_2 + width_2 || x_1 + width_1 <= x_2 || y_1 >= y_2 + height_2 || y_1 + height_1 <= y_2);
    };
    files.forEach(function (a) {
        files.forEach(function (b) {
            if (a !== b && intersects(a.x, a.y, a.width, a.height, b.x, b.y, b.width, b.height)) {
                console.log(a, b);
                throw new Error("Can't fit all textures in given spritesheet size");
            }
        });
    });
}
