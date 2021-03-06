const Process = require('child_process');
const Path = require('path');
const FS = require('fs');
const Webpack = require('webpack');
const LogOnCompile = require('./LogOnCompile');
const NotifyPHPStormOnCompile = require('./NotifyPHPStormOnCompile');
const TouchOnCompile = require('./TouchOnCompile');
const ROOT = Path.resolve(__dirname + '/..');

const injectDependency = function(name) {
	return require(name).default;
};

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
		this.debug = args.indexOf('--debug') >= 0;

		const namedArgs = args.filter(x => namedParamRegex.test(x));

		for(const arg of namedArgs) {
			let [,name, value] = namedParamRegex.exec(arg);
			value = value.replace(/^C:\/Git\//, '/');

			this.namedArgs[name] = value;
		}

		console.log('WebpackHere started', this.debug ? 'in DEBUG mode' : '');
		console.log(this.cwd);
		console.log(this.args);
		console.log(this.namedArgs);
		console.log('');
	}

	get assumedPublicPath() {
		let dir = this.cwd;
		let subdirs = [];

		while(Path.basename(dir)) {
			if(FS.existsSync(Path.join(dir, '.idea')) || FS.existsSync(Path.join(dir, '.git'))) {
				return '/' + subdirs.reverse().join('/') + '/';
			}

			subdirs.push(Path.basename(dir));
			dir = Path.dirname(dir);
		}

		console.log('Unknown public path, asserting /');

		return '/';
	}

	get defaultRestartFile() {
		if(process.platform === 'win32') {
			return false;
		}

		return Path.resolve(this.cwd, 'tmp', 'restart.txt');
	}

	get entryFile() { return (this.args[0] || `${Path.basename(this.cwd)}.jsx`); }
	get outputFile() { return (this.args[1] || `${Path.basename(this.cwd)}.js`); }
	get restartFile() { return this.namedArgs['restartFile'] || this.defaultRestartFile; }

	get publicPath() {
		return this.namedArgs['publicPath'] || this.assumedPublicPath;
	}

	get customConfigFile() {
		return this.namedArgs['customConfig'] || '.webpack-here.config.js';
	}

	get nodeModules() {
		return [
			Path.resolve(ROOT + '/..'),
			ROOT + '/node_modules'
		];
	}

	get webpackExecutable() {
		let executable = '/node_modules/.bin/webpack';

		if(process.platform === 'win32') {
			executable += '.cmd';
		}

		if(FS.existsSync(ROOT + executable)) {
			return ROOT + executable;
		}

		return ROOT + '/../../' + executable;
	}

	get webpackParams() {
		return ['-w', '--config', this.webpackHereConfigFile, ...this.webpackHereConfigParams];
	}

	get webpackHereConfigFile() {
		return ROOT + '/webpack-here.js';
	}

	get webpackHereConfig() {
		const {entryFile, outputFile, restartFile, publicPath, customConfigFile, debug} = this;
		return {entryFile, outputFile, restartFile, publicPath, customConfigFile, debug};
	}

	get webpackHereConfigParams() {
		return ['--env.webpackHereConfig=' + JSON.stringify(this.webpackHereConfig)];
	}

	get baseConfig() {
		return {
			mode: 'none',
			cache: {},
			devtool: false,
			resolve: {
				modules: ['node_modules', ...this.nodeModules],
				extensions: [".jsx", ".webpack.js", ".web.js", ".js", ".json"],
			},
			resolveLoader: {
				modules: ['node_modules', ...this.nodeModules],
			},
			watchOptions: {
				ignored: [`/node_modules/`],
			},
			plugins: [
				new Webpack['HashedModuleIdsPlugin'](),
				new LogOnCompile('WebpackHere'),
			],
			stats: {
				all: false,
				colors: true,
				errors: true,
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
							injectDependency("@babel/preset-react"),
							injectDependency("@babel/preset-env"),
						],
						plugins: [
							injectDependency('babel-plugin-dynamic-import-webpack'),
							injectDependency('@babel/plugin-external-helpers'),
							injectDependency('@babel/plugin-syntax-async-generators'),
							[injectDependency("@babel/plugin-proposal-decorators"), { legacy: true }],
							[injectDependency('@babel/plugin-proposal-class-properties'), { loose : true }],
							injectDependency('@babel/plugin-proposal-object-rest-spread'),
							injectDependency('@babel/plugin-transform-regenerator'),
							injectDependency('@babel/plugin-transform-runtime'),
						]
					}
				}]
			}
		};
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
		console.log('\twebpack-here [entryFile.jsx] [outputFile.js] [--publicPath=/public/path/] [--customConfig=.webpack-here.config.js]');
		console.log('\tThis command will generate a `outputFile.js` file with entry of `entryFile.jsx`');
	}

	generateLocalOverride(env, params) {
		const entryFile = Path.resolve(this.cwd, params.entryFile);
		const outputFile = Path.resolve(this.cwd, params.outputFile);

		const plugins = [];

		if(process.platform === 'win32') {
			plugins.push(new NotifyPHPStormOnCompile(outputFile));
		}

		if(params.restartFile) {
			plugins.push(new TouchOnCompile(Path.resolve(this.cwd, params.restartFile)));
		}

		return {
			"entry": entryFile,
			"output": {
				path: this.cwd,
				filename: params.outputFile,
				chunkFilename: params.outputFile.replace(/\.js$/, '.[name].js'),
				publicPath: params.publicPath,
			},
			"plugins[]": plugins,
		};
	}

	generateConfig(env) {
		const whConfig = JSON.parse(env.webpackHereConfig);

		// Generate base config with defaut overrides (entry, output)
		let config = this.applyOverride(this.baseConfig, this.generateLocalOverride(env, whConfig));

		const customConfigFile = Path.resolve(whConfig.customConfigFile);

		if(FS.existsSync(customConfigFile)) {
			console.log('Applying custom config override from', customConfigFile);

			// We've got user override -- apply it
			config = this.applyOverride(config, require(customConfigFile));
		}

		if(whConfig.debug) {
			console.log(config);
			process.exit();
		}

		return config;
	}

	/**
	 * @typedef {String} OverridePath
	 * Dot-separated list of keys, optionally can end with [] to merge instead of override subtree
	 * Examples:
	 *   * `"some.test.path"` - replace `config.some.test.path` with passed value
	 *   * `"some.existingArrayProp[]"` - array-merge ([...original, ...passed]) passed value with `config.some.arrayProp` key
	 *   * `"some.existingObjectProp[]"` - object-merge ({...original, ...passed}) passed value with `config.some.arrayProp` key
	 *   * `"some.nonExistingProp"` - adds a key `nonExistingProp` into `config.some` object
	 *   * `"some.nonExistingProp[]"` - same as above.
	 *   * `"nonExistingLevelOneProp.some.deep.path"` - creates a subtree like `{some:{deep:path: passedValue }}` and adds it as `config.nonExistingLevelOneProp`.
	 *
	 * If original value exists, it determines a merge type. Otherwise new key will be added.
	 */
	/**
	 * @typedef {Object.<OverridePath, *>} Override
	 */
	/**
	 * Applies override to an object.
	 *
	 * @param {Object} config
	 * @param {Override} override
	 */
	applyOverride(config = {}, override = {}) {
		for(const path of Object.keys(override)) {
			const keys = path.split('.');

			let i = 0;
			let subtree = config;
			let value = override[path];

			for(const originalKey of keys) {
				const isLast = i++ === keys.length - 1;
				const merge = /(.*)\[]$/.exec(originalKey);

				let isMerge = false;
				let key = originalKey;

				if(isLast && merge) {
					isMerge = true;
					key = merge[1];
				}

				if(!key) {
					throw new Error('Empty key was encountered in "' + path + '" key of user override');
				}

				if(key in subtree === false) {
					// Check if the subtree should be an array.
					// NOTE: `i` is already incremented, so we don't need `i + 1` to get next key

					if(!isLast && /^\d+$/.test(keys[i])) {
						// This is not the last element and the next key is a digit
						subtree[key] = [];
					} else if(isMerge && Array.isArray(value)) {
						// This is the last element and we're in merge mode and value is an array
						subtree[key] = [];
					} else {
						// Otherwise treat it like an object
						subtree[key] = {};
					}
				}

				if(!isLast) {
					// We need to go deeper!
					subtree = subtree[key];
					continue;
				}


				if(!isMerge) {
					// We're not in merge mode so just overwrite the value and bail out.
					subtree[key] = value;
					break;
				}

				// We're in merge mode, so we should determine merge type from `subtree[key]` type
				if(Array.isArray(subtree[key])) {
					// Merge as array
					subtree[key] = [
						...subtree[key],
						...value,
					];
				} else {
					// Merge as object
					subtree[key] = {
						...subtree[key],
						...value,
					};
				}

				break;
			}
		}

		return config;
	}

	get isConfigMode() {
		if(process.platform === 'win32') {
			return /webpack-here\.js$/.test(process.argv[1]) === false;
		}

		return /webpack-here$/.test(process.argv[1]) === false;
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