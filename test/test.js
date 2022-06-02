const fs = require('fs');
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

generator.exec("./images/*.png",{name:"sprites",trim:true,padding:10});
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

