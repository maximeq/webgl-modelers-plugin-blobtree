import { Ray, Vector3 } from 'three';
import { SceneManager } from '@dioxygen-software/webgl-modelers';

/**
 *  This worker will execute a simple SlidingMarchingCubes on a given blobtree and return the geometry.
 *  Following libraries must be imported :
 *  three.js
 *  blobtree.js
 *
 *  Please add importScripts(pathToLib); to this worker code.
 *
 */
declare const SimpleSMCWorker: {
    code: string;
    /**
     *  Create a new SimpleSMCWorker
     *  @params {boolean} params.splitMax If true, the Blobtree.SplitmaxPolygonizer will be used instead of the simple SMC.
     */
    create: (params: any) => Worker;
};

/**
 *  The internal blobtree model of the modeler, in the MVC architecture.
 *  It contains :
 *  - the Blobtree instance.
 *  - the geometry computed from it. This could have been in the view, but since
 *    it is closely linked to the corresponding blobtree, it is kept here.
 *
 *  Can be extended with more geometries.
 *
 *  Events
 *      - gStatusChanged launched when a model geometry is changed.
 *        Contains : {
 *              type:'gStatusChanged',
 *              old:<old geometry status>,
 *              new:<new geometry status>,
 *              geometry:<the current geometry, can be outdated depending on current status>,
 *              obj:<the name of the object corresponding to this geometry>
 *          }
 *  TODO later will contain :
 *  - History of all modification
 */
declare const BlobtreeModel: any;

/**
 *  A SceneManager linked to a BlobtreeModel
 */
declare class BlobtreeSceneManager extends SceneManager {
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

export { BlobtreeModel, BlobtreeSceneManager, SimpleSMCWorker };
