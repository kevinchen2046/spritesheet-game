
const { Generator } = require('../dist/generator');

let generator = new Generator();
generator.exec("./test/images/", {
    name: "sprite",
    trim: true,
    padding: 60,
    edge: 50,
    out: "./test",
    format: "laya",
    custom:"templates/11.template",
    edge:10
});
