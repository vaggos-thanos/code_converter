const fs = require('fs');
const path = require('path');

module.exports = class Converter {
    constructor() {
        this.files = new Map();
        this.convertedFiles = new Map();
        this.lang = ""
        this.languages = {
            ".py": "python",
            ".js": "javascript",
        }
    }

    async scan(dir) {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for (const file of files) {
            for (const [extension, lang] of Object.entries(this.languages)) {
                if (file.endsWith(extension)) {
                    this.files.set(file, extension);
                }
            }

        }
    }
}