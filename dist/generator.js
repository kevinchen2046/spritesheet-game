"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generator = void 0;
const fs = require("fs");
const path = require("path");
const bitmap_1 = require("./bitmap");
const Mustache = require("mustache");
const glob = require("glob");
const packing_1 = require("./packing");
const sorter_1 = require("./sorter");
const format_1 = require("./format");
let EXTS = [".png", ".jpg", ".jpeg", ".gif"];
class Generator {
    pickfiles(patterns) {
        patterns = Array.isArray(patterns) ? patterns : [patterns];
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
        if (results.length == patterns.length) {
            if (!results.every(v => !!EXTS.find(ext => ext == path.extname(v)))) {
                throw new Error('no files specified');
            }
        }
        return results;
    }
    parserFormat(options) {
        if (options.custom) {
            if (fs.existsSync(options.custom)) {
                options.format = { template: fs.readFileSync(options.custom, "utf-8"), extension: path.extname(options.custom) };
                return;
            }
            console.log(`[!!] invalid custom format path:${options.custom},use default format.`.yellow);
        }
        options.format = format_1.FORMATS[options.format] || format_1.FORMATS['json'];
        let fpath = path.resolve(`${__dirname}/../templates/${options.format.template}`);
        if (!fs.existsSync(fpath)) {
            console.log(`[!!] check templates config:`.yellow, options.format);
        }
        options.format.template = fs.readFileSync(fpath, "utf-8");
    }
    parseOptions(options) {
        options = options || {};
        this.parserFormat(options);
        options.name = options.name || 'spritesheet';
        options.out = path.resolve(options.out || '.');
        options.fullpath = options.hasOwnProperty('fullpath') ? options.fullpath : false;
        options.square = options.hasOwnProperty('square') ? options.square : false;
        options.powerOfTwo = options.hasOwnProperty('powerOfTwo') ? options.powerOfTwo : false;
        options.edge = options.hasOwnProperty('edge') ? parseInt(options.edge, 10) : 0;
        options.extension = options.hasOwnProperty('extension') ? options.extension : undefined;
        options.trim = options.hasOwnProperty('trim') ? options.trim : options.format[0].trim;
        options.algorithm = options.hasOwnProperty('algorithm') ? options.algorithm : packing_1.TypeAlgorithms.growingBinpacking;
        options.sort = options.hasOwnProperty('sort') ? options.sort : 'maxside';
        options.padding = options.hasOwnProperty('padding') ? parseInt(options.padding, 10) : 0;
        options.prefix = options.hasOwnProperty('prefix') ? options.prefix : '';
        options.divisibleByTwo = options.hasOwnProperty('divisibleByTwo') ? options.divisibleByTwo : false;
        options.cssOrder = options.hasOwnProperty('cssOrder') ? options.cssOrder : null;
        options.padding += options.edge;
        return options;
    }
    exec(filesOrPatterns, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
                else {
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
            files = yield this.readFiles(files);
            yield this.getImagesSizes(files, options);
            yield this.determineCanvasSize(files, options);
            yield this.generateImage(files, options);
            yield this.generateData(files, options);
            console.log('√ Spritesheet successfully generated.'.green);
        });
    }
    __getTrimRect(bitmap) {
        let rect = { x: 0, y: 0, width: 0, height: 0 };
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
    readFiles(files) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            for (let file of files) {
                let bitmap = yield bitmap_1.Bitmap.fromURL(file.path);
                if (Array.isArray(bitmap)) {
                    result.push(...bitmap.map((v, i) => Object.assign({}, file, { name: `${file.name}_${i}`, bitmap: v })));
                }
                else {
                    result.push(Object.assign(file, { bitmap: bitmap }));
                }
            }
            return result;
        });
    }
    getImagesSizes(files, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    ;
    determineCanvasSize(files, options) {
        files.forEach((item) => {
            item.w = item.width;
            item.h = item.height;
        });
        (0, sorter_1.default)(options.sort, files);
        let packfiles = [];
        files.forEach(v => {
            if (!packfiles.find(p => p.hash == v.bitmap.hash)) {
                packfiles.push(v);
            }
            else {
                v.unpacked = true;
            }
        });
        (0, packing_1.default)(options.algorithm, packfiles, options);
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
    }
    ;
    generateImage(files, options) {
        let dst = new bitmap_1.Bitmap(options.width, options.height);
        for (let file of files) {
            if (file.trimmed) {
                dst.draw(file.bitmap, file.trim, { x: file.x, y: file.y }, options.padding - options.edge, options.edge);
            }
            else {
                dst.draw(file.bitmap, { x: 0, y: 0, width: file.realwidth, height: file.realheight }, { x: file.x, y: file.y }, options.padding - options.edge, options.edge);
            }
            file.bitmap = null;
            delete file.bitmap;
        }
        ;
        dst.save(`${options.out}/${options.name}.png`);
    }
    ;
    generateData(files, options) {
        files.sort((a, b) => a.name > b.name ? 1 : -1);
        let templateContent = options.format.template;
        let cssPriority = 0;
        let cssPriorityNormal = cssPriority++;
        let cssPriorityHover = cssPriority++;
        let cssPriorityActive = cssPriority++;
        (0, sorter_1.default)(options.sort, files);
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
        }
        ;
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
    }
    ;
    roundToPowerOfTwo(value) {
        var powers = 2;
        while (value > powers) {
            powers *= 2;
        }
        return powers;
    }
}
exports.Generator = Generator;