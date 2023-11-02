// var Mustache = require('mustache');

// var view = {
//     "name": "Chris",
//     "company": "<b>GitHub</b>"
// }
// let template = `-----------
// * {{name}}
// * {{age}}
// * {{company}}
// * {{{company}}}
// * {{&company}}
// {{=<% %>=}}
// * {{company}}
// <%={{ }}=%>
// -----------`
// var output = Mustache.render(template, view);

// console.log(output);

let glob = require("glob");

// let Generator = require('./index');

// new Generator().exec('./test/images/', { format: 'laya', trim: true, padding: 2,out:"./test" }).then(() => {
//     console.log('spritesheet successfully generated');
// });
let pattern = ["./test/images/"];
pattern.reduce((prev, current, i, array) => {
    
})
console.log(glob.sync("./test/images/", { ignore: "" }))
