
/**
 * Options:
    -f, --format  format of spritesheet (starling, sparrow, json, pixi.js, easel.js, cocos2d)                                                          [default: "json"]
    -n, --name    name of generated spritesheet                                                                                                        [default: "spritesheet"]
    -p, --path    path to export directory                                                                                                             [default: "."]
    --fullpath    include path in file name                                                                                                            [default: false]
    --prefix      prefix for image paths (css format only)                                                                                             [default: ""]
    --trim        removes transparent whitespaces around images                                                                                        [default: false]
    --square      texture should be s square                                                                                                           [default: false]
    --powerOfTwo  texture width and height should be power of two                                                                                      [default: false]
    --validate    check algorihtm returned data                                                                                                        [default: false]
    --algorithm   packing algorithm: growing-binpacking (default), binpacking (requires passing --width and --height options), vertical or horizontal  [default: "growing-binpacking"]
    --width       width for binpacking                                                                                                                 [default: undefined]
    --height      height for binpacking                                                                                                                [default: undefined]
    --padding     padding between images in spritesheet                                                                                                [default: 0]
    --scale       percentage scale                                                                                                                     [default: "100%"]
    --fuzz        percentage fuzz factor (usually value of 1% is a good choice)                                                                        [default: ""]
    ```
 */

const Generator = require("./lib/generator");
module.exports = Generator;

