const fs = require('fs');
const Mustache = require('mustache');
const path = require('path');
const PNG = require("pngjs").PNG;
const packing = require('./packing/packing.js');
const sorter = require('./sorter/sorter.js');
const glob = require("glob");
const hasher = require('node-object-hash')({ coerce: { set: true, symbol: true } });
const FORMATS = {
	'json': { template: 'json.template', extension: 'json', trim: false },
	'yaml': { template: 'yaml.template', extension: 'yaml', trim: false },
	'jsonarray': { template: 'jsonarray.template', extension: 'json', trim: false },
	'pixi.js': { template: 'json.template', extension: 'json', trim: true },
	'starling': { template: 'starling.template', extension: 'xml', trim: true },
	'sparrow': { template: 'starling.template', extension: 'xml', trim: true },
	'easel.js': { template: 'easeljs.template', extension: 'json', trim: false },
	'egret': { template: 'egret.template', extension: 'json', trim: false },
	'zebkit': { template: 'zebkit.template', extension: 'js', trim: false },
	'cocos2d': { template: 'cocos2d.template', extension: 'plist', trim: false },
	'cocos2d-v3': { template: 'cocos2d-v3.template', extension: 'plist', trim: false },
	'css': { template: 'css.template', extension: 'css', trim: false }
};

module.exports = class Generator {

	async exec(folderpatterns, options) {
		let patterns = Array.isArray(folderpatterns) ? folderpatterns : [folderpatterns];
		this.files = [];
		patterns.forEach(pattern => {
			this.files.push(...glob.sync(pattern).map(v => ({ path: v })));
		});
		if (this.files.length == patterns.length) {
			if (!this.files.every(v => v.path.indexOf(".png") >= 0)) {
				throw new Error('no files specified');
			}
		}
		this.options = options = options || {};
		if (Array.isArray(options.format)) {
			options.format = options.format.map(function (x) { return FORMATS[x] });
		}
		else if (options.format || !options.customFormat) {
			options.format = [FORMATS[options.format] || FORMATS['json']];
		}
		options.name = options.name || 'spritesheet';
		options.spritesheetName = options.name;
		options.path = path.resolve(options.path || '.');
		options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
		options.square = options.hasOwnProperty('square') ? options.square : false;
		options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
		options.extension = options.hasOwnProperty('extension') ? options.extension : options.format[0].extension;
		options.trim = options.hasOwnProperty('trim') ? options.trim : options.format[0].trim;
		options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : 'growing-binpacking';
		options.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
		options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
		options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
		options.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
		options.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;

		this.files = this.files.map(function (file, index) {
			var filepath = file.path;
			var resolvedItem = path.resolve(filepath);
			var name = "";
			if (options.fullpath) {
				name = filepath.substring(0, filepath.lastIndexOf("."));
			}
			else {
				name = options.prefix + resolvedItem.substring(resolvedItem.lastIndexOf(path.sep) + 1, resolvedItem.lastIndexOf('.'));
			}
			return {
				index: index,
				path: resolvedItem,
				name: name,
				extension: path.extname(resolvedItem)
			};
		});
		if (!fs.existsSync(options.path) && options.path !== '') fs.mkdirSync(options.path);

		await this.readImages();
		await this.getImagesSizes();
		await this.determineCanvasSize();
		await this.generateImage();
		await this.generateData();
		console.log('**Spritesheet successfully generated**');
	}

	/**
	 * 解析PNG文件
	 * @returns {Promise<PNG>}
	 */
	__parserPng(buffer) {
		return new Promise((reslove, reject) => {
			new PNG({ filterType: 4 }).parse(buffer, function (error, png) {
				if (error) {
					reject(error);
					return;
				}
				reslove(png);
			});
		});
	}

	/**
	  * 获取裁剪区域
	  * @param {PNG} png 
	  */
	__getTrimRect(png) {
		let rect = { x: 0, y: 0, width: 0, height: 0 };
		left: for (let x = 0; x < png.width; x++) {
			for (let y = 0; y < png.height; y++) {
				let idx = (png.width * y + x) << 2;
				let alpha = png.data[idx + 3];
				if (alpha != 0) {
					rect.x = x;
					break left;
				}
			}
		}

		top: for (let y = 0; y < png.height; y++) {
			for (let x = 0; x < png.width; x++) {
				let idx = (png.width * y + x) << 2;
				let alpha = png.data[idx + 3];
				if (alpha != 0) {
					rect.y = y;
					break top;
				}
			}
		}
		right: for (let x = png.width - 1; x >= 0; x--) {
			for (let y = 0; y < png.height; y++) {
				let idx = (png.width * y + x) << 2;
				let alpha = png.data[idx + 3];
				if (alpha != 0) {
					rect.width = Math.min(x - rect.x + 1, png.width);
					break right;
				}
			}
		}
		bottom: for (let y = png.height - 1; y >= 0; y--) {
			for (let x = 0; x < png.width; x++) {
				let idx = (png.width * y + x) << 2;
				let alpha = png.data[idx + 3];
				if (alpha != 0) {
					rect.height = Math.min(y - rect.y + 1, png.height);
					break bottom;
				}
			}
		}
		return rect;
	}

	async __readImage(path) {
		return await this.__parserPng(fs.readFileSync(path));
	}

	/** 
	 * 读取PNG图片
	 */
	async readImages() {
		for (let file of this.files) {
			file.png = await this.__readImage(file.path);
			file.hash= hasher.hash(file.png.data);
		}
	}

	/**
	 * 获取图片大小
	 */
	async getImagesSizes() {
		this.files.forEach(file => {
			var forceTrimmed = false;
			if (this.options.divisibleByTwo) {
				if (file.width & 1) {
					file.width += 1;
					forceTrimmed = true;
				}
				if (file.height & 1) {
					file.height += 1;
					forceTrimmed = true;
				}
			}
			file.realwidth = file.png.width;
			file.realheight = file.png.height;
			file.width = file.png.width + this.options.padding * 2;
			file.height = file.png.height + this.options.padding * 2;
			file.area = file.width * file.height;
			file.trimmed = false;

			if (this.options.trim) {
				file.trim = this.__getTrimRect(file.png);
				file.trimmed = forceTrimmed || (file.trim.width !== file.realwidth || file.trim.height !== file.realheight);

				file.width = file.trim.width + this.options.padding * 2;
				file.height = file.trim.height + this.options.padding * 2;
				file.area = file.width * file.height;
			}
		});
	};

	/**
	 * 使用选定的算法确定纹理大小
	 */
	determineCanvasSize() {
		this.files.forEach(function (item) {
			item.w = item.width;
			item.h = item.height;
		});

		// sort files based on the choosen options.sort method
		sorter.run(this.options.sort, this.files);

		let packfiles=[];
		this.files.forEach(v=>{
			if(!packfiles.find(p=>p.hash==v.hash)){
				packfiles.push(v);
			}else{
				v.unpacked=true;
			}
		});
		packing.pack(this.options.algorithm, packfiles, this.options);

		this.files.forEach(v=>{
			if(v.unpacked){
				let r=packfiles.find(p=>p.hash==v.hash);
				v.x=r.x;
				v.y=r.y;
				v.width=r.width;
				v.height=r.height;
			}
		});

		if (this.options.square) {
			this.options.width = this.options.height = Math.max(this.options.width, this.options.height);
		}

		if (this.options.powerOfTwo) {
			this.options.width = this.roundToPowerOfTwo(this.options.width);
			this.options.height = this.roundToPowerOfTwo(this.options.height);
		}
	};

	__drawImage(file, dst, padding) {
		let png = file.png;
		let rect = file.trim;

		let dstx = file.x + padding;
		let dsty = file.y + padding;

		let bottom = rect.y + rect.height;
		let right = rect.x + rect.width;
		for (let y = rect.y; y < bottom; y++) {
			for (let x = rect.x; x < right; x++) {
				let idx = (png.width * y + x) << 2;
				let r = png.data[idx];
				let g = png.data[idx + 1];
				let b = png.data[idx + 2];
				let alpha = png.data[idx + 3];
				let idx2 = (dst.width * (y - rect.y + dsty) + (x - rect.x + dstx)) << 2;
				dst.data[idx2] = r;
				dst.data[idx2 + 1] = g;
				dst.data[idx2 + 2] = b;
				dst.data[idx2 + 3] = alpha;
			}
		}
	}

	/**
	 * 写图片
	 * @param {PNG} png 
	 * @param {string} path 
	 */
	__writeImage(png, path) {
		return png.pack().pipe(fs.createWriteStream(path));
	}

	/**
	 * 生成纹理
	 */
	generateImage() {
		let dst = new PNG({ width: this.options.width, height: this.options.height });
		for (let file of this.files) {
			//适配之前的代码 - 将图片的值设回原始值
			// file.width = file.png.width + this.options.padding * 2;
			// file.height = file.png.height + this.options.padding * 2;
			// file.area = file.width * file.height;

			if (file.trimmed) {
				this.__drawImage(file, dst, this.options.padding)
			} else {
				file.png.bitblt(dst, 0, 0, file.realwidth, file.realheight, file.x + this.options.padding, file.y + this.options.padding);
			}
			file.png = null;
			delete file.png;
		};
		this.__writeImage(dst, `${this.options.path}/${this.options.name}.png`);
	};

	/**
	 * 生成数据文件
	 */
	generateData() {
		let options = this.options;
		let files = this.files;
		let formats = (Array.isArray(options.customFormat) ? options.customFormat : [options.customFormat]).concat(Array.isArray(options.format) ? options.format : [options.format]);
		formats.forEach(function (format, i) {
			if (!format) return;
			let path = typeof format === 'string' ? format : __dirname + '/templates/' + format.template;
			let templateContent = fs.readFileSync(path, 'utf-8');
			let cssPriority = 0;
			let cssPriorityNormal = cssPriority++;
			let cssPriorityHover = cssPriority++;
			let cssPriorityActive = cssPriority++;

			// sort files based on the choosen options.sort method
			sorter.run(options.sort, files);

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
			function findPriority(property) {
				var value = options[property];
				var isArray = Array.isArray(value);
				if (isArray) {
					return i < value.length ? value[i] : format[property] || value[0];
				}
				return format[property] || value;
			}
			fs.writeFileSync(findPriority('path') + '/' + findPriority('name') + '.' + findPriority('extension'), result, { encoding: "utf-8" });
		});
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