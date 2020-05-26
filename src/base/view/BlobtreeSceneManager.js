'use strict';

var WebGLModelers = require("webgl-modelers");

const THREE = require("three-full");
const BlobtreeModel = require("../model/BlobtreeModel");

const SceneManager = WebGLModelers.SceneManager;

/**
 *  A SceneManager linked to a BlobtreeModel
 *  @param {ModelerModel} model
 */
var BlobtreeSceneManager = function(model) {
    SceneManager.call(this, model);

    this.emptyG = new THREE.BufferGeometry();
    this.emptyG.addAttribute('position',new THREE.BufferAttribute(new Float32Array([0,0,0,0,0,0,0,0,0]), 3));// Avoid a THREE.JS Warning

    // Init with a Blobtree Mesh
    var m = new THREE.Mesh(
        this.emptyG,
        this.surfaceMat
    );
    m.receiveShadow = true;
    m.castShadow = true;
    m.name = "blobtree";
    this.addMesh(m);

};
BlobtreeSceneManager.prototype = Object.create( SceneManager.prototype );
BlobtreeSceneManager.prototype.constructor = BlobtreeSceneManager;

/**
 *  Will return
 *  @param {number} precision DEfault to 0.001
 */
BlobtreeSceneManager.prototype.getSceneIntersections = (function(){
    var size = new THREE.Vector3();
    var center = new THREE.Vector3();
    var dcomputer = new THREE.Vector3();

    return function(ray, precision){
        var bt = this.model.getBlobtree();
        if(bt){
            bt.prepareForEval();
            bt.getAABB().getSize(size);
            bt.getAABB().getCenter(center);
            var res = {
                v:0,
                g : new THREE.Vector3(),
                step:0
            };
            dcomputer.subVectors(ray.origin,center);
            if(bt.intersectRayBlob(ray,res,dcomputer.length()+size.x+size.y+size.z,precision || 0.001)){
                return [{
                    distance:   res.distance,
                    object:     this.meshGroup.getObjectByName("blobtree"),
                    point:      res.point,
                    gradient:   res.g
                }];
            }
        }
        return [];
    };
})();

/**
 *  Function to clear the blobtree geometry.
 *  Should be used with care.
 */
BlobtreeSceneManager.prototype.clearBlobtreeMesh = function(){
    this.meshGroup.getObjectByName("blobtree").geometry.dispose();
    this.meshGroup.getObjectByName("blobtree").geometry = this.emptyG;
    this.requireRender();
};


module.exports = BlobtreeSceneManager;
