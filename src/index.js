const Converter = require('./Converter');
const converter = new Converter();
converter.scan('../test_files');
(async () => {
    console.log(converter.files)
    for (const [fileName, data] of converter.files) {
        console.log(data)
        console.log(await converter.convert(data, "python3"))
    }
})();