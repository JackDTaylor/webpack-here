# Webpack Here
Quickly convert `.jsx` with decorators and class properties into browser-safe `.js` file.

### Plugins and presets
[Webpack](https://npmjs.com/package/webpack) is using [babel-loader](https://npmjs.com/package/babel-loader) to 
build your code with the following presets:
* [@babel/preset-react](https://npmjs.com/package/@babel/preset-react)
* [@babel/preset-env](https://npmjs.com/package/@babel/preset-env)

And plugins:
* [babel-plugin-dynamic-import-webpack](https://npmjs.com/package/babel-plugin-dynamic-import-webpack)
* [@babel/plugin-external-helpers](https://npmjs.com/package/@babel/plugin-external-helpers)
* [@babel/plugin-syntax-async-generators](https://npmjs.com/package/@babel/plugin-syntax-async-generators)
* [@babel/plugin-proposal-decorators](https://npmjs.com/package/@babel/plugin-proposal-decorators)
* [@babel/plugin-proposal-class-properties](https://npmjs.com/package/@babel/plugin-proposal-class-properties)
* [@babel/plugin-proposal-object-rest-spread](https://npmjs.com/package/@babel/plugin-proposal-object-rest-spread)
* [@babel/plugin-transform-regenerator](https://npmjs.com/package/@babel/plugin-transform-regenerator)
* [@babel/plugin-transform-runtime](https://npmjs.com/package/@babel/plugin-transform-runtime)

### Installation
It is recommended to install **webpack-here** globally:

```npm install -g webpack-here```

### Usage
```wepack-here [source-file [destination-file]] [--publicPath=/public/path/] [--customConfig=.webpack-here.config.js]```

### Usage with IDE's autoupload feature
If you're uploading files on save, the resulting `{your-project}.js` file won't 
be uploaded since it will be ready **a fraction of a second after** the `.jsx` 
file was saved. Since the output file is changing by **external** program (Webpack in this case),
IDE cannot predict when it should refresh the project base directory.

To workaround this issue in PHPStorm I've wrote
[a small script](https://github.com/JackDTaylor/phpstorm-resfresh-project-basedir)
to use with ScriptMonkey extension.

### Minification and sourcemaps
I intentionally turned minification and sourcemaps off to reduce build time. 
You can override it in your local `.webpack-here.config.js` file.

### Public path for `babel-plugin-dynamic-import-webpack`
If you want to use dynamic imports, you need to make sure `output.publicPath` option is set correctly.

By default `webpack-here` tries to assume a public path using your Git root or IntelliJ IDEA project root.
Otherwise it will use `/` as public path.

You can override public path by passing a `--publicPath` argument to to `webpack-here` like so:
```bash
webpack-here --publicPath=/my/public/path
```

### User config
If you need to override some config options, you can create a `.webpack-here.config.js`
file in your root directory. You can change the file name by passing `--customConfig` argument to `webpack-here` like so:
```bash
webpack-here --customConfig=relative/path/to/my-webpack-here-config.js
```

User config should export an object with the following structure:
```
module.exports = {
	<SomeOverrideKey>: <someValue>,
	<OtherOverrideKey>: <someOtherValue>,
}
```
**Override key** is a string with dot-separated path to override, e.g. `"module.rules.0.test"`.
You can end key with `[]` to merge instead of replace, e.g. `"module.rules[]"`. Merge type (object 
or array) is determined by original value type (or by your value type if original doesn't exist).

Here're some examples:
```javascript
module.exports = {
	// Replace babel-loader without touching other params:
	"module.rules.0.loader": "custom-babel-loader",
	
	// Replace babel-loader plugins completely:
	"module.rules.0.query.plugins": ["@babel/plugin-the-only-plugin-i-need"],
	
	// Add babel-loader plugin:
	"module.rules.0.query.plugins[]": [ "@babel/plugin-some-additional-plugin" ],
	
	// Add second loader without touching Babel:
	"module.rules[]": [ { test: /\.(xls|xlsx|csv)$/, loader: "my-custom-spreadsheet-loader" } ],
	
	// Turn on error details without changing other `stats` options:
	"stats.errorDetails": true,
	
	// If you don't need a deep merge, just treat this object like a regular webpack config:
	cache: false,
	devtool: "eval-cheap-module-source-map",
	entry: [
		'path/to/some-entry-file.js',
		'path/to/some-other-entry-file.js'
	],
	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				sourceMap: true,
				uglifyOptions: {
					compress: { inline: false, drop_console: true },
				},
			}),
		],
	},
};
