const fs = require('fs');
const path = require('path');
const Readline = require('readline');
const OS = require('os');

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
        try {
            await this.createFiles()
            console.log("Scanning " + dir)
            const files = fs.readdirSync(path.join(__dirname, dir))
            for (const file of files) {
                for (const [extension, lang] of Object.entries(this.languages)) {
                    if (file.endsWith(extension)) {
                        const name = file.split(".");
                        const data = {
                            fullPath: fullPath == undefined ? path.join(__dirname, dir, file) : path.join(fullPath, file),
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

    async convert(file, langToTranslate) {
        console.log("Converting " + file.fileName + " to " + langToTranslate)
        const lang = await this.detect(file.fullPath)
        const readline = Readline.createInterface({
            input: fs.createReadStream(file.fullPath),
        });

        let convertedFile = ''
        readline.on('line', (line) => {
            if (lang.lang.name == "python2") {
                if (langToTranslate == "python3") {
                    if (line.includes("print")) {
                        let print = line.split("print")
                        let args = print[1].split(",")
                        line = print[0] + 'print(' + args.join(", ") + ')'
                    }
                    if (line.includes("raw_input(")) {
                        let args = line.split("raw_input(")[1].split(")")[0].split(",")
                        line = line.split('=')[0] + '= str(input(' + args.join(", ") + '))'
                    }
                }
            } else if (lang.lang.name == "python3") {
                if (langToTranslate == "python2") {
                    if (line.includes("print(")) {
                        let print = line.split("print(")
                        let args = print[1].substring(0, print[1].length - 1).split(",")
                        line = print[0] + 'print ' + args.join(", ")
                    }
                    if (line.includes("input(")) {
                        let args = line.split("input(")[1].split(")")[0].split(",")
                        line = line.split('=')[0] + '= raw_input(' + args.join(", ") + ')'
                    }
                }
            }
            convertedFile += line + '\n'
        })

        readline.on("close", () => {
            const os = (OS.type()).toLowerCase()
            let name = ""
            if(os.includes("windows")) {
                name = file.fullPath.split('files_to_convert\\')[1]
                if(name.includes("\\")) {
                    name = name.split("\\")
                }
            } else {
                file.fullPath.split('files_to_convert/')[1]
                if(name.includes("/")) {
                    name = name.split("/")
                }
            }
            if(Array.isArray(name)) {
                let tempPath = ""
                for (let i = 0; i < name.length - 1; i++) {
                    tempPath += name[i] + "/"
                    fs.mkdirSync(`done/${tempPath}`, { recursive: true })
                }


                name = name.join("/")
            }
            fs.writeFileSync(`done/${name}`, convertedFile);

        })

    }

    async createFiles() {
        if (!fs.existsSync("done")) {
            fs.mkdirSync(`done`, { recursive: true })
        }
        if (!fs.existsSync("files_to_convert")) {
            fs.mkdirSync(`files_to_convert`, { recursive: true })
        }
        console.log("Created files")
    }
}