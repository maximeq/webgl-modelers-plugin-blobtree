import { BufferGeometry, BufferAttribute } from "three";
import Backbone from "backbone";
import { GSTATUS } from "@dioxygen-software/webgl-modelers";
import { RootNode, Types, SplitMaxPolygonizer, SlidingMarchingCubes } from "@dioxygen-software/three-js-blobtree";
import { SimpleSMCWorker } from "./workers/SimpleSMCWorker.js";

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
export const BlobtreeModel = Backbone.Model.extend(
    {

        /**
         *  @param {Object} attrs Can be empty
         *  @param {Object} options Options for this model
         *  @param {boolean} options.workerize If true, geometry computation will execute in a worker.
         *  @param {Object} options.libpaths If workerize is true, then this must contains paths to all necessary libraries.
         *                                   This includes but may not be limited to three.js, blobtree.js.
         *                                   It's an object and not an array since we may want to add checking on keys later.
         */
        initialize: function (attrs, options) {
            this.blobtree = new RootNode();

            this.blobGeom = new BufferGeometry();
            this.blobGeom.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));// Avoid a JS Warning

            this.gStatus = GSTATUS.OUTDATED;

            this.processTimeout = null;
            this.processId = null;

            this.workerize = options.workerize;
            if (this.workerize) {
                this.worker = null;
                this.libpaths = options.libpaths;
            }
            this.splitMaxPolygonizer = options.splitMaxPolygonizer || false;

            var self = this;
            setTimeout(function () {
                self._setGStatus(GSTATUS.UP_TO_DATE);
            })
        },

        toJSON: function () {
            return this.blobtree.toJSON();
        },

        fromJSON: function (json) {
            this.blobtree = Types.fromJSON(json);
            this._invalidGeometry();
        },

        getBlobtree: function () {
            return this.blobtree;
        },

        setBlobtree: function (bt) {
            this.blobtree = bt;
            this._invalidGeometry();
        },

        /**
         * @return {BufferGeometry} the blobtree computed geometry if this.getGStatus == GSTATUS.UP_TO_DATE, null otherwise.
         *
         */
        getGeometry() {
            if (this.gStatus === GSTATUS.UP_TO_DATE) {
                return this.blobGeom;
            } else {
                return null;
            }
        },

        /**
         *  Add an element to the blobtree.
         *  Can be a Node or a Primitive.
         *  @param {Element} element
         *  @param {Node} parent If null, the element will be directly attached to the root.
         */
        addBlobtreeElement: function (element, parent) {
            parent = parent || this.blobtree;
            parent.addChild(element);

            this._invalidGeometry();
        },

        _invalidGeometry: function () {
            clearTimeout(this.processTimeout);
            this.processTimeout = null;
            this.clearWorker();
            this.processId = null;

            this._setGStatus(GSTATUS.OUTDATED);
        },

        getGStatus: function () {
            return this.gStatus;
        },

        _setGStatus: function (s, data) {
            if (this.gStatus !== s) {
                var e = { type: 'gStatusChanged', old: this.gStatus, new: s, geometry: this.blobGeom, name: "blobtree" };
                this.gStatus = s;
                this.trigger(e.type, e);
            }
            if (s === GSTATUS.COMPUTING) {
                var e = { type: 'gComputingProgressChanged', name: "blobtree", percent: data };
                this.trigger(e.type, e);
            }
        },

        /**
         * Generate a unique id for a computing job.
         * Note : Can take up to 1 ms because of the methode used, if you need to generate a lot, change the method.
         */
        _generateProcessID: (function () {
            var last = null;
            return function () {
                var u = new Date().getTime();
                while (u === last) {
                    u = new Date().getTime();
                }
                last = u;
                return u;
            }
        })(),

        clearWorker: function () {
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }
        },

        /**
         *  Update the blobtree geometry (async).
         *  Note that this will only trigger computation if the geometry is out dated.
         *  If a changed occurs in the blobtree before the computation is done, the geometry status will return to MainModeler.GSTATUS.OUTDATED and computation will abort.
         *  @return {String} a unique ID
         */
        updateGeometries: function () {
            if (this.gStatus === GSTATUS.UP_TO_DATE) {
                return null;
            } else if (this.gStatus === GSTATUS.OUTDATED) {
                this.processId = this._generateProcessID();
                this._setGStatus(GSTATUS.COMPUTING, 0);
                var self = this;
                if (this.workerize) {
                    this.worker = SimpleSMCWorker.create({
                        libpaths: this.libpaths,
                        splitMax: this.splitMaxPolygonizer
                    });
                    this.worker.onmessage = function (e) {
                        var data = e.data;
                        if (data.cmd === "geometry" && self.processId === data.processId) {
                            self._setGStatus(GSTATUS.COMPUTING, 100);
                            self.blobGeom = new BufferGeometry();
                            self.blobGeom.setAttribute('position', new BufferAttribute(data.buffers.position, 3));
                            self.blobGeom.setAttribute('normal', new BufferAttribute(data.buffers.normal, 3));
                            self.blobGeom.setAttribute('color', new BufferAttribute(data.buffers.color, 3));
                            self.blobGeom.setIndex(new BufferAttribute(data.buffers.index, 1));
                            self.blobGeom.computeBoundingBox();
                            self.clearWorker();
                            self.processId = null;
                            self._setGStatus(GSTATUS.UP_TO_DATE);
                        } if (data.cmd === "progress") {
                            self._setGStatus(GSTATUS.COMPUTING, data.percent);
                        }
                    };
                    // This Timeout will hel break before worker processing.
                    setTimeout((function () {
                        var pid = self.processId;
                        var bt = self.blobtree.toJSON();
                        return function () {
                            if (self.worker) { // could have been killed in the meantime
                                self.worker.postMessage({
                                    cmd: "polygonize",
                                    blobtree: bt,
                                    processId: pid
                                });
                            }
                        }
                    })(),
                        0
                    );
                } else {
                    this.processTimeout = setTimeout(function () {
                        var smc = null;
                        if (this.splitMaxPolygonizer) {
                            smc = new SplitMaxPolygonizer(
                                self.blobtree,
                                {
                                    subPolygonizer: {
                                        class: SlidingMarchingCubes,
                                        convergence: { step: 4 },
                                        detailRatio: 1.0
                                    }
                                }
                            );
                        } else {
                            smc = new SlidingMarchingCubes(
                                self.blobtree,
                                {
                                    convergence: { step: 4 },
                                    detailRatio: 1.0
                                }
                            );
                        }
                        self.blobGeom = smc.compute();
                        self.blobGeom.computeBoundingBox();
                        clearTimeout(self.processTimeout);
                        self.processId = null;
                        self._setGStatus(GSTATUS.UP_TO_DATE);
                    },
                        0
                    );
                }
                return this.processId;
            } else {
                console.log("Geometry is already computing and has not been set to outdated, updateGeometries is waiting for current computation result.");
                return this.processId;
            }
        }

    });
