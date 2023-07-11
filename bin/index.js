#!/usr/bin/env node
const { program, Argument } = require('commander');
require('colors');

program.usage("input-folder [options]")
    .addArgument(new Argument('[string]', `folder path or pattern of ${'glob'.green}`.grey))
    .option(
        '-f, --format [string]',
        `format of spritesheet.\n`.grey +
        `[ json, jsonarray , phaser, cocos2d , cocos2d-v3 , pixi.js , easel.js , laya , egret , yaml , zebkit , starling , sparrow , css ]`.yellow)
    .option('-c, --custom [string]', 'path to external format template,if you specify --customFormat,then ignore --format'.grey)
    .option('-n, --name [string]', 'name of generated spritesheet'.grey)
    .option('-p, --padding [number]', 'padding between images in spritesheet'.grey)
    .option('-e, --edge [number]', "pixel edge ext,it's useful when use tiling that need fixed the gap problem".grey)
    .option('-o, --out [string]', 'path to export directory'.grey, '.')
    .option('-t, --trim [boolean]', 'removes transparent whitespaces around images'.grey)
    .option(
        '-a, --algorithm',
        `packing algorithm:\n`.grey +
        `* 0 growing-binpacking (default)\n`.yellow +
        `* 1 binpacking (requires passing --width and --height options)\n`.yellow +
        `* 2 vertical\n`.yellow +
        `* 3 horizontal\n`.yellow)
    .option('-s, --scale [string]', 'percentage scale'.grey, '100%')
    .option('-w, --width [number]', 'width for binpacking'.grey, undefined)
    .option('-h, --height [number]', 'height for binpacking'.grey, undefined)
    .option('-ext, --extension [string]', 'specify file extension'.grey, undefined)
    .option('-fp, --fullpath [boolean]', 'include path in file name'.grey, false)
    .option('-pf, --prefix [string]', 'prefix for image paths'.grey, "")
    .option('-so, --sort [string]', 'Sort method: maxside (default), area, width or height'.grey, 'maxside')
    .option('-sq, --square [boolean]', 'texture should be s square'.grey, false)
    .option('-pw, --powerOfTwo [boolean]', 'texture width and height should be power of two'.grey, false)
    .option('-va, --validate [boolean]', 'check algorithm returned data'.grey, false)

    .option('-dt, --divisibleByTwo [boolean]', 'every generated frame coordinates should be divisible by two'.grey, false)
    .option('-cs, --cssOrder [string]', 'specify the exact order of generated css class names'.grey, '')

    .option('-bup, --breakup [boolean]', 'To break up the atlas, first you need to specify the format.'.grey, false)
    .action(function () {
        const options = program.opts();
        if (options.algorithm !== 'binpacking' || !isNaN(Number(options.width)) && !isNaN(Number(options.height))) {
            return true;
        }
        throw new Error('Width and/or height are not defined for binpacking');
    });

program.parse(process.argv);
// console.log(program.args, program.opts());
if (program.args.length == 0) {
    console.log("[!!] you should input source of folder path.".red)
    console.log("[:)] if you need help,please input --help".yellow)
    return;
}
let options = program.opts();
console.log(options);
if (options.breakup) {
    const { BreakUp } = require("../dist/breakup");
    new BreakUp().exec(program.args[0], options);
} else {
    const { Generator } = require("../dist/generator");
    new Generator().exec(program.args[0], options);
}
