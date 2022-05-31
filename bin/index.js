#!/usr/bin/env node
var optimist = require('optimist');
var argv = optimist.usage('Usage: $0 [options] <files>')
    .options('f', {
        alias: 'format',
        describe: 'format of spritesheet (starling, sparrow, json, yaml, pixi.js, easel.js, egret, zebkit, cocos2d)',
        default: ''
    })
    .options('cf', {
        alias: 'customFormat',
        describe: 'path to external format template',
        default: ''
    })
    .options('n', {
        alias: 'name',
        describe: 'name of generated spritesheet',
        default: 'spritesheet'
    })
    .options('p', {
        alias: 'path',
        describe: 'path to export directory',
        default: '.'
    })
    .options('fullpath', {
        describe: 'include path in file name',
        default: false,
        boolean: true
    })
    .options('prefix', {
        describe: 'prefix for image paths',
        default: ""
    })
    // .options('trim', {
    //     describe: 'removes transparent whitespaces around images',
    //     default: false,
    //     boolean: true
    // })
    .options('square', {
        describe: 'texture should be s square',
        default: false,
        boolean: true
    })
    .options('powerOfTwo', {
        describe: 'texture width and height should be power of two',
        default: false,
        boolean: true
    })
    .options('validate', {
        describe: 'check algorithm returned data',
        default: false,
        boolean: true
    })
    .options('scale', {
        describe: 'percentage scale',
        default: '100%'
    })
    .options('algorithm', {
        describe: 'packing algorithm: growing-binpacking (default), binpacking (requires passing --width and --height options), vertical or horizontal',
        default: 'growing-binpacking'
    })
    .options('width', {
        describe: 'width for binpacking',
        default: undefined
    })
    .options('height', {
        describe: 'height for binpacking',
        default: undefined
    })
    .options('padding', {
        describe: 'padding between images in spritesheet',
        default: 0
    })
    .options('sort', {
        describe: 'Sort method: maxside (default), area, width or height',
        default: 'maxside'
    })
    .options('divisibleByTwo', {
        describe: 'every generated frame coordinates should be divisible by two',
        default: false,
        boolean: true
    })
    .options('cssOrder', {
        describe: 'specify the exact order of generated css class names',
        default: ''
    })
    .check(function (argv) {
        if (argv.algorithm !== 'binpacking' || !isNaN(Number(argv.width)) && !isNaN(Number(argv.height))) {
            return true;
        }

        throw new Error('Width and/or height are not defined for binpacking');
    })
    .demand(1)
    .argv;
if (argv._.length == 0) {
    optimist.showHelp();
} else {
    let Generator=require("../index");
    new Generator(argv._, argv).exec();
}
