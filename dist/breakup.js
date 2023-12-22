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
            if (options.format != "custom" && !format_1.FORMATS[options.format]) {
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
            let fileext = path.extname(file);
            let alast = null;
            let png = null;
            if (fileext == ".json" || fileext == `.${format.extension}`) {
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
                        this.breakfromNoSourceWH(bitmap, mc.frames, mc.res, folder);
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
                case "custom":
                    if (!options.breakup) {
                        console.error(`自定义打散请定义模板: -b frames_key,frameX_key,frameY_key,x_key,y_key,width_key,height_key`);
                        return;
                    }
                    let [frames_key, frameX_key, frameY_key, x_key, y_key, width_key, height_key] = options.breakup.split(",");
                    let sequence = config[frames_key];
                    let source = {};
                    let frames = [];
                    for (let i = 0; i < sequence.length; i++) {
                        let key = i;
                        let v = sequence[i];
                        source[key] = { x: v[x_key], y: v[y_key], w: v[width_key], h: v[height_key] };
                        frames.push({ x: v[frameX_key], y: v[frameY_key], res: key });
                    }
                    let folderpath = folder.replace(path.extname(folder), "");
                    if (!fs.existsSync(folderpath))
                        fs.mkdirSync(folderpath);
                    console.log(bitmap, folder);
                    this.breakfromNoSourceWH(bitmap, frames, source, folderpath);
                    break;
            }
            console.log(`[✔] The image segmented from the spritesheet is located at: `.green + `${folder}`.blue);
        });
    }
    breakfromNoSourceWH(bitmap, frames, source, outfolder) {
        let offsets = frames.map(v => ({ x: v.x, y: v.y }));
        let first = Object.assign({}, offsets[0]);
        offsets.forEach(v => {
            v.x -= first.x;
            v.y -= first.y;
        });
        let sequence = [];
        for (let i = 0; i < frames.length; i++) {
            let frame = frames[i];
            let offset = offsets[i];
            let res = source[frame.res];
            sequence.push({ x: res.x, y: res.y, w: res.w, h: res.h, offX: offset.x, offY: offset.y });
        }
        let paddingX = 0;
        let paddingY = 0;
        for (let offset of offsets) {
            paddingX = Math.max(paddingX, Math.abs(offset.x) * 2);
            paddingY = Math.max(paddingY, Math.abs(offset.y) * 2);
        }
        let sourceW = 0;
        let sourceH = 0;
        for (let frame of sequence) {
            sourceW = Math.max(sourceW, paddingX + frame.w);
            sourceH = Math.max(sourceH, paddingY + frame.h);
        }
        let index = 0;
        for (let frame of sequence) {
            let tile = new bitmap_1.Bitmap(sourceW, sourceH);
            let dest = { x: paddingX / 2 + frame.offX, y: paddingY / 2 + frame.offY };
            tile.draw(bitmap, { x: frame.x, y: frame.y, width: frame.w, height: frame.h }, dest, 0, 0);
            let ext = ".png";
            tile.save(`${outfolder}/frame${++index}${ext}`);
        }
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
