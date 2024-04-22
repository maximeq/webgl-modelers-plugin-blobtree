import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import del from 'rollup-plugin-delete'
import { dts } from "rollup-plugin-dts";

const PACKAGE_NAME = "webgl-modelers-plugin-blobtree"

export default [
    // bundle code
    {
        input: { 'module': "./src/exports.ts" },
        plugins: [
            del({ targets: 'dist/*' }),
            typescript(),
            commonjs(),
            nodeResolve(),
        ],
        external: [
            /node_modules/,
            new RegExp(`${PACKAGE_NAME}/submodules`)
        ],
        output: [
            {
                dir: `./dist`,
                entryFileNames: `${PACKAGE_NAME}.[name].js`,
                format: "esm",
                sourcemap: true,
            },
        ],
    },

    // bundle types
    {
        input: "./dist/types/exports.d.ts",
        output: [{ file: `dist/${PACKAGE_NAME}.module.d.ts`, format: "es" }],
        plugins: [dts()],
    }
]
