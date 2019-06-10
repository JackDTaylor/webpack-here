module.exports = class LogOnCompile {
	constructor(message, doClear = false) {
		this.doLog('\x1B[2J\x1B[0f');
		this.message = message;
		this.doClear = doClear;
		this.wasCleared = false;
	}

	doLog(...args) {
		console.log(new Date().toLocaleTimeString() + ':', ...args);
	}

	apply(compiler) {
		let me = this;

		compiler.plugin('done', function({compilation, hash, startTime, endTime }) {
			if(me.doClear && me.wasCleared == false) {
				me.doLog('\x1B[2J\x1B[0f');
				me.wasCleared = true;
			}
			let status = compilation.errors.length ? "\x1b[1m\x1b[31mfailed\x1b[0m\x1b[30m" : 'done';

			console.log(
				'\x1b[30m' +
				new Date().toLocaleTimeString() + ':',
				'\x1b[36m' + me.message + '\x1b[30m',
				status,
				'in', (endTime - startTime) + 'ms');
		});
	}
}
