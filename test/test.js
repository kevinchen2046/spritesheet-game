const fs = require('fs');

let dir = "./test";
let files = fs.readdirSync(dir).map(v => ({ path: `${dir}/${v}` }));

async function run() {
    let generator = new Generator(files, {});
    await generator.readImages();
    await generator.getImagesSizes();
    await generator.determineCanvasSize();
    await generator.generateImage();
    await generator.generateData();
}

run();