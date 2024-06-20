import { Vector3, BufferGeometry, BufferAttribute, type Ray, Object3D, Group } from "three";
import { SceneManager } from "@dioxygen-software/webgl-modelers";
import { BlobtreeModel } from "../model/BlobtreeModel";

/**
 *  A SceneManager linked to a BlobtreeModel
 */

export class BlobtreeSceneManager extends SceneManager {
    model: typeof BlobtreeModel;
    modelGroup: Group;

    constructor(model: typeof BlobtreeModel) {
        super(model);
        this.modelGroup = new Group();
    }

    /**
     *  Will return intersection with the blobtree.
     *  Use a ray to blob intersection, faster than Three raycaster.
     *
     *  @param precision Default to 0.001
     */
    getSceneIntersections = (function () {
        var size = new Vector3();
        var center = new Vector3();
        var dcomputer = new Vector3();

        return function (this: BlobtreeSceneManager, ray: Ray, precision: number) {
            var bt = this.model.getBlobtree();
            if (bt) {
                bt.prepareForEval();
                bt.getAABB().getSize(size);
                bt.getAABB().getCenter(center);
                var res = {
                    v: 0,
                    g: new Vector3(),
                    step: 0,
                    distance: null,
                    point: null
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
    clearBlobtreeMesh() {
        const blobtreeFromGroup = this.modelGroup.getObjectByName("blobtree");
        if (blobtreeFromGroup === undefined)
            throw "[BlobtreeSceneManager] clearBlobtreeMesh : No blobtree mesh to clear";
        if (!("geometry" in blobtreeFromGroup && blobtreeFromGroup.geometry instanceof BufferGeometry))
            throw "[BlobtreeSceneManager] clearBlobtreeMesh : No geometry in the blobtree mesh or mistyped geometry. This should not happen";
        blobtreeFromGroup.geometry.dispose();
        var defaultG = new BufferGeometry();
        defaultG.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));// Avoid a JS Warning
        blobtreeFromGroup.geometry = defaultG;
        this.requireRender();
    };
}



