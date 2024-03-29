# spritesheet-game

[中文](./README_CN.md)

atlas packaging tool of game engine.spritesheet generator of support most engine.

> `spritesheet-game` is a variant of `spritesheet-js`,but it has more features.

----

### supported spritesheet formats ###
* Json 
* JsonArray
* Phaser
* PIXI.js
* Cocos2d (i.e. version 2.x)
* Cocos2d-v3 (i.e. version 3.x) 
* Laya
* Egret
* Easel.js
* Yaml
* CSS 
* Zebkit
* Starling / Sparrow (templates not adapted)
* Custom (you can us [mustache](https://github.com/janl/mustache.js) to custom template)
----
### supported features ###
- support auto remove repeat images.
- support setting image padding.
- support edge of pixel extend, this features is useful when tiling.
- support multiple image formats.
- support glob pattern matching of input files.
- support custom data template.
- supports clipping of surrounding transparent pixels.
- for others, see the command line help information.

----
### supported source file formats ###
* PNG
* JPG/JPEG
* GIF

----
### Installation ###
```npm install spritesheet-game -g```

----
### Usage ###
you can input the source folder:
```bash
 $ spritesheet-game ./assets/images/
```
or use pattern of glob:
```bash
 $ spritesheet-game ./assets/**/*.png
```
also you can use code:
```javascript
   let Generator = require('spritesheet-game');
   
   new Generator()
        .exec('./assets/images/',
            {
                format: 'pixi.js',
                trim:true,
                padding:2
            })
        .then(()=>{
            console.log('spritesheet successfully generated');
        });
```
----
### **Command Line** ###
 
```
$ > spritesheet-game

Usage: spritesheet-game <files> [options]
	
Arguments:
string                           folder path or pattern of glob

Options:
  -f, --format [string]            format of spritesheet.
                                   [ json, jsonarray , phaser, cocos2d , cocos2d-v3 , pixi.js , easel.js , laya , egret , yaml , zebkit , starling , sparrow , css ] (default: "json")
  -c, --custom [string]            path to external format template,if you specify --customFormat,then ignore --format (default: "")
  -n, --name [string]              name of generated spritesheet (default: "spritesheet")
  -p, --padding [number]           padding between images in spritesheet (default: 0)
  -e, --edge [number]              pixel edge ext,it's useful when use tiling that need fixed the gap problem (default: 0)
  -o, --out [string]               path to export directory (default: ".")
  -t, --trim [boolean]             removes transparent whitespaces around images (default: true)
  -a, --algorithm                  packing algorithm:
                                   * 0 growing-binpacking (default)
                                   * 1 binpacking (requires passing --width and --height options)
                                   * 2 vertical
                                   * 3 horizontal

  -s, --scale [string]             percentage scale (default: "100%")
  -w, --width [number]             width for binpacking
  -h, --height [number]            height for binpacking
  -ext, --extension [string]       specify file extension
  -fp, --fullpath [boolean]        include path in file name (default: false)
  -pf, --prefix [string]           prefix for image paths (default: "")
  -so, --sort [string]             Sort method: maxside (default), area, width or height (default: "maxside")
  -sq, --square [boolean]          texture should be s square (default: false)
  -pw, --powerOfTwo [boolean]      texture width and height should be power of two (default: false)
  -va, --validate [boolean]        check algorithm returned data (default: false)
  -dt, --divisibleByTwo [boolean]  every generated frame coordinates should be divisible by two (default: false)
  -cs, --cssOrder [string]         specify the exact order of generated css class names (default: "")
  --help                           display help for command
```
------






