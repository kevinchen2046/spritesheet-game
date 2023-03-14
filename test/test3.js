const fs=require("fs");
const path=require("path");
const childProgress=require("child_process");
let outFolder=`E:/project/cocos-helloworld/assets/`;
let name="anima";

async function execCmd(cmd) {
    return new Promise(reslove => {
        const steam = childProgress.exec(cmd);
        steam.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        steam.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        steam.on('error', (data) => {
            console.error(data);
            reslove();
        });
        steam.on('close', (code) => {
            if (code != 0) console.log(`child process exited with code ${code}`);
            reslove();
        });
    })
}
execCmd(`spritesheet-game ./test/anima -n anima -f cocos2d-v3`).then(v=>{
    if(fs.existsSync(`${outFolder}${name}.plist`)) fs.unlinkSync(`${outFolder}${name}.plist`);
    if(fs.existsSync(`${outFolder}${name}.plist.meta`)) fs.unlinkSync(`${outFolder}${name}.plist.meta`);
    if(fs.existsSync(`${outFolder}${name}.png`)) fs.unlinkSync(`${outFolder}${name}.png`);
    if(fs.existsSync(`${outFolder}${name}.png.meta`)) fs.unlinkSync(`${outFolder}${name}.png.meta`);
    

    console.log("done...")
})

