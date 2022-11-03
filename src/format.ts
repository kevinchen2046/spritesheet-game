export type FormatInfo = { template: string, extension: string, trim: boolean }

export const FORMATS: { [name: string]: FormatInfo } = {
    'json': { template: 'json.template', extension: 'json', trim: false },
    'yaml': { template: 'yaml.template', extension: 'yaml', trim: false },
    'jsonarray': { template: 'jsonarray.template', extension: 'json', trim: false },
    'pixi.js': { template: 'json.template', extension: 'json', trim: true },
    'phaser': { template: 'phaser.template', extension: 'json', trim: true },
    'starling': { template: 'starling.template', extension: 'xml', trim: true },
    'sparrow': { template: 'starling.template', extension: 'xml', trim: true },
    'easel.js': { template: 'easeljs.template', extension: 'json', trim: false },
    'egret': { template: 'egret.template', extension: 'json', trim: false },
    'laya': { template: 'laya.template', extension: 'atlas', trim: true },
    'zebkit': { template: 'zebkit.template', extension: 'js', trim: false },
    'cocos2d': { template: 'cocos2d.template', extension: 'plist', trim: false },
    'cocos2d-v3': { template: 'cocos2d-v3.template', extension: 'plist', trim: false },
    'css': { template: 'css.template', extension: 'css', trim: false }
};