const fs = require('fs');
const color = require('colors');
const { PNG } = require('pngjs');
const Generator = require('../lib/generator');
const hasher = require('node-object-hash')({ coerce: { set: true, symbol: true } })
// let dir = "./test";
// let files = fs.readdirSync(dir).map(v => ({ path: `${dir}/${v}` }));

// async function run() {
//     let generator = new Generator(files, {});
//     await generator.readImages();
//     await generator.getImagesSizes();
//     await generator.determineCanvasSize();
//     await generator.generateImage();
//     await generator.generateData();
// }

// run();
let generator = new Generator();
generator.exec("./images/*.png", { name: "sprites", trim: true, padding: 10, pixeledge: 50 });

// let padding = 1;
// let pixeledge = 1;
// let png = { width: 3, height: 3 };
// let rect = { x: 3, y: 3, width: png.width + (padding + pixeledge) * 2, height: png.height + (padding + pixeledge) * 2 }
// let bottom=rect.y+rect.height;
// let right=rect.x+rect.width;
// let results = [];
// for (let y = rect.y; y < bottom; y++) {
//     if (Math.abs(rect.y - y) < padding || Math.abs(bottom - y) <= padding) continue;
//     let ty = Math.min(Math.max(0, y - rect.y - padding - pixeledge), png.height - 1);
//     //console.log(y, ":", ty);
//     let list=[];
//     for (let x = rect.x; x < right; x++) {
//         if (Math.abs(rect.x - x) < padding || Math.abs(right - x) <= padding) continue;
//         let tx = Math.min(Math.max(0, x - rect.x - padding - pixeledge), png.width - 1);
//         list.push(`${x}${y}`.bgWhite+":".gray+`${tx}`.green+`${ty}`.yellow);
//         // let idx = (png.width * ty + tx) << 2;
//     }
//     results.push(list.join(","))
// }
// console.log(results.join("\n"))

// generator.__readImage("./images/wind_strong0010.png").then(png => {
//     let rect = generator.__getTrimRect(png);
//     console.log(rect);
//     let dst = new PNG({ width: rect.width, height: rect.height });
//     generator.__drawImage({ png: png, trim: rect, x: 0, y: 0 }, dst, 0);
//     generator.__writeImage(dst, "out.png").once("finish", () => {
//         console.log(hasher.hash(png.data));
//         console.log(hasher.hash(dst.data));
//         generator.__readImage("./out.png").then((res) => {
//             console.log(hasher.hash(dst.data) == hasher.hash(res.data));
//         });
//     });
// });
