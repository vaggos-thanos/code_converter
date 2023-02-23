const Converter = require('./Converter');
const converter = new Converter();
(async () => {
    await converter.scan('../files_to_convert');

    for (const [fileName, data] of converter.files) {
        await converter.convert(data, "python2")
        console.log("Converted: " + fileName + " to python2")
    }
})();