// const commandLineUsage = require('command-line-usage')

// const sections = [
//   {
//     header: 'Example App',
//     content: 'Generates something [italic]{very} important.'
//   },
//   {
//     header: 'Synopsis',
//     content: '$ app <options> <command>'
//   },
//   {
//     header: 'Command List',
//     content: [
//       { name: 'help', summary: 'Display help information about Git.' },
//       { name: 'commit', summary: 'Record changes to the repository.' },
//       { name: 'Version', summary: 'Print the version.' },
//       { name: 'etc', summary: 'Etc.' }
//     ]
//   }
// ]

// const usage = commandLineUsage(sections)
// console.log(usage)


const commandLineCommands = require('command-line-commands')
 
const validCommands = [ null, 'clean', 'update', 'install' ]
const { command, argv } = commandLineCommands(validCommands)
 
/* print the command and remaining command-line args */
console.log('command: %s', command)
console.log('argv:    %s', JSON.stringify(argv))

if (command === null) {
    const commandLineArgs = require('command-line-args')
    const optionDefinitions = [
      { name: 'version', type: Boolean }
    ]
   
    // pass in the `argv` returned by `commandLineCommands()`
    const options = commandLineArgs(optionDefinitions, { argv })
   
    if (options.version) {
      console.log('version 1.0.1')
    }
}