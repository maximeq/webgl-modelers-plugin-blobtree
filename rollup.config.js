// import de nos plugins
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { uglify } from "rollup-plugin-uglify";

export default {
    input: './src/exports.js',
    output: {
        file: './dist/browser/webgl-modelers-plugin-blobtree.js',
        format: 'cjs'
    },
    external: ['three-full', 'three-js-blobtree', 'backbone', 'underscore'],
    plugins: [
        commonjs(), // prise en charge de require
        resolve(), // prise en charge des modules depuis node_modules
    ]
};