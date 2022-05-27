// Duplication checks

import { checkDependancy, checkThreeRevision } from "three-js-checker";
import * as WebglModelersPluginBlobtree from "./exports";
import { BufferGeometryUtils } from "@dualbox/three/examples/jsm/utils/BufferGeometryUtils";

const PACKAGE_NAME = "webgl-modelers-plugin-blobtree";

checkThreeRevision(PACKAGE_NAME, 130);

checkDependancy(
    PACKAGE_NAME,
    "WebglModelersPluginBlobtree",
    WebglModelersPluginBlobtree
);
checkDependancy(PACKAGE_NAME, "BufferGeometryUtils", BufferGeometryUtils);

// API re-export

export * from "./exports.js";
