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
export declare const SimpleSMCWorker: {
    code: string;
    /**
     *  Create a new SimpleSMCWorker
     *  @params {boolean} params.splitMax If true, the Blobtree.SplitmaxPolygonizer will be used instead of the simple SMC.
     */
    create: (params: CreateWorkerParams) => Worker;
};
export {};
//# sourceMappingURL=SimpleSMCWorker.d.ts.map