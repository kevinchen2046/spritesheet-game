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
exports.BreakUp = void 0;
const fs = require("fs");
const path = require("path");
const bitmap_1 = require("./bitmap");
const format_1 = require("./format");
class BreakUp {
    exec(file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options.format) {
                console.error("请输入源图集格式...");
                return;
            }
            if (!format_1.FORMATS[options.format]) {
                console.error("未知的源图集格式...");
                return;
            }
            let format = format_1.FORMATS[options.format];
            let folder = "./" + path.basename(file).replace(path.extname(file), "");
            if (options.out && options.out != "./") {
                folder = options.out;
            }
            let alast = null;
            let png = null;
            if (path.extname(file) == `.${format.extension}`) {
                alast = file;
                png = file.replace(path.extname(file), ".png");
            }
            else {
                png = file;
                alast = file.replace(path.extname(file), `.${format.extension}`);
            }
            if (!fs.existsSync(png)) {
                console.error("未找到源图像...");
                return;
            }
            if (!fs.existsSync(alast)) {
                console.error("未找到配置...");
                return;
            }
            let bitmap = yield bitmap_1.Bitmap.fromPng(png);
            let config = yield this.readConfig(alast);
            if (!fs.existsSync(folder))
                fs.mkdirSync(folder);
            switch (options.format) {
                case "egret":
                    if (!config.res) {
                        console.error(`无效的${options.format}格式!`);
                        return;
                    }
                    for (let name in config.res) {
                        let frame = config.res[name];
                        let tile = new bitmap_1.Bitmap(frame.sourceW, frame.sourceH);
                        tile.draw(bitmap, { x: frame.x, y: frame.y, width: frame.w, height: frame.h }, { x: frame.offX, y: frame.offY }, 0, 0);
                        tile.save(`${folder}/${name}`);
                    }
                    break;
            }
        });
    }
    readConfig(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let ext = path.extname(url);
            let content = fs.readFileSync(url, "utf-8");
            switch (ext) {
                case ".json":
                case ".atlas":
                    return JSON.parse(content);
                case ".xml":
                case "plist":
                    break;
                case ".yaml":
                    break;
                case ".js":
                    break;
                case ".css":
                    break;
            }
            return null;
        });
    }
}
exports.BreakUp = BreakUp;
