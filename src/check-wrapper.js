// Duplication checks

import { checkDependancy, checkThreeRevision } from "dioxygen-resources";
import * as WebglModelersPluginBlobtree from "./exports";
import {BufferGeometryUtils} from "@dualbox/three/examples/jsm/utils/BufferGeometryUtils";

const PACKAGE_NAME = "webgl-modelers-plugin-blobtree";

checkThreeRevision(PACKAGE_NAME, 130);

checkDependancy(PACKAGE_NAME, "WebglModelersPluginBlobtree", WebglModelersPluginBlobtree);
checkDependancy(PACKAGE_NAME, "BufferGeometryUtils", BufferGeometryUtils);

// Side-effects on WebGlModelers

import WebGLModelers from "webgl-modelers";
import {SimpleSMCWorker, BlobtreeModel, BlobtreeSceneManager} from "./exports";

WebGLModelers.Plugins.Blobtree = {
    SimpleSMCWorker: SimpleSMCWorker,
    BlobtreeSceneManager: BlobtreeSceneManager,
    BlobtreeModel: BlobtreeModel
};

Object.keys(WebGLModelers.Plugins.Blobtree).forEach(function(k) {
    WebGLModelers.Plugins.Blobtree[k];
    WebGLModelers[k] = WebGLModelers.Plugins.Blobtree[k];
});

export default WebGLModelers;
