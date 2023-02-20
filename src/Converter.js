const fs = require('fs');
const path = require('path');
const Readline = require('readline');

module.exports = class Converter {
    constructor() {
        this.files = new Map();
        this.convertedFiles = new Map();
        this.lang = ""
        this.languages = {
            ".py": {
                name: "python",
                v2: ["print", "raw_input()"],
                v3: ["print()", "input()"],
            },
            ".js": "javascript",
        }
    }

    async scan(dir, fullPath) {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for (const file of files) {
            for (const [extension, lang] of Object.entries(this.languages)) {
                if (file.endsWith(extension)) {
                    const name = file.split(".");
                    if(this.files.has(name[0])) {
                        if("." + name[1] != extension) {
                            this.files.set(name[0] + (parseInt(name[1]) + 1), {
                                fullPath: fullPath == undefined ? path.join(__dirname, dir, file) : fullPath,
                                extension: extension,
                                lang: lang,
                                fileName: file,
                            });
                        } else {
                            this.files.set(name[0] + ".1", {
                                fullPath: fullPath == undefined ? path.join(__dirname, dir, file) : fullPath,
                                extension: extension,
                                lang: lang,
                                fileName: file,
                            });
                        }
                    }
                    this.files.set(name[0], {
                        fullPath: fullPath == undefined ? path.join(__dirname, dir, file) : fullPath,
                        extension: extension,
                        lang: lang,
                        fileName: file,
                    });
                } else if (fs.lstatSync(path.join(__dirname, dir, file)).isDirectory()) {
                    this.scan(path.join(dir, file), path.join(__dirname, dir, file))
                }
            }
        }
    }

    async detect(file) {
        const readline = Readline.createInterface({
            input: fs.createReadStream(file),
        });
        const points = {
            python2: 0,
            python3: 0,
            javascript: 0,
        }
        
        let sleep = true
        readline.on("line", async (text) => {
            if (text.includes("print(")) {
                points.python3 += 1
            }

            if (text.includes("print") || text.includes("raw_input(")) {
                points.python2 += 1
            }

            if (text.includes("console.log")) {
                points.javascript += 1
            }
        })

        readline.on("close", () => {
            sleep = false
        })

        while (sleep) {
            await new Promise(r => setTimeout(r, 500));
        }
        
        const python2 = points.python2
        const python3 = points.python3
        const javascript = points.javascript
        let fileLang = python2 > python3 ? "python2" : "python3"
        fileLang = javascript > python2 ? "javascript" : fileLang
        return fileLang
    }

    async convert(file, langToTranslate) {
        const lang = await this.detect(file.fullPath)

        const readline = Readline.createInterface({
            input: fs.createReadStream(file.fullPath),
        });

        readline.on('line', (line) => {
            if (lang == "python2") {
                if (langToTranslate == "python3") {
                    if (line.includes("print")) {
                        let args = line.split("print")[1].split(")")[0].split(",")
                        line = 'print(' + args.join(", ") + ')'
                    }
                    if (line.includes("raw_input(")) {
                        let args = line.split("raw_input(")[1].split(")")[0].split(",")
                        line = 'str(input(' + args.join(", ") + '))'
                    }
                }
            } else if (lang == "python3") {

            }
            console.log(line)
        })
    }
}