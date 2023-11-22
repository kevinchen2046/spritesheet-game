import * as fs from "fs";
import * as path from "path";
import { Bitmap } from "./bitmap";
import { FORMATS } from "./format";

export class BreakUp {
    async exec(file, options) {
        if (!options.format) {
            console.error("请输入源图集格式...");
            return;
        }
        if (!FORMATS[options.format]) {
            console.error("未知的源图集格式...");
            return;
        }
        let format = FORMATS[options.format];
        let folder = "./"+path.basename(file).replace(path.extname(file),"");
        if (options.out && options.out != "./") {
            folder = options.out;
        }
        let alast = null;
        let png = null;
        if (path.extname(file) == `.${format.extension}`) {
            alast = file;
            png = file.replace(path.extname(file), ".png");
        } else {
            png = file;
            alast = file.replace(path.extname(file), `.${format.extension}`);
        }
        if(!fs.existsSync(png)){
            console.error("未找到源图像...");
            return;
        }
        if(!fs.existsSync(alast)){
            console.error("未找到配置...");
            return;
        }
        let bitmap = await Bitmap.fromPng(png);
        let config = await this.readConfig(alast);
        if(!fs.existsSync(folder)) fs.mkdirSync(folder);
        switch (options.format) {
            case "egret":
                if(!config.res){
                    console.error(`无效的${options.format}格式!`);
                    return;
                }
                for (let name in config.res) {
                    let frame = config.res[name];
                    let tile = new Bitmap(frame.sourceW, frame.sourceH);
                    tile.draw(bitmap, { x: frame.x, y: frame.y, width: frame.w, height: frame.h }, { x: frame.offX, y: frame.offY }, 0, 0);
                    tile.save(`${folder}/${name}`);
                }
                break;
        }
    }

    async readConfig(url) {
        let ext = path.extname(url);
        let content = fs.readFileSync(url, "utf-8");
        switch (ext) {
            case ".json":
            case ".atlas":
                return JSON.parse(content)
            case ".xml":
            case "plist":


                break;
            case ".yaml":

                break;
            case ".js":

                break
            case ".css":

                break;
        }
        return null;
    }
}