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
```wepack-here [source-file [destination-file]] [--publicPath=/public/path/]```

### Usage with IDE's autoupload feature
If you're uploading files on save, the resulting `{your-project}.js` file won't 
be uploaded since it will be ready **a fraction of a second after** the `.jsx` 
file was saved. Since the output file is changing by **external** program (Webpack in this case),
IDE cannot predict when it should refresh the project base directory.

To workaround this issue in PHPStorm I've wrote
[a small script](https://github.com/JackDTaylor/phpstorm-resfresh-project-basedir)
to use with ScriptMonkey extension.

### Minification and sourcemaps
I intentionally turned minification and sourcemaps off to reduce build time. Configuration options are planned but not implemented yet.