#!/usr/bin/env node
const options = require("../options.json");
const { program, Argument } = require('commander');
require('colors');
const { env } = require("process");
const { type } = require("os");
program.usage("inputfolder [options]").addArgument(new Argument('[string]', `folder path or pattern of ${'glob'.green}`.grey));
function getEnvLocale(env) {
    env = env || process.env;
    return env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
}
const lang = getEnvLocale(env);
const isChinese = lang&&lang.indexOf("zh_CN") >= 0;
for (let opt of options) {
    let flags = `${opt.symbol ? (`-${opt.symbol}, `) : ""}--${opt.name} <${opt.type}>`;
    let desctexts = isChinese ? opt.desc.cn : opt.desc.en;
    let desc = "";
    if (Array.isArray(desctexts)) {
        desc = desctexts.map((v, i) => {
            let style = opt.desc.style[i];
            return style ? v[style] : v;
        }).join("\n")
    } else {
        let style = opt.desc.style;
        desc = style ? desctexts[style] : desctexts;
    }
    // console.log(flags,desc,options.default);
    program.option(flags, desc, opt.default);
}
program.option("-v --version",undefined,()=>{
    console.log(`当前版本: ${require("../package.json").version}`.green);
})
program.action(function () {
    const options = program.opts();
    if (options.algorithm !== 'binpacking' || !isNaN(Number(options.width)) && !isNaN(Number(options.height))) {
        return true;
    }
    throw new Error('Width and/or height are not defined for binpacking');
});

program.parse(process.argv.map(v => decodeURIComponent(v)));

if (program.args.length == 0) {
    console.log("[!!] you should input source of folder path.".red)
    console.log("[:)] if you need help,please input --help".yellow)
    return;
}
let opts = program.opts();

//将选项的值强转成设定的类型
for (let name in opts) {
    let option = options.find(v => v.name == name);
    if (typeof opts[name] != option.type) {
        switch (option.type) {
            case "number":
                opts[name] = Number(opts[name]);
                break;
            case "boolean":
                opts[name] = Boolean(opts[name]);
                break;
            case "string":
                opts[name] = opts[name] + '';
                break;
        }
    }
}

if (opts.breakup) {
    const { BreakUp } = require("../dist/breakup");
    new BreakUp().exec(program.args[0], opts);
} else {
    const { Generator } = require("../dist/generator");
    new Generator().execUsePattern(program.args[0], opts);
}
