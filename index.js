#!/usr/bin/env node

/**
 * code_convert
 * start's converting a file to other language selected
 *
 * @author vaggos_Dev <https://github.com/vaggos-thanos>
 */

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

(async () => {
	init({ clear });
	input.includes(`help`) && cli.showHelp(0);

	debug && log(flags);
})();
