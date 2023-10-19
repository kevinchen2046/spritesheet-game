"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const packing_1 = require("./packing");
const format_1 = require("./format");
const const_1 = require("./const");
class Util {
    static pickfiles(folderOrPattern) {
        let patterns = [];
        if (folderOrPattern.charAt(0) == "[" && folderOrPattern.charAt(folderOrPattern.length - 1) == "]") {
            folderOrPattern = folderOrPattern.substring(1, folderOrPattern.length - 1);
        }
        if (folderOrPattern.indexOf(",") >= 0) {
            patterns = folderOrPattern.split(",");
        }
        else {
            patterns = [folderOrPattern];
        }
        patterns = patterns.filter(v => !!v);
        let results = [];
        patterns.forEach(pattern => {
            if (!!path.extname(pattern)) {
                if (fs.existsSync(pattern)) {
                    results.push(pattern);
                    return;
                }
                results.push(...glob.sync(pattern));
                return;
            }
            if (fs.existsSync(pattern)) {
                let files = fs.readdirSync(pattern);
                results.push(...files.map(v => `${pattern}/${v}`));
            }
        });
        if (results.length == folderOrPattern.length) {
            if (!results.every(v => !!const_1.EXTS.find(ext => ext == path.extname(v)))) {
                throw new Error('no files specified');
            }
        }
        return results;
    }
    static parseOptions(options) {
        options = options || {};
        let useOptions = {};
        if (options.custom) {
            if (fs.existsSync(options.custom)) {
                useOptions.format = { template: fs.readFileSync(options.custom, "utf-8"), extension: path.extname(options.custom) };
                return;
            }
            console.log(`[!!] invalid custom format path:${options.custom},use default format.`.yellow);
        }
        useOptions.format = format_1.FORMATS[options.format] || format_1.FORMATS['json'];
        let fpath = path.resolve(`${__dirname}/../templates/${useOptions.format.template}`);
        if (!fs.existsSync(fpath)) {
            console.log(`[!!] check templates config:`.yellow, useOptions.format);
        }
        useOptions.format.template = fs.readFileSync(fpath, "utf-8");
        useOptions.name = options.name || 'spritesheet';
        useOptions.out = path.resolve(options.out || '.');
        useOptions.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
        useOptions.square = options.hasOwnProperty('square') ? options.square : false;
        useOptions.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
        useOptions.scale = options.hasOwnProperty('scale') ? parseFloat(options.scale) : 1;
        useOptions.edge = options.hasOwnProperty('edge') ? parseInt(options.edge) : 0;
        useOptions.extension = options.hasOwnProperty('extension') ? options.extension : undefined;
        useOptions.trim = options.hasOwnProperty('trim') ? options.trim == "true" : useOptions.format.trim;
        useOptions.algorithm = (options.hasOwnProperty('algorithm') ? options.algorithm : packing_1.TypeAlgorithms.growingBinpacking);
        useOptions.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
        useOptions.padding = options.hasOwnProperty('padding') ? parseInt(options.padding) : 2;
        useOptions.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
        useOptions.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
        useOptions.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;
        useOptions.padding += useOptions.edge;
        return useOptions;
    }
}
exports.Util = Util;
