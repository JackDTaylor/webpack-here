const FS = require('fs');

module.exports = class NotifyPHPStormOnCompile {
	constructor(outputFile) {
		this.outputFile = outputFile;
	}

	apply(compiler) {
		compiler.plugin('done', fn => {
			setTimeout(fn => {
				const fileA = this.outputFile;
				const fileB = this.outputFile + '.';

				FS.renameSync(fileA, fileB);
				FS.renameSync(fileB, fileA);
			}, 100);
		});
	}
}