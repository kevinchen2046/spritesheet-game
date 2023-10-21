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
import { EXTS, FileInfo, OptionsUse, TrimRect } from "./const";
import { Util } from "./util";

export class Generator {

	public async execUsePattern(filesOrPatterns: string, options: any) {
		let files = Util.pickfiles(filesOrPatterns);
		this.exec(files, options);
	}

	public async exec(filePaths: string[], options: any) {
		if (!filePaths || filePaths.length == 0) {
			throw new Error('no files specified');
		}
		let useoptions = Util.parseOptions(options);
		let files = filePaths.map(function (filepath) {
			var resolvePath = path.resolve(filepath);
			var name = "";
			if (useoptions.fullpath) {
				name = filepath.substring(0, filepath.lastIndexOf("."));
			} else {
				name = `${useoptions.prefix}${resolvePath.substring(resolvePath.lastIndexOf(path.sep) + 1, resolvePath.lastIndexOf('.'))}`;
			}
			return {
				path: resolvePath,
				name: name,
				extension: path.extname(filepath)
			};
		});

		if (!fs.existsSync(useoptions.out) && useoptions.out !== '') {
			fs.mkdirSync(useoptions.out);
		}


		files = await this.readFiles(files, useoptions);
		await this.getImagesSizes(files, useoptions);
		await this.determineCanvasSize(files, useoptions);
		await this.generateImage(files, useoptions);
		await this.generateData(files, useoptions);

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
				if (alpha > 1) {
					rect.x = x;
					break left;
				}
			}
		}

		top: for (let y = 0; y < bitmap.height; y++) {
			for (let x = 0; x < bitmap.width; x++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha > 1) {
					rect.y = y;
					break top;
				}
			}
		}
		right: for (let x = bitmap.width - 1; x >= 0; x--) {
			for (let y = 0; y < bitmap.height; y++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha > 1) {
					rect.width = Math.min(x - rect.x + 1, bitmap.width);
					break right;
				}
			}
		}
		bottom: for (let y = bitmap.height - 1; y >= 0; y--) {
			for (let x = 0; x < bitmap.width; x++) {
				let idx = (bitmap.width * y + x) << 2;
				let alpha = bitmap.data[idx + 3];
				if (alpha > 1) {
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
	async readFiles(files: { path: string, name: string, extension: string }[], userOptions: OptionsUse) {
		let result = [];
		for (let file of files) {
			let bitmap = await Bitmap.fromURL(file.path);
			if (userOptions.scale != undefined && userOptions.scale != 1) {
				if (Array.isArray(bitmap)) {
					bitmap = bitmap.map(v => v.scale(userOptions.scale));
				} else {
					bitmap = bitmap.scale(userOptions.scale);
				}
			}
			if (Array.isArray(bitmap)) {
				result.push(...bitmap.map((v, i) => Object.assign({}, file, { name: `${file.name}_${i}`, bitmap: v })))
			} else {
				result.push(Object.assign(file, { bitmap: bitmap }))
			}
		}
		let interval = userOptions.optqueue[0];
		let skip = userOptions.optqueue[1];
		let result1 = [];
		for (let i = 0; i < result.length; i += interval) {
			result1.push(result[i]);
			i += skip;
		}
		return result1;
	}

	/**
	 * 获取图片大小
	 */
	async getImagesSizes(files: FileInfo[], options: OptionsUse) {
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
			file.originalwidth = file.bitmap.width;
			file.originalheight = file.bitmap.height;
			file.width = file.bitmap.width + options.padding * 2;
			file.height = file.bitmap.height + options.padding * 2;
			file.outarea = file.width * file.height;
			file.trimmed = false;

			if (options.trim) {
				file.trim = this.__getTrimRect(file.bitmap);
				file.trimmed = forceTrimmed || (file.trim.width !== file.originalwidth || file.trim.height !== file.originalheight);

				file.width = file.trim.width + options.padding * 2;
				file.height = file.trim.height + options.padding * 2;
				file.outarea = file.width * file.height;
			}
		});
	};

	/**
	 * 使用选定的算法确定纹理大小
	 */
	determineCanvasSize(files: FileInfo[], options: OptionsUse) {
		// options.padding = 0;
		files.forEach((item) => {
			item['w'] = item.width;
			item['h'] = item.height;
		});

		// sort files based on the choosen options.sort method
		sorter(options.sort, files);

		let packfiles: FileInfo[] = [];
		files.forEach(v => {
			if (!packfiles.find(p => p.bitmap.hash == v.bitmap.hash)) {
				packfiles.push(v);
			} else {
				v.unpacked = true;
			}
		});

		//计算布局
		packing(options.algorithm, packfiles as any, options);

		files.forEach(v => {
			if (v.unpacked) {
				let r = packfiles.find(p => p.bitmap.hash == v.bitmap.hash);
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
	generateImage(files: FileInfo[], options: OptionsUse) {
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
					{ x: 0, y: 0, width: file.originalwidth, height: file.originalheight },
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
	generateData(files: FileInfo[], options: OptionsUse) {

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
			item.offsetX = 0;
			item.offsetY = 0;
			item.frameX = 0;
			item.frameY = 0;
			item.index = i;
			if (item.trim) {
				item.frameX = -item.trim.x;
				item.frameY = -item.trim.y;
				item.offsetX = item.trim.x;
				item.offsetY = item.trim.y;
				// item.trim.offsetX = (item.originalwidth / 2 - item.width / 2);
				// item.trim.offsetY = -(item.originalheight / 2 - item.height / 2);
				// item.trim.offsetX += item.width / 2 - item.originalwidth / 2;
				// item.trim.offsetY += -item.height / 2 + item.originalheight / 2;
				item.cocosOffsetX = item.trim.x + item.width / 2 - item.originalwidth / 2;
				item.cocosOffsetY = -item.trim.y - item.height / 2 + item.originalheight / 2;
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