import { Vector3, BufferGeometry, BufferAttribute, type Ray, Group } from "three";
import { SceneManager } from "@dioxygen-software/webgl-modelers";
import { BlobtreeModel } from "../model/BlobtreeModel";

/**
 *  A SceneManager linked to a BlobtreeModel
 */

export class BlobtreeSceneManager extends SceneManager {
    declare model: BlobtreeModel;

    constructor(model: BlobtreeModel) {
        super(model);
        this.modelGroup = new Group();
    }

    /**
     *  Will return intersection with the blobtree.
     *  Use a ray to blob intersection, faster than Three raycaster.
     *
     *  @param precision Default to 0.001
     */
    override getSceneIntersections = (function () {
        const size = new Vector3();
        const center = new Vector3();
        const dcomputer = new Vector3();

        return function (this: BlobtreeSceneManager, ray: Ray, precision?: number) {
            const bt = this.model.getBlobtree();
            if (bt) {
                bt.prepareForEval();
                bt.getAABB().getSize(size);
                bt.getAABB().getCenter(center);
                const res: {
                    v: number;
                    g: Vector3;
                    step: number;
                    distance: number;
                    point: Vector3
                } = {
                    v: 0,
                    g: new Vector3(),
                    step: 0,
                    point: new Vector3(),
                    distance: Number.POSITIVE_INFINITY
                };
                dcomputer.subVectors(ray.origin, center);
                if (bt.intersectRayBlob(ray, res, dcomputer.length() + size.x + size.y + size.z, precision || 0.001)) {
                    const object = this.modelGroup.getObjectByName("blobtree");
                    if (object === undefined) throw "[BlobtreeSceneManager] getSceneIntersections : No blobtree mesh to intersect";

                    return [{
                        distance: res.distance,
                        object: object,
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
        const defaultG = new BufferGeometry();
        defaultG.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));// Avoid a JS Warning
        blobtreeFromGroup.geometry = defaultG;
        this.requireRender();
    };
}



