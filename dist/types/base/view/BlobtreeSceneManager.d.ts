import { Vector3, type Ray } from "three";
import { SceneManager } from "@dioxygen-software/webgl-modelers";
import { BlobtreeModel } from "../model/BlobtreeModel";
/**
 *  A SceneManager linked to a BlobtreeModel
 */
export declare class BlobtreeSceneManager extends SceneManager {
    constructor(model: typeof BlobtreeModel);
    /**
     *  Will return intersection with the blobtree.
     *  Use a ray to blob intersection, faster than Three raycaster.
     *
     *  @param {number} precision Default to 0.001
     */
    getSceneIntersections: (ray: Ray, precision: number) => {
        distance: any;
        object: any;
        point: any;
        gradient: Vector3;
    }[];
    /**
     *  Function to clear the blobtree geometry.
     *  Should be used with care.
     */
    clearBlobtreeMesh(): void;
}
//# sourceMappingURL=BlobtreeSceneManager.d.ts.map