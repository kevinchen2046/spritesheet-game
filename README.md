# spritesheet-game

spritesheet generator without environment dependencies,Supported PIXI.js Cocos2d Easel.js Egret ...

`spritesheet-game` is a non environment version of `spritesheet-js`. 
`pngjs` is the only dependency of bitmap,`spritesheet-game` as same supports the command-line.

    ! new features - remove repeat textures.
    ! new features - pixel edge ext,fixed the gap problem when tiling.

### Supported spritesheet formats ###
* JSON (i.e. PIXI.js)
* Easel.js
* cocos2d (i.e. version 2.x)
* cocos2d-v3 (i.e. version 3.x) 
* CSS 
* Starling / Sparrow (templates not adapted)

### Usage ###
1. **Command Line**
    ```bash
    $ spritesheet-game assets/*.png
    ```
    Options:
    ```bash
    $ spritesheet-game
    Usage: spritesheet-game [options] <files>
	
	Options:
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
    --pixeledge   pixel edge ext,its useful when use tiling that need fixed the gap problem                                                           
    [default: 0]
    --scale       percentage scale                                                                                                                     [default: "100%"]

    ```

2. **Node.js**
    ```javascript
    let SpriteSheet = require('spritesheet-game');
    
    new SpriteSheet().exec('assets/*.png', {format: 'pixi.js',trim:true,padding:2}).then(()=>{
        console.log('spritesheet successfully generated');
    });
    ```

### Installation ###

```npm install spritesheet-game -g```





