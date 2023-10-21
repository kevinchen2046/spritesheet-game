import { parseGIF, decompressFrames } from 'gifuct-js'
import * as jpegjs from 'jpeg-js';
import { PNG } from "pngjs";
import * as fs from "fs";
import * as path from "path";
import * as hash from "node-object-hash";
let hasher = (hash as any)({ coerce: { set: true, symbol: true } });
export type Rect = { x: number, y: number, width: number, height: number }
export type Point = { x: number, y: number }
export class Bitmap extends PNG {
    private __hash: string;
    constructor(width: number, height: number, params?: any) {
        super({ width: width, height: height, ...params });
    }

    public get hash() { return this.__hash }

    static async fromURL(url: string) {
        let ext = path.extname(url);
        let result: Bitmap | (Bitmap[]);
        switch (ext) {
            case ".png":
                result = await Bitmap.fromPng(url);
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
    }

    static fromPng(url: string): Promise<Bitmap> {
        var buffer = fs.readFileSync(url);
        return new Promise<Bitmap>((reslove, reject) => {
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

    static fromJpeg(url: string): Bitmap {
        var buffer = fs.readFileSync(url);
        var jpeg = jpegjs.decode(buffer, { useTArray: true, formatAsRGBA: true });
        let bitmap = new Bitmap(jpeg.width, jpeg.height);
        bitmap.fillJPEG(jpeg.data);
        bitmap.__hash = hasher.hash(bitmap.data);
        return bitmap;
    }

    static fromGif(url: string): Bitmap[] {
        var buffer = fs.readFileSync(url);
        let gif = parseGIF(buffer);
        let frames = decompressFrames(gif, true);
        return frames.map((v, i) => {
            let bitmap = new Bitmap(v.dims.width, v.dims.height);
            bitmap.fillGIF(v.pixels, v.colorTable);
            bitmap.__hash = hasher.hash(bitmap.data);
            return bitmap;
        });
    }

    fillPNG(data: Buffer) {
        this.data = data;
    }

    fillGIF(pixels: number[], colorTable: [number, number, number][]) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = pixels[y * this.width + x];
                let [r, g, b] = colorTable[index];
                this.setPixel(x, y, { r: r, g: g, b: b, a: 255 });
            }
        }
    }

    fillJPEG(data: Uint8Array | Uint16Array) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let index = y * this.width + x;
                let i = index * 4;
                this.setPixel(x, y, { r: data[i++], g: data[i++], b: data[i++], a: data[i++] });
            }
        }
    }

    getPixel(x: number, y: number) {
        let idx = (this.width * y + x) << 2;
        let r: number = this.data[idx];
        let g: number = this.data[idx + 1];
        let b: number = this.data[idx + 2];
        let a: number = this.data[idx + 3];
        return { r, g, b, a };
    }

    setPixel(x: number, y: number, pixel: { r: number, g: number, b: number, a: number }) {
        let idx = (this.width * y + x) << 2;
        this.data[idx] = pixel.r;
        this.data[idx + 1] = pixel.g;
        this.data[idx + 2] = pixel.b;
        this.data[idx + 3] = pixel.a;
    }

    scale(v) {
        return this.resize((this.width * v)>>0, (this.height * v)>>0);
    }

    resize(width, height) {

        let scaleX = (this.width / width);
        let scaleY = (this.height / height);
        var dst = new Bitmap(width, height);
        for (let b = 0; b < height; b++) {
            let y = (b * scaleY) >> 0;
            for (let a = 0; a < width; a++) {
                let x = (a * scaleX) >> 0;
                var i = (this.width * y + x) << 2;
                var j = (width * b + a) << 2;
                dst.data[j] = this.data[i];
                dst.data[j + 1] = this.data[i + 1];
                dst.data[j + 2] = this.data[i + 2];
                dst.data[j + 3] = this.data[i + 3];
            }
        }
        // this.destroy();
        dst.__hash = hasher.hash(dst.data);
        return dst;
    }


    draw(source: Bitmap, sourceRect: Rect, destPoint: Point, padding: number, pixeledge: number) {
        let dstx = destPoint.x + padding;
        let dsty = destPoint.y + padding;
        let bottom = sourceRect.y + sourceRect.height + pixeledge * 2;
        let right = sourceRect.x + sourceRect.width + pixeledge * 2;
        for (let y = sourceRect.y; y < bottom; y++) {
            // if (Math.abs(rect.y - y) < padding || Math.abs(rect.bottom - y) <= padding) continue;
            let ty = Math.min(Math.max(sourceRect.y, y - pixeledge), sourceRect.y + sourceRect.height - 1);
            // let ty = y;
            for (let x = sourceRect.x; x < right; x++) {
                // if (Math.abs(rect.x - x) < padding || Math.abs(rect.right - x) <= padding) continue;
                let tx = Math.min(Math.max(sourceRect.x, x - pixeledge), sourceRect.x + sourceRect.width - 1);
                // let tx = x;
                this.setPixel(
                    x - sourceRect.x + dstx,
                    y - sourceRect.y + dsty,
                    source.getPixel(tx, ty));
            }
        }
    }
    // drawImage1(file, dst, padding, pixeledge) {
    //     let png = file.png;
    //     let rect = file.trim;

    //     let dstx = file.x + padding + pixeledge;
    //     let dsty = file.y + padding + pixeledge;

    //     let bottom = rect.y + rect.height;
    //     let right = rect.x + rect.width;
    //     for (let y = rect.y; y < bottom; y++) {
    //         let ty = y;
    //         for (let x = rect.x; x < right; x++) {
    //             let tx = Math.min(Math.max(rect.x, x - padding - pixeledge), rect.x + rect.width - 1);
    //             dst.setPixel((x - rect.x + dstx), (y - rect.y + dsty), this.getPixel(x, y));
    //         }
    //     }
    // }

    /**
     * write file to disk
     * @param {PNG} png 
     * @param {string} path 
     */
    save(path: string) {
        return this.pack().pipe(fs.createWriteStream(path));
    }

}

