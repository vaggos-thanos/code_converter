const Converter = require('./Converter');
const converter = new Converter();
converter.scan('../files_to_convert');
(async () => {
    for (const [fileName, data] of converter.files) {
        await converter.convert(data, "python2")
        console.log("Converted: " + fileName + " to python2")
    }
})();