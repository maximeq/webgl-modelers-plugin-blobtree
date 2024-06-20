import { Vector3, type Ray, Object3D, Group } from "three";
import { SceneManager } from "@dioxygen-software/webgl-modelers";
import { BlobtreeModel } from "../model/BlobtreeModel";
/**
 *  A SceneManager linked to a BlobtreeModel
 */
export declare class BlobtreeSceneManager extends SceneManager {
    model: typeof BlobtreeModel;
    modelGroup: Group;
    constructor(model: typeof BlobtreeModel);
    /**
     *  Will return intersection with the blobtree.
     *  Use a ray to blob intersection, faster than Three raycaster.
     *
     *  @param precision Default to 0.001
     */
    getSceneIntersections: (this: BlobtreeSceneManager, ray: Ray, precision: number) => {
        distance: null;
        object: Object3D | undefined;
        point: null;
        gradient: Vector3;
    }[];
    /**
     *  Function to clear the blobtree geometry.
     *  Should be used with care.
     */
    clearBlobtreeMesh(): void;
}
//# sourceMappingURL=BlobtreeSceneManager.d.ts.map