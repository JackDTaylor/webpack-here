const fs = require('fs');

module.exports = class TouchOnCompile {
	constructor(filePath) {
		this.filePath = filePath;
	}

	apply(compiler) {
		const filePath = this.filePath;

		compiler.plugin('done', function() {
			fs.closeSync(fs.openSync(filePath, 'w'));

			setTimeout(function() {
				console.log('\x1b[33m' + new Date().toLocaleTimeString() + ':', '[SERVER RESTART]\x1b[0m');
			}, 10);
		});
	}
};