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
const packing_1 = require("./packing");
const sorter_1 = require("./sorter");
const util_1 = require("./util");
class Generator {
    execUsePattern(filesOrPatterns, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let files = util_1.Util.pickfiles(filesOrPatterns);
            let useoptions = util_1.Util.parseOptions(options);
            this.exec(files, useoptions);
        });
    }
    exec(filePaths, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!filePaths || filePaths.length == 0) {
                throw new Error('no files specified');
            }
            let files = filePaths.map(function (filepath) {
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
        });
    }
    ;
    determineCanvasSize(files, options) {
        files.forEach((item) => {
            item['w'] = item.width;
            item['h'] = item.height;
        });
        (0, sorter_1.default)(options.sort, files);
        let packfiles = [];
        files.forEach(v => {
            if (!packfiles.find(p => p.bitmap.hash == v.bitmap.hash)) {
                packfiles.push(v);
            }
            else {
                v.unpacked = true;
            }
        });
        (0, packing_1.default)(options.algorithm, packfiles, options);
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
    }
    ;
    generateImage(files, options) {
        let dst = new bitmap_1.Bitmap(options.width, options.height);
        for (let file of files) {
            if (file.trimmed) {
                dst.draw(file.bitmap, file.trim, { x: file.x, y: file.y }, options.padding - options.edge, options.edge);
            }
            else {
                dst.draw(file.bitmap, { x: 0, y: 0, width: file.originalwidth, height: file.originalheight }, { x: file.x, y: file.y }, options.padding - options.edge, options.edge);
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
