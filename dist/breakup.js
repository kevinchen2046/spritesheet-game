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
                console.error("请输入源图集格式...", options.format);
                return;
            }
            if (!format_1.FORMATS[options.format]) {
                console.error("未知的源图集格式...", options.format);
                return;
            }
            let format = format_1.FORMATS[options.format];
            file = path.resolve(file);
            let filename = path.basename(file);
            let folder = path.resolve(file.replace(filename, ""), filename.replace(path.extname(filename), ""));
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
                console.error("未找到源图像...", png);
                return;
            }
            if (!fs.existsSync(alast)) {
                console.error("未找到配置...", alast);
                return;
            }
            let bitmap = yield bitmap_1.Bitmap.fromPng(png);
            let config = yield this.readConfig(alast);
            if (!fs.existsSync(folder))
                fs.mkdirSync(folder);
            switch (options.format) {
                case "egret-mc":
                    if (!config.res || !config.mc) {
                        console.error(`无效的${options.format}格式!`);
                        return;
                    }
                    for (let mcname in config.mc) {
                        if (Object.keys(config.mc).length != 1) {
                            folder = `${folder}/${mcname}`;
                            if (!fs.existsSync(folder))
                                fs.mkdirSync(folder);
                        }
                        let mc = config.mc[mcname];
                        let offsets = mc.frames.map(v => ({ x: v.x, y: v.y }));
                        let first = Object.assign({}, offsets[0]);
                        offsets.forEach(v => {
                            v.x -= first.x;
                            v.y -= first.y;
                        });
                        let frames = [];
                        for (let i = 0; i < mc.frames.length; i++) {
                            let frame = mc.frames[i];
                            let offset = offsets[i];
                            let res = config.res[frame.res];
                            frames.push({ x: res.x, y: res.y, w: res.w, h: res.h, offX: offset.x, offY: offset.y });
                        }
                        let paddingX = 0;
                        let paddingY = 0;
                        for (let offset of offsets) {
                            paddingX = Math.max(paddingX, Math.abs(offset.x) * 2);
                            paddingY = Math.max(paddingY, Math.abs(offset.y) * 2);
                        }
                        let sourceW = 0;
                        let sourceH = 0;
                        for (let frame of frames) {
                            sourceW = Math.max(sourceW, paddingX + frame.w);
                            sourceH = Math.max(sourceH, paddingY + frame.h);
                        }
                        let index = 0;
                        for (let frame of frames) {
                            let tile = new bitmap_1.Bitmap(sourceW, sourceH);
                            let dest = { x: paddingX / 2 + frame.offX, y: paddingY / 2 + frame.offY };
                            tile.draw(bitmap, { x: frame.x, y: frame.y, width: frame.w, height: frame.h }, dest, 0, 0);
                            let ext = ".png";
                            tile.save(`${folder}/frame${++index}${ext}`);
                        }
                    }
                    break;
                case "egret":
                    if (!config.frames) {
                        console.error(`无效的${options.format}格式!`);
                        return;
                    }
                    for (let name in config.frames) {
                        let frame = config.frames[name];
                        let tile = new bitmap_1.Bitmap(frame.sourceW, frame.sourceH);
                        tile.draw(bitmap, { x: frame.x, y: frame.y, width: frame.w, height: frame.h }, { x: frame.offX, y: frame.offY }, 0, 0);
                        let ext = path.extname(name);
                        if (!ext)
                            ext = ".png";
                        tile.save(`${folder}/${name}${ext}`);
                    }
                    break;
            }
            console.log(`[✔] The image segmented from the spritesheet is located at: `.green + `${folder}`.blue);
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
