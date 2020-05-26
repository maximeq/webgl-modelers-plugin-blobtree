'use strict';

var WebGLModelers = require("webgl-modelers");

WebGLModelers.Plugins.Blobtree = {
    SimpleSMCWorker : require("./base/model/workers/SimpleSMCWorker"),
    BlobtreeSceneManager : require("./base/view/BlobtreeSceneManager"),
    BlobtreeModel : require("./base/model/BlobtreeModel")
};

Object.keys(WebGLModelers.Plugins.Blobtree).forEach(function(k){
    WebGLModelers.Plugins.Blobtree[k];
    WebGLModelers[k] = WebGLModelers.Plugins.Blobtree[k];
});

module.exports = WebGLModelers;