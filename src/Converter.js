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
        try {
            for (const file of files) {
                for (const [extension, lang] of Object.entries(this.languages)) {
                    if (file.endsWith(extension)) {
                        const name = file.split(".");
                        console.log(name)
                        console.log("." + name[1])
                        if(!this.files.has(name[0])) {
                            if("." + name[0] != extension) {
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
                            const data = {
                                fullPath: fullPath == undefined ? path.join(__dirname, dir, file) : fullPath,
                                extension: extension,
                                lang: lang,
                                fileName: file,
                            }
                            
                            if(this.files.has(name[0])) {
                                if("." + name[1] != extension) {
                                    this.files.set(name[0] + (parseInt(name[1]) + 1), data);
                                } else {
                                    this.files.set(name[0] + ".1", data);
                                }
                            } else {
                                this.files.set(name[0], data);
                            }
                            
                        } else if (fs.lstatSync(path.join(__dirname, dir, file)).isDirectory()) {
                            this.scan(path.join(dir, file), path.join(__dirname, dir, file))
                        } else {
                            // console.log("File not supported")
                        }
                    }
                }
            }
        } catch (error) {
            console.log(error);
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
            if (
                text.includes("print(") || 
                text.includes("str(input(")      
            ) {
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
            await new Promise(r => setTimeout(r, 1));
        }
        
        const python2 = points.python2
        const python3 = points.python3
        const javascript = points.javascript
        
        let fileLang = python2 > python3 ? {name: "python2", version: 2} : {name: "python3", version: 3}
        fileLang = javascript > python2 ? {name: "javascript", version: null} : fileLang

        let divNum = 0

        if (python2 > 0) divNum++
        if (python3 > 0) divNum++
        if (javascript > 0) divNum++
        return {lang: fileLang, percition: Math.round((python2 + python3 + javascript) / divNum * 100) + "%"}
    }

    async convert(fileData, converLang) {
        const filePath = fileData.fullPath
        const fetchedLang = await (this.detect(filePath))
        const lang = fetchedLang.lang.version == null ? 'javascript' : 'python' + fetchedLang.lang.version

        return "File langugage: " + lang + " \nDeteceted with: " + fetchedLang.percition + " percition"
    }

    async convert(file, langToTranslate) {
        const lang = await this.detect(file.fullPath)

        const readline = Readline.createInterface({
            input: fs.createReadStream(file.fullPath),
        });

        let convertedFile = ''
        readline.on('line', (line) => {
            if (lang == "python2") {
                if (langToTranslate == "python3") {
                    if (line.includes("print")) {
                        let args = line.split("print")[1].split(")")[0].split(",")
                        line = 'print(' + args.join(", ") + ')'
                    }
                    if (line.includes("raw_input(")) {
                        let args = line.split("raw_input(")[1].split(")")[0].split(",")
                        line = line.split('=')[0] + '= str(input(' + args.join(", ") + '))'
                    }
                }
            } else if (lang == "python3") {

            }
            convertedFile += line + '\n'
        })

        readline.on("close", () => {
            const name = file.fullPath.split('test_files/')[1]
            fs.writeFileSync(`done/${name}`, convertedFile);
        })
    }
}