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
exports.Bitmap = void 0;
const gifuct_js_1 = require("gifuct-js");
const jpegjs = require("jpeg-js");
const pngjs_1 = require("pngjs");
const fs = require("fs");
const path = require("path");
const hash = require("node-object-hash");
let hasher = hash({ coerce: { set: true, symbol: true } });
class Bitmap extends pngjs_1.PNG {
    constructor(width, height, params) {
        super(Object.assign({ width: width, height: height }, params));
    }
    get hash() { return this.__hash; }
    static fromURL(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let ext = path.extname(url);
            let result;
            switch (ext) {
                case ".png":
                    result = yield Bitmap.fromPng(url);
                    break;
                case ".jpeg":
                case ".jpg":
                    result = Bitmap.fromJpeg(url);
                    break;
                case ".gif":
                    result = Bitmap.fromGif(url);
                    break;
            }
            return result;
        });
    }
    static fromPng(url) {
        var buffer = fs.readFileSync(url);
        return new Promise((reslove, reject) => {
            let bitmap = new Bitmap(undefined, undefined, { filterType: 4 });
            bitmap.parse(buffer, function (error, png) {
                if (error) {
                    reject(error);
                    return;
                }
                bitmap.__hash = hasher.hash(bitmap.data);
                reslove(bitmap);
            });
        });
    }
    static fromJpeg(url) {
        var buffer = fs.readFileSync(url);
        var jpeg = jpegjs.decode(buffer, { useTArray: true, formatAsRGBA: true });
        let bitmap = new Bitmap(jpeg.width, jpeg.height);
        bitmap.fillJPEG(jpeg.data);
        bitmap.__hash = hasher.hash(bitmap.data);
        return bitmap;
    }
    static fromGif(url) {
        var buffer = fs.readFileSync(url);
        let gif = (0, gifuct_js_1.parseGIF)(buffer);
        let frames = (0, gifuct_js_1.decompressFrames)(gif, true);
        return frames.map((v, i) => {
            let bitmap = new Bitmap(v.dims.width, v.dims.height);
            bitmap.fillGIF(v.pixels, v.colorTable);
            bitmap.__hash = hasher.hash(bitmap.data);
            return bitmap;
        });
    }
    fillPNG(data) {
        this.data = data;
    }
    fillGIF(pixels, colorTable) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = pixels[y * this.width + x];
                let [r, g, b] = colorTable[index];
                this.setPixel(x, y, { r: r, g: g, b: b, a: 255 });
            }
        }
    }
    fillJPEG(data) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = y * this.width + x;
                let i = index * 4;
                this.setPixel(x, y, { r: data[i++], g: data[i++], b: data[i++], a: data[i++] });
            }
        }
    }
    getPixel(x, y) {
        let idx = (this.width * y + x) << 2;
        let r = this.data[idx];
        let g = this.data[idx + 1];
        let b = this.data[idx + 2];
        let a = this.data[idx + 3];
        return { r, g, b, a };
    }
    setPixel(x, y, pixel) {
        let idx = (this.width * y + x) << 2;
        this.data[idx] = pixel.r;
        this.data[idx + 1] = pixel.g;
        this.data[idx + 2] = pixel.b;
        this.data[idx + 3] = pixel.a;
    }
    draw(source, sourceRect, destPoint, padding, pixeledge) {
        let dstx = destPoint.x + padding;
        let dsty = destPoint.y + padding;
        let bottom = sourceRect.y + sourceRect.height + pixeledge * 2;
        let right = sourceRect.x + sourceRect.width + pixeledge * 2;
        for (let y = sourceRect.y; y < bottom; y++) {
            let ty = Math.min(Math.max(sourceRect.y, y - pixeledge), sourceRect.y + sourceRect.height - 1);
            for (let x = sourceRect.x; x < right; x++) {
                let tx = Math.min(Math.max(sourceRect.x, x - pixeledge), sourceRect.x + sourceRect.width - 1);
                this.setPixel(x - sourceRect.x + dstx, y - sourceRect.y + dsty, source.getPixel(tx, ty));
            }
        }
    }
    save(path) {
        return this.pack().pipe(fs.createWriteStream(path));
    }
}
exports.Bitmap = Bitmap;
