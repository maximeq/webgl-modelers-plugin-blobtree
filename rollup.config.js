import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const MODULE_NAME = "WebglModelersPluginBlobtree";
const MODULE_FILENAME = "webgl-modelers-plugin-blobtree";
const DIST = "./dist";

// external libs which must not be bundled

const externals = [
    "webgl-modelers",
    "three",
    "three-js-blobtree",
    "backbone",
    "underscore",
];

// globals where the external libs are expected (iife only)
const globals = {
    "webgl-modelers": "WebGLModelers",
    three: "THREE",
    jquery: "$",
    underscore: "_",
    backbone: "Backbone",
    "three-js-blobtree": "Blobtree",
};

export default {
    // entrypoint
    input: "./src/exports.js",

    // common options
    plugins: [
        commonjs(), // handles requires in CJS dependancies
        nodeResolve(), // resolves node_module dependancies
    ],
    external: externals,

    // specific options
    output: [
        {
            // for bundlers
            format: "esm",
            file: `${DIST}/${MODULE_FILENAME}.mjs`,
        },

        {
            // for node
            format: "cjs",
            file: `${DIST}/${MODULE_FILENAME}.cjs`,
        },

        {
            // for browser (debug)
            format: "iife",
            name: MODULE_NAME,
            globals: globals,
            file: `${DIST}/${MODULE_FILENAME}.js`,
            sourcemap: true, // for easier debugging in dev tools
        },

        {
            // for browser (minified)
            format: "iife",
            name: MODULE_NAME,
            globals: globals,
            file: `${DIST}/${MODULE_FILENAME}.min.js`,
            plugins: [
                terser(), // minify
            ],
        },
    ],
};
