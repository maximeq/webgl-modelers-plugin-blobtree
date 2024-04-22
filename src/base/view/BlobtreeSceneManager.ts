import { Vector3, BufferGeometry, BufferAttribute } from "three";
import { SceneManager } from "@dioxygen-software/webgl-modelers";

/**
 *  A SceneManager linked to a BlobtreeModel
 *  @param {BlobtreeModel} model
 */
export const BlobtreeSceneManager = function (model) {
    SceneManager.call(this, model);
};
BlobtreeSceneManager.prototype = Object.create(SceneManager.prototype);
BlobtreeSceneManager.prototype.constructor = BlobtreeSceneManager;

/**
 *  Will return intersection with the blobtree.
 *  Use a ray to blob intersection, faster than Three raycaster.
 *
 *  @param {number} precision Default to 0.001
 */
BlobtreeSceneManager.prototype.getSceneIntersections = (function () {
    var size = new Vector3();
    var center = new Vector3();
    var dcomputer = new Vector3();

    return function (ray, precision) {
        var bt = this.model.getBlobtree();
        if (bt) {
            bt.prepareForEval();
            bt.getAABB().getSize(size);
            bt.getAABB().getCenter(center);
            var res = {
                v: 0,
                g: new Vector3(),
                step: 0
            };
            dcomputer.subVectors(ray.origin, center);
            if (bt.intersectRayBlob(ray, res, dcomputer.length() + size.x + size.y + size.z, precision || 0.001)) {
                return [{
                    distance: res.distance,
                    object: this.modelGroup.getObjectByName("blobtree"),
                    point: res.point,
                    gradient: res.g
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
BlobtreeSceneManager.prototype.clearBlobtreeMesh = function () {
    this.modelGroup.getObjectByName("blobtree").geometry.dispose();
    var defaultG = new BufferGeometry();
    defaultG.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));// Avoid a JS Warning
    this.modelGroup.getObjectByName("blobtree").geometry = defaultG;
    this.requireRender();
};