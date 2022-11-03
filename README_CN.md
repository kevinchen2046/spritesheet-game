# spritesheet-game

游戏引擎的图集打包工具。支持大多数引擎的spritesheet生成器。

> `spritesheet-game` 是 `spritesheet-js`的一个变种,但相比它功能更丰富.

----

### 数据模板支持 ###
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
### 支持功能 ###
- 支持自动移除重复图片
- 支持设置图片间距
- 支持像素边缘扩展(当图块进行平铺时,这个很有用)
- 支持多种图片格式
- 支持输入文件的glob模式匹配
- 支持自定义数据模板
- 支持裁剪周围透明像素
- 其他请参见命令行帮助信息

----
### 支持的输入文件格式 ###
* PNG
* JPG/JPEG
* GIF

----
### 安装 ###
```npm install spritesheet-game -g```

----
### 使用 ###
你可以输入整个文件夹
```bash
 $ spritesheet-game ./assets/images/
```
或者使用glob的匹配模式
```bash
 $ spritesheet-game ./assets/**/*.png
```
当然,你也可以使用代码
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
### **命令行** ###
 
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






