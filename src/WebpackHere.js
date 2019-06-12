const Process = require('child_process');
const Path = require('path');
const FS = require('fs');
const Webpack = require('webpack');
const LogOnCompile = require('./LogOnCompile');
const NotifyPHPStormOnCompile = require('./NotifyPHPStormOnCompile');
const ROOT = Path.resolve(__dirname + '/..');

class WebpackHere {
	static Run() {
		const wh = new WebpackHere(process.cwd(), process.argv.slice(2));

		return wh.execute();
	}

	constructor(cwd, args) {
		const namedParamRegex = /^--([-a-zA-Z0-9]+)=(.*)/;

		this.cwd = cwd;
		this.args = args.filter(x => !namedParamRegex.test(x));
		this.namedArgs = {};

		const namedArgs = args.filter(x => namedParamRegex.test(x));

		for(const arg of namedArgs) {
			let [,name, value] = namedParamRegex.exec(arg);
			value = value.replace(/^C:\/Git\//, '/');

			this.namedArgs[name] = value;
		}

		console.log('WebpackHere started');
		console.log(this.cwd);
		console.log(this.args);
		console.log(this.namedArgs);
		console.log('');
	}

	get assertedPublicPath() {
		let dir = this.cwd;
		let subdirs = [];

		while(Path.basename(dir)) {
			if(FS.existsSync(Path.join(dir, '.idea'))) {
				return '/' + subdirs.reverse().join('/');
			}

			subdirs.push(Path.basename(dir));
			dir = Path.dirname(dir);
		}

		console.log('Unknown public path, asserting /');

		return '/';
	}

	get entryFile() { return (this.args[0] || `${Path.basename(this.cwd)}.jsx`); }
	get outputFile() { return (this.args[1] || `${Path.basename(this.cwd)}.js`); }

	get publicPath() {
		return this.namedArgs['publicPath'] || this.assertedPublicPath;
	}

	get nodeModules() {
		return ROOT + '/node_modules';
	}

	get webpackExecutable() {
		return ROOT + '/node_modules/.bin/webpack.cmd';
	}

	get webpackParams() {
		return ['-w', '--config', this.webpackHereConfigFile, ...this.webpackHereConfigParams];
	}

	get webpackHereConfigFile() {
		return ROOT + '/webpack-here.js';
	}

	get webpackHereConfig() {
		const {entryFile, outputFile, publicPath} = this;
		return {entryFile, outputFile, publicPath};
	}

	get webpackHereConfigParams() {
		return ['--env.webpackHereConfig=' + JSON.stringify(this.webpackHereConfig)];
	}

	runInstance() {
		this.debugInfo();

		console.log('Running webpack');
		console.log('');
		console.log('-----------------------------------------------');

		const instance = Process.spawn(`${this.webpackExecutable}`, [
			...this.webpackParams,
		]);

		instance.stdout.on('data', data => console.log(data.toString().replace(/\n$/g, '')));
		instance.stderr.on('data', data => console.error(data.toString().replace(/\n$/g, '')));

		instance.on('error', error => {
			console.log('-----------------------------------------------');
			console.error(error.toString());
			process.exit();
		});

		instance.on('exit', (code) => {
			console.log('-----------------------------------------------');
			console.log(`child process exited with code ${code}`);
			process.exit();
		});
	}

	debugInfo() {
		console.log('CWD:', this.cwd);
		console.log('ENTRY:', this.entryFile);
		console.log('OUTPUT:', this.outputFile);
		console.log('PUBLIC:', this.publicPath);
	}

	printHelp() {
		console.log('Usage:');
		console.log('\twebpack-here, wh');
		console.log('\tThis is a default usage. It will generate a `dirname.js` file with entry of `dirname.jsx`');
		console.log('');
		console.log('\twebpack-here [entryFile.jsx] [outputFile.js] [--publicPath=/public/path/]');
		console.log('\tThis command will generate a `outputFile.js` file with entry of `entryFile.jsx`');
	}

	generateConfig(env) {
		const cfg = JSON.parse(env.webpackHereConfig);

		return {
			mode: 'none',
			entry: `${this.cwd}\\${cfg.entryFile}`,
			output: {
				path: this.cwd,
				filename: cfg.outputFile,
				chunkFilename: cfg.outputFile.replace(/\.js$/, '.[name].js'),
				publicPath: cfg.publicPath,
			},
			cache: {},
			devtool: false,
			resolve: {
				modules: ['node_modules', this.nodeModules],
				extensions: [".jsx", ".webpack.js", ".web.js", ".js", ".json"],
			},
			resolveLoader: {
				modules: ['node_modules', this.nodeModules],
			},
			watchOptions: {
				ignored: [`/node_modules/`],
			},
			plugins: [
				new Webpack.HashedModuleIdsPlugin(),
				new LogOnCompile('WebpackHere'),
				new NotifyPHPStormOnCompile(`${this.cwd}\\${cfg.outputFile}`),
			],
			stats: {
				all: false,
				colors: true,
				errors: true,
				// errorDetails: true,
				performance: true,
				timings: false,
				warnings: true,
			},
			module: {
				rules: [{
					test: /.jsx?$/,
					loader: 'babel-loader',
					exclude: /node_modules/,
					query: {
						presets: [
							require("@babel/preset-react"),
							require("@babel/preset-env"),
						],
						plugins: [
							require('babel-plugin-dynamic-import-webpack'),
							require('@babel/plugin-external-helpers'),
							require('@babel/plugin-syntax-async-generators'),
							[require("@babel/plugin-proposal-decorators"), { legacy: true }],
							require('@babel/plugin-proposal-class-properties'),
							require('@babel/plugin-proposal-object-rest-spread'),
							require('@babel/plugin-transform-regenerator'),
							require('@babel/plugin-transform-runtime'),
						]
					}
				}]
			}
		};
	}

	get isConfigMode() {
		return /webpack-here\.js$/.test(process.argv[1]) === false;
	}

	execute() {
		if(process.argv.indexOf('--help') >= 0) {
			return this.printHelp();
		}

		if(this.isConfigMode) {
			return this.generateConfig.bind(this);
		}

		return this.runInstance();
	}
}

module.exports = WebpackHere.Run();