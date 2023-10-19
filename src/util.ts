import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import { TypeAlgorithms } from "./packing";
import { FORMATS, FormatInfo } from "./format";
import { EXTS, Options, OptionsUse } from "./const";


export class Util {
    static pickfiles(folderOrPattern: string) {
		let patterns = [];
		if (folderOrPattern.charAt(0) == "[" && folderOrPattern.charAt(folderOrPattern.length - 1) == "]") {
			folderOrPattern = folderOrPattern.substring(1, folderOrPattern.length - 1);
		}
		if (folderOrPattern.indexOf(",") >= 0) {
			patterns = folderOrPattern.split(",");
		} else {
			patterns = [folderOrPattern];
		}
		patterns=patterns.filter(v=>!!v);
		let results = [];
		patterns.forEach(pattern => {
			if (!!path.extname(pattern)) {
				if (fs.existsSync(pattern)) {
					results.push(pattern)
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
			if (!results.every(v => !!EXTS.find(ext => ext == path.extname(v)))) {
				throw new Error('no files specified');
			}
		}
		return results;
	}

	static parseOptions(options: Options) {
		options = options || {};
		// if (Array.isArray(options.format)) {
		// 	options.format = options.format.map(function (x: string) { return FORMATS[x] });
		// }else if (options.format || !options.customFormat) {
		// 	options.format = [FORMATS[options.format] || FORMATS['json']];
		// }
		let useOptions: OptionsUse = {};
		if (options.custom) {
			if (fs.existsSync(options.custom)) {
				useOptions.format = { template: fs.readFileSync(options.custom, "utf-8"), extension: path.extname(options.custom) }
				return;
			}
			console.log(`[!!] invalid custom format path:${options.custom},use default format.`.yellow)
		}
		useOptions.format = FORMATS[options.format] || FORMATS['json'];
		let fpath = path.resolve(`${__dirname}/../templates/${useOptions.format.template}`);
		if (!fs.existsSync(fpath)) {
			console.log(`[!!] check templates config:`.yellow, useOptions.format);
		}
		useOptions.format.template = fs.readFileSync(fpath, "utf-8")
		useOptions.name = options.name || 'spritesheet';
		useOptions.out = path.resolve(options.out || '.');
		useOptions.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
		useOptions.square = options.hasOwnProperty('square') ? options.square : false;
		useOptions.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
		useOptions.scale = options.hasOwnProperty('scale') ? parseFloat(options.scale) : 1;
		/**像素边缘扩展 */
		useOptions.edge = options.hasOwnProperty('edge') ? parseInt(options.edge) : 0;
		useOptions.extension = options.hasOwnProperty('extension') ? options.extension : undefined;
		useOptions.trim = options.hasOwnProperty('trim') ? options.trim == "true" : useOptions.format.trim;
		useOptions.algorithm = (options.hasOwnProperty('algorithm') ? options.algorithm : TypeAlgorithms.growingBinpacking) as TypeAlgorithms;
		useOptions.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
		useOptions.padding = options.hasOwnProperty('padding') ? parseInt(options.padding) : 2;
		useOptions.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
		useOptions.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
		useOptions.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;
		useOptions.padding += useOptions.edge;
		// console.log(options.hasOwnProperty('padding'),useOptions.padding)
		return useOptions as OptionsUse;
	}
}