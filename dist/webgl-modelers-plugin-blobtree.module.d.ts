import * as three from 'three';
import { BufferGeometry, Ray, Vector3 } from 'three';
import { SceneManager } from '@dioxygen-software/webgl-modelers';
import Backbone from 'backbone';
import { RootNode, ElementJSON, Element, Node } from '@dioxygen-software/three-js-blobtree';

type CreateWorkerParams = {
    libpaths: {
        name: string;
        url: string;
    }[];
    splitMax: boolean;
};
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
    create: (params: CreateWorkerParams) => Worker;
};

/**
 * Options for the model
 *  @property workerize If true, geometry computation will execute in a worker.
 *  @property libpaths If workerize is true, then this must contains paths to all necessary libraries.
 *                                   This includes but may not be limited to three.js, blobtree.js.
 *                                   It's an object and not an array since we may want to add checking on keys later.
 */
type BlobtreeModelOptions = {
    workerize: boolean;
    libpaths: {
        name: string;
        url: string;
    }[];
    splitMaxPolygonizer: boolean;
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
declare class BlobtreeModel extends Backbone.Model {
    blobtree: RootNode;
    blobGeom: BufferGeometry;
    gStatus: string;
    processTimeout: NodeJS.Timeout | null;
    processId: string | null;
    workerize: boolean;
    worker: Worker | null | undefined;
    libpaths: {
        name: string;
        url: string;
    }[] | undefined;
    splitMaxPolygonizer: boolean;
    /**
     *  @param attrs Can be empty // TODO : check if we can remove this
     *  @param options Options for this model
     */
    constructor(attrs: Object, options: BlobtreeModelOptions);
    toJSON(): ElementJSON;
    fromJSON(json: ElementJSON): void;
    getBlobtree(): RootNode;
    setBlobtree(bt: RootNode): void;
    /**
     * @return the blobtree computed geometry if this.getGStatus == GSTATUS.UP_TO_DATE, null otherwise.
     *
     */
    getGeometry(): BufferGeometry | null;
    /**
     *  Add an element to the blobtree.
     *  Can be a Node or a Primitive.
     *  @param parent If null, the element will be directly attached to the root.
     */
    addBlobtreeElement(element: Element, parent: Node): void;
    _invalidGeometry(): void;
    getGStatus(): string;
    _setGStatus(s: string, data?: number): void;
    /**
     * Generate a unique id for a computing job.
     * Note : Can take up to 1 ms because of the methode used, if you need to generate a lot, change the method.
     */
    _generateProcessID: () => string;
    clearWorker(): void;
    /**
     *  Update the blobtree geometry (async).
     *  Note that this will only trigger computation if the geometry is out dated.
     *  If a changed occurs in the blobtree before the computation is done, the geometry status will return to MainModeler.GSTATUS.OUTDATED and computation will abort.
     *  @return a unique ID
     */
    updateGeometries(): string | null;
}

/**
 *  A SceneManager linked to a BlobtreeModel
 */
declare class BlobtreeSceneManager extends SceneManager {
    model: BlobtreeModel;
    constructor(model: BlobtreeModel);
    /**
     *  Will return intersection with the blobtree.
     *  Use a ray to blob intersection, faster than Three raycaster.
     *
     *  @param precision Default to 0.001
     */
    getSceneIntersections: (this: BlobtreeSceneManager, ray: Ray, precision?: number) => {
        distance: number;
        object: three.Object3D;
        point: Vector3;
        gradient: Vector3;
    }[];
    /**
     *  Function to clear the blobtree geometry.
     *  Should be used with care.
     */
    clearBlobtreeMesh(): void;
}

export { BlobtreeModel, BlobtreeSceneManager, SimpleSMCWorker };
