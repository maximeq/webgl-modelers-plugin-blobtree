var fs = require('fs-extra');
var rollup = require('rollup');
var builtins = require('rollup-plugin-node-builtins');
var nodeglobals = require('rollup-plugin-node-globals');
var commonjs = require('rollup-plugin-commonjs');    // require
var resolve = require('rollup-plugin-node-resolve'); // require from node_modules
var terser = require('rollup-plugin-terser').terser; // minify
var prettier = require('rollup-plugin-prettier');

// clean previous build
fs.removeSync('/dist/browser/webgl-modelers-plugin-blobtree.js')
fs.removeSync('/dist/browser/webgl-modelers-plugin-blobtree.min.js')

async function build(inputOptions, outputOptions) {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // generate code and a sourcemap
    const { code, map } = await bundle.generate(outputOptions);

    // or write the bundle to disk
    await bundle.write(outputOptions);
}

/*******************************************
 *  Debug build
 ******************************************/

var external = [
    'webgl-modelers', 'three-full', 'three-js-blobtree', 'backbone', 'underscore'
];

var globals = {
    'webgl-modelers': 'WebGLModelers',
    'three-full' : 'THREE',
    'jquery' : '$',
    'underscore' : '_',
    'backbone' : 'Backbone',
    'three-js-blobtree' : 'Blobtree'
};

build({
    input: 'src/exports.js',
    plugins:  [ commonjs(), resolve() ],
    external: external,
}, {
    format: 'umd',
    name: 'WebGLModelersPluginBlobtree',
    file: './dist/browser/webgl-modelers-plugin-blobtree.js',
    globals: globals
});


/*******************************************
 *  Minified build
 ******************************************/

build({
    input: 'src/exports.js',
    plugins:  [
        commonjs(),
        resolve(),
        terser(),
        prettier({
          parser: 'babel',
          tabWidth: 0,
          singleQuote: false,
          bracketSpacing:false
        })
    ],
    external: external
}, {
    format: 'umd',
    name: 'WebGLModelersPluginBlobtree',
    file: './dist/browser/webgl-modelers-plugin-blobtree.min.js',
    globals: globals
});

