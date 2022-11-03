// const fs = require('fs');
// const Mustache = require('mustache');
// const path = require('path');
// const PNG = require("pngjs").PNG;
// const packing = require('./packing/packing.js');
// const sorter = require('./sorter/sorter.js');
// const glob = require("glob");
// const hasher = require('node-object-hash')({ coerce: { set: true, symbol: true } });
import * as fs from "fs";
import * as path from "path";
import { Bitmap } from "./bitmap";
import * as Mustache from "mustache";
import * as glob from "glob";
import packing, { TypeAlgorithms } from "./packing";
import sorter from "./sorter";
import { FORMATS, FormatInfo } from "./format";
import * as colors from "colors";

type TrimRect = {
	x: number, y: number, width: number, height: number,
	frameX?: number,
	frameY?: number,
	offsetX?: number,
	offsetY?: number
}
type FileInfo = {
	path: string,
	name?: string,
	bitmap?: Bitmap,
	width?: number, height?: number,
	realwidth?: number, realheight?: number,
	trimmed?: boolean,
	area?: number,
	trim?: TrimRect,
	x?: number, y?: number,
	w?: number, h?: number,
	unpacked?: boolean,
	spritesheetWidth?: number,
	spritesheetHeight?: number,
	index?: number,
	frameX?: number,
	frameY?: number,
	offsetX?: number,
	offsetY?: number,
	cssName?: string,
	cssPriority?: number,
	isLast?: boolean
};

type Options = {
	format?: FormatInfo,
	name?: string,
	out?: string,
	fullpath?: boolean,
	square?: boolean,
	powerOfTwo?: boolean,
	/**像素边缘扩展 */
	edge?: number,
	extension?: string,
	trim?: boolean,
	algorithm?: TypeAlgorithms
	sort?: string,
	padding?: number,
	prefix?: string,
	divisibleByTwo?: boolean,
	cssOrder?: string,
	width?: number, height?: number,
	custom?: string,
	files?: FileInfo[]
}

let EXTS = [".png", ".jpg", ".jpeg", ".gif"];

export class Generator {

	private pickfiles(patterns: string | string[]) {
		patterns = Array.isArray(patterns) ? patterns : [patterns];
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
		if (results.length == patterns.length) {
			if (!results.every(v => !!EXTS.find(ext => ext == path.extname(v)))) {
				throw new Error('no files specified');
			}
		}
		return results;
	}

	private parserFormat(options: any) {
		if (options.custom) {
			if (fs.existsSync(options.custom)) {
				options.format = { template: fs.readFileSync(options.custom, "utf-8"), extension: path.extname(options.custom) }
				return;
			}
			console.log(`[!!] invalid custom format path:${options.custom},use default format.`.yellow)
		}
		options.format = FORMATS[options.format] || FORMATS['json'];
		let fpath = path.resolve(`${__dirname}/../templates/${options.format.template}`);
		if (!fs.existsSync(fpath)) {
			console.log(`[!!] check templates config:`.yellow, options.format);
		}
		options.format.template = fs.readFileSync(fpath, "utf-8")
	}

	private parseOptions(options: any) {
		options = options || {};
		// if (Array.isArray(options.format)) {
		// 	options.format = options.format.map(function (x: string) { return FORMATS[x] });
		// }else if (options.format || !options.customFormat) {
		// 	options.format = [FORMATS[options.format] || FORMATS['json']];
		// }
		this.parserFormat(options);
		// options.format = FORMATS[options.format] || FORMATS['json'];
		options.name = options.name || 'spritesheet';
		options.out = path.resolve(options.out || '.');
		options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
		options.square = options.hasOwnProperty('square') ? options.square : false;
		options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
		/**像素边缘扩展 */
		options.edge = options.hasOwnProperty('edge') ? parseInt(options.edge, 10) : 0;
		options.extension = options.hasOwnProperty('extension') ? options.extension : undefined;
		options.trim = options.hasOwnProperty('trim') ? options.trim : options.format[0].trim;
		options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : TypeAlgorithms.growingBinpacking;
		options.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
		options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
		options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
		options.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
		options.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;
		options.padding += options.edge;
		return options as Options;
	}

	public async exec(filesOrPatterns: string | string[], options: any) {
		let files = this.pickfiles(filesOrPatterns);
		if (!files || files.length == 0) {
			throw new Error('no files specified');
		}

		options = this.parseOptions(options);

		files = files.map(function (filepath) {
			var resolvePath = path.resolve(filepath);
			var name = "";
			if (options.fullpath) {
				name = filepath.substring(0, filepath.lastIndexOf("."));
			} else {
				name = `${options.prefix}${resolvePath.substring(resolvePath.lastIndexOf(path.sep) + 1, resolvePath.lastIndexOf('.'))}`;
			}
			return {
				path: resolvePath,
				name: name,
				extension: path.extname(filepath)
			};
		});

		if (!fs.existsSync(options.out) && options.out !== '') {
			fs.mkdirSync(options.out);
		}

		files = await this.readFiles(files);
		await this.getImagesSizes(files, options);
		await this.determineCanvasSize(files, options);
		await this.generateImage(files, options);
		await this.generateData(files, options);

		console.log('√ Spritesheet successfully generated.'.green);
	}


	/**
	  * 获取裁剪区域
	  * @param {Bitmap} bitmap 
	  */
	private __getTrimRect(bitmap: Bitmap) {
		let rect: TrimRect = { x: 0, y: 0, width: 0, height: 0 };
		left: for (let x = 0; x < bitmap.width; x++) {
			for (let y = 0; y < bitmap.height; y++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha != 0) {
					rect.x = x;
					break left;
				}
			}
		}

		top: for (let y = 0; y < bitmap.height; y++) {
			for (let x = 0; x < bitmap.width; x++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha != 0) {
					rect.y = y;
					break top;
				}
			}
		}
		right: for (let x = bitmap.width - 1; x >= 0; x--) {
			for (let y = 0; y < bitmap.height; y++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha != 0) {
					rect.width = Math.min(x - rect.x + 1, bitmap.width);
					break right;
				}
			}
		}
		bottom: for (let y = bitmap.height - 1; y >= 0; y--) {
			for (let x = 0; x < bitmap.width; x++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha != 0) {
					rect.height = Math.min(y - rect.y + 1, bitmap.height);
					break bottom;
				}
			}
		}
		return rect;
	}

	/** 
	 * 读取PNG图片
	 */
	async readFiles(files: { path: string, name: string, extension: string }[]) {
		let result = [];
		for (let file of files) {
			let bitmap = await Bitmap.fromURL(file.path);
			if (Array.isArray(bitmap)) {
				result.push(...bitmap.map((v, i) => Object.assign({}, file, { name: `${file.name}_${i}`, bitmap: v })))
			} else {
				result.push(Object.assign(file, { bitmap: bitmap }))
			}
		}
		return result;
	}

	/**
	 * 获取图片大小
	 */
	async getImagesSizes(files: FileInfo[], options: Options) {
		files.forEach(file => {
			var forceTrimmed = false;
			if (options.divisibleByTwo) {
				if (file.width & 1) {
					file.width += 1;
					forceTrimmed = true;
				}
				if (file.height & 1) {
					file.height += 1;
					forceTrimmed = true;
				}
			}
			file.realwidth = file.bitmap.width;
			file.realheight = file.bitmap.height;
			file.width = file.bitmap.width + options.padding * 2;
			file.height = file.bitmap.height + options.padding * 2;
			file.area = file.width * file.height;
			file.trimmed = false;

			if (options.trim) {
				file.trim = this.__getTrimRect(file.bitmap);
				file.trimmed = forceTrimmed || (file.trim.width !== file.realwidth || file.trim.height !== file.realheight);

				file.width = file.trim.width + options.padding * 2;
				file.height = file.trim.height + options.padding * 2;
				file.area = file.width * file.height;
			}
		});
	};

	/**
	 * 使用选定的算法确定纹理大小
	 */
	determineCanvasSize(files: FileInfo[], options: Options) {
		// options.padding = 0;
		files.forEach((item) => {
			item.w = item.width;
			item.h = item.height;
		});

		// sort files based on the choosen options.sort method
		sorter(options.sort, files);

		let packfiles = [];
		files.forEach(v => {
			if (!packfiles.find(p => p.hash == v.bitmap.hash)) {
				packfiles.push(v);
			} else {
				v.unpacked = true;
			}
		});

		packing(options.algorithm, packfiles, options);

		files.forEach(v => {
			if (v.unpacked) {
				let r = packfiles.find(p => p.hash == v.bitmap.hash);
				v.x = r.x;
				v.y = r.y;
				v.width = r.width;
				v.height = r.height;
			}
		});

		if (options.square) {
			options.width = options.height = Math.max(options.width, options.height);
		}

		if (options.powerOfTwo) {
			options.width = this.roundToPowerOfTwo(options.width);
			options.height = this.roundToPowerOfTwo(options.height);
		}
		return files;
	};

	/**
	 * 生成纹理
	 */
	generateImage(files: FileInfo[], options: Options) {
		let dst = new Bitmap(options.width, options.height);
		for (let file of files) {
			//适配之前的代码 - 将图片的值设回原始值
			// file.width = file.png.width + options.padding * 2;
			// file.height = file.png.height + options.padding * 2;
			// file.area = file.width * file.height;

			if (file.trimmed) {
				dst.draw(
					file.bitmap,
					file.trim,
					{ x: file.x, y: file.y },
					options.padding - options.edge,
					options.edge);
			} else {
				dst.draw(
					file.bitmap,
					{ x: 0, y: 0, width: file.realwidth, height: file.realheight },
					{ x: file.x, y: file.y },
					options.padding - options.edge,
					options.edge);
				//file.png.bitblt(dst, 0, 0, file.realwidth, file.realheight, file.x + options.padding, file.y + options.padding);
			}
			file.bitmap = null;
			delete file.bitmap;
		};
		dst.save(`${options.out}/${options.name}.png`);
	};

	/**
	 * 生成数据文件
	 */
	generateData(files: FileInfo[], options: Options) {

		files.sort((a, b) => a.name > b.name ? 1 : -1);

		// let formats = (Array.isArray(options.custom) ? options.custom : [options.custom]).concat(Array.isArray(options.format) ? options.format : [options.format]);
		// options.format.forEach(function (format, i) {
		// 	if (!format) return;

		let templateContent = options.format.template;
		let cssPriority = 0;
		let cssPriorityNormal = cssPriority++;
		let cssPriorityHover = cssPriority++;
		let cssPriorityActive = cssPriority++;

		// sort files based on the choosen options.sort method
		sorter(options.sort, files);

		options.files = files;
		options.files.forEach(function (item, i) {
			item.spritesheetWidth = options.width;
			item.spritesheetHeight = options.height;
			item.width -= options.padding * 2;
			item.height -= options.padding * 2;
			item.x += options.padding;
			item.y += options.padding;

			item.index = i;
			if (item.trim) {
				item.trim.frameX = -item.trim.x;
				item.trim.frameY = -item.trim.y;
				item.trim.offsetX = Math.floor(Math.abs(item.trim.x + item.width / 2 - item.trim.width / 2));
				item.trim.offsetY = Math.floor(Math.abs(item.trim.y + item.height / 2 - item.trim.height / 2));
			}
			item.cssName = item.name || "";
			if (item.cssName.indexOf("_hover") >= 0) {
				item.cssName = item.cssName.replace("_hover", ":hover");
				item.cssPriority = cssPriorityHover;
			}
			else if (item.cssName.indexOf("_active") >= 0) {
				item.cssName = item.cssName.replace("_active", ":active");
				item.cssPriority = cssPriorityActive;
			}
			else {
				item.cssPriority = cssPriorityNormal;
			}
		});

		function getIndexOfCssName(files, cssName) {
			for (var i = 0; i < files.length; ++i) {
				if (files[i].cssName === cssName) {
					return i;
				}
			}
			return -1;
		};

		if (options.cssOrder) {
			var order = options.cssOrder.replace(/\./g, "").split(",");
			order.forEach(function (cssName) {
				var index = getIndexOfCssName(files, cssName);
				if (index >= 0) {
					files[index].cssPriority = cssPriority++;
				}
				else {
					console.warn("could not find :" + cssName + "css name");
				}
			});
		}

		options.files.sort(function (a, b) {
			return a.cssPriority - b.cssPriority;
		});

		options.files[options.files.length - 1].isLast = true;

		var result = Mustache.render(templateContent, options);

		fs.writeFileSync(`${options.out}/${options.name}.${options.extension ? options.extension : options.format.extension}`, result, { encoding: "utf-8" });
		// function findPriority(property) {
		// 	var value = options[property];
		// 	var isArray = Array.isArray(value);
		// 	if (isArray) {
		// 		return i < value.length ? value[i] : format[property] || value[0];
		// 	}
		// 	return format[property] || value;
		// }
		// fs.writeFileSync(findPriority('out') + '/' + findPriority('name') + '.' + findPriority('extension'), result, { encoding: "utf-8" });
		// });
	};

	/**
	 * Rounds a given number to to next number which is power of two
	 * @param {number} value number to be rounded
	 * @return {number} rounded number
	 */
	roundToPowerOfTwo(value) {
		var powers = 2;
		while (value > powers) {
			powers *= 2;
		}
		return powers;
	}
}