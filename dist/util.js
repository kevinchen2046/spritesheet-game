"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
const fs = require("fs");
const path = require("path");
const glob = require("glob");
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
        let useOptions = Object.assign({}, options);
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
        useOptions.out = path.resolve(options.out);
        useOptions.optqueue = options.optqueue.split("-").map(v => parseInt(v));
        useOptions.padding += useOptions.edge;
        return useOptions;
    }
}
exports.Util = Util;
