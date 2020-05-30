(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('webgl-modelers'), require('three-full'), require('backbone'), require('three-js-blobtree')) :
    typeof define === 'function' && define.amd ? define(['webgl-modelers', 'three-full', 'backbone', 'three-js-blobtree'], factory) :
    (global.WebGLModelersPluginBlobtree = factory(global.WebGLModelers,global.THREE,global.Backbone,global.Blobtree));
}(this, (function (webglModelers,threeFull,backbone,threeJsBlobtree) { 'use strict';

    webglModelers = webglModelers && webglModelers.hasOwnProperty('default') ? webglModelers['default'] : webglModelers;
    threeFull = threeFull && threeFull.hasOwnProperty('default') ? threeFull['default'] : threeFull;
    backbone = backbone && backbone.hasOwnProperty('default') ? backbone['default'] : backbone;
    threeJsBlobtree = threeJsBlobtree && threeJsBlobtree.hasOwnProperty('default') ? threeJsBlobtree['default'] : threeJsBlobtree;

    /**
     *  This worker will execute a simple SlidingMarchingCubes on a given blobtree and return the geometry.
     *  Following libraries must be imported :
     *  three.js
     *  blobtree.js
     *
     *  Please add importScripts(pathToLib); to this worker code.
     *
     */
    var SimpleSMCWorker = {
        code:[
            /**
             *  @param {Object} e Message for worker
             *  @param {number} e.processId Unique id for the process being launched
             *  @param {Object} e.blobtree The blobtree to be computed as a JSON object.
             */
            "self.onmessage = function(e){",
            // "   debugger;",
            "   self.processId = e.data.processId;",
            "   self.blobtree = Blobtree.Types.fromJSON(e.data.blobtree);",
            "   self.blobtree.prepareForEval()",
            "   var progress = function (percent) {",
            "       self.postMessage({",
            "           cmd:'progress',",
            "           processId:self.processId,",
            "           percent:percent",
            "       });",
            "   };",
            "   var split_max = false;", // use Blobtree.SplitMaxPolygonizer
            "   var smc = null;",
            "   if(split_max){",
            "       smc = new Blobtree.SplitMaxPolygonizer(",
            "           self.blobtree,",
            "           {",
            "               subPolygonizer:{",
            "                   class:Blobtree.SlidingMarchingCubes,",
            "                   convergence:{step:4},",
            "                   detailRatio: 1.0",
            "               },",
            "               progress:progress",
            "           }",
            "       );",
            "   }else{",
            "       smc = new Blobtree.SlidingMarchingCubes(",
            "           self.blobtree,",
            "           {",
            "               convergence:{step:4},",
            "               detailRatio: 1.0,",
            "               progress:progress",
            "           }",
            "       );",
            "   }",
            "   var g = smc.compute();",
            "   var buffers = {",
            "       position:g.getAttribute('position').array,",
            "       normal:g.getAttribute('normal').array,",
            "       color:g.getAttribute('color').array,",
            "       index:g.getIndex().array",
            "   };",
            "   self.postMessage({",
            "       cmd:'geometry',",
            "       processId:self.processId,",
            "       buffers:buffers,",
            "       transferList:[buffers.position, buffers.normal, buffers.color, buffers.index]",
            "   });",
            "}",
        ].join("\n"),
        /**
         *  Create a new SimpleSMCWorker
         *  @params {boolean} params.splitMax If true, the Blobtree.SplitmaxPolygonizer will be used instead of the simple SMC.
         */
        create:function(params){

            // Check that required libs are found
            var found = {};

            var imports = "window = {};\n";
            for(var i=0; i<params.libpaths.length; ++i){
                var l = params.libpaths[i];
                imports += "importScripts('"+l.url+"');\n";
                if(l.name === "threejs"){
                    imports += "var THREE = THREE || Three;\n"; // In case we are importing three-full which for some reason defines Three but not THREE...
                }
                found[l.name] = true;
            }

            if(!found["threejs"]){
                throw "Error : SimpleSMCWorker needs lib THREE.JS imported with name threejs in libpaths.";
            }
            if(!found["blobtreejs"]){
                throw "Error : SimpleSMCWorker needs lib THREE.JS imported with name blobtreejs in libpaths.";
            }

            var code = SimpleSMCWorker.code;
            if (params.splitMax){
                code = code.replace("var split_max = false;", "var split_max = true;");
            }

            return new Worker(
                URL.createObjectURL(
                    new Blob([
                        imports + code
                    ])
                )
            );
        }
    };

    var SimpleSMCWorker_1 = SimpleSMCWorker;

    const Blobtree = (window && window.Blobtree) || threeJsBlobtree;



    const GSTATUS = webglModelers.GSTATUS;

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
    var BlobtreeModel = backbone.Model.extend(
    {

        /**
         *  @param {Object} attrs Can be empty
         *  @param {Object} options Options for this model
         *  @param {boolean} options.workerize If true, geometry computation will execute in a worker.
         *  @param {Object} options.libpaths If workerize is true, then this must contains paths to all necessary libraries.
         *                                   This includes but may not be limited to three.js, blobtree.js.
         *                                   It's an object and not an array since we may want to add checking on keys later.
         */
        initialize: function(attrs, options) {
            this.blobtree = new Blobtree.RootNode();

            this.blobGeom = new threeFull.BufferGeometry();
            this.blobGeom.addAttribute('position',new threeFull.BufferAttribute(new Float32Array([0,0,0,0,0,0,0,0,0]), 3));// Avoid a THREE.JS Warning

            this.gStatus = GSTATUS.OUTDATED;

            this.processTimeout = null;
            this.processId = null;

            this.workerize = options.workerize;
            if(this.workerize){
                this.worker = null;
                this.libpaths = options.libpaths;
            }
            this.splitMaxPolygonizer = options.splitMaxPolygonizer || false;

            var self = this;
            setTimeout(function(){
                self._setGStatus(GSTATUS.UP_TO_DATE);
            });
        },

        toJSON:function(){
            return this.blobtree.toJSON();
        },

        fromJSON:function(json){
            this.blobtree = Blobtree.Types.fromJSON(json);
            this._invalidGeometry();
        },

        getBlobtree: function(){
            return this.blobtree;
        },

        setBlobtree: function(bt){
            this.blobtree = bt;
            this._invalidGeometry();
        },

        /**
         *  Add an element to the blobtree.
         *  Can be a Node or a Primitive.
         *  @param {Blobtree.Element} element
         *  @param {Blobtree.Node} parent If null, the element will be directly attached to the root.
         */
        addBlobtreeElement: function(element, parent){
            parent = parent || this.blobtree;
            parent.addChild(element);

            this._invalidGeometry();
        },

        _invalidGeometry:function(){
            clearTimeout(this.processTimeout);
            this.processTimeout = null;
            this.clearWorker();
            this.processId = null;

            this._setGStatus(GSTATUS.OUTDATED);
        },

        getGStatus: function(){
            return this.gStatus;
        },

        _setGStatus: function(s, data){
            if(this.gStatus !== s){
                var e = {type:'gStatusChanged',old:this.gStatus, new:s, geometry:this.blobGeom, name:"blobtree"};
                this.gStatus = s;
                this.trigger(e.type,e);
            }
            if (s === GSTATUS.COMPUTING){
                var e = { type: 'gComputingProgressChanged',  name: "blobtree", percent:data };
                this.trigger(e.type, e);
            }
        },

        /**
         * Generate a unique id for a computing job.
         * Note : Can take up to 1 ms because of the methode used, if you need to generate a lot, change the method.
         */
        _generateProcessID: (function(){
            var last = null;
            return function(){
                var u = new Date().getTime();
                while(u === last){
                    u = new Date().getTime();
                }
                last = u;
                return u;
            }
        })(),

        clearWorker: function(){
            if(this.worker){
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
        updateGeometries: function(){
            if(this.gStatus === GSTATUS.UP_TO_DATE){
                return null;
            }else if(this.gStatus === GSTATUS.OUTDATED){
                this.processId = this._generateProcessID();
                this._setGStatus(GSTATUS.COMPUTING, 0);
                var self = this;
                if(this.workerize){
                    this.worker = SimpleSMCWorker_1.create({
                        libpaths:this.libpaths,
                        splitMax:this.splitMaxPolygonizer
                    });
                    this.worker.onmessage = function(e){
                        var data = e.data;
                        if(data.cmd === "geometry" && self.processId === data.processId){
                            self._setGStatus(GSTATUS.COMPUTING, 100);
                            self.blobGeom = new threeFull.BufferGeometry();
                            self.blobGeom.addAttribute('position', new threeFull.BufferAttribute(data.buffers.position, 3));
                            self.blobGeom.addAttribute('normal', new threeFull.BufferAttribute(data.buffers.normal, 3));
                            self.blobGeom.addAttribute('color', new threeFull.BufferAttribute(data.buffers.color, 3));
                            self.blobGeom.setIndex(new threeFull.BufferAttribute(data.buffers.index, 1));
                            self.blobGeom.computeBoundingBox();
                            self.clearWorker();
                            self.processId = null;
                            self._setGStatus(GSTATUS.UP_TO_DATE);
                        }if(data.cmd === "progress"){
                            self._setGStatus(GSTATUS.COMPUTING, data.percent);
                        }
                    };
                    // This Timeout will hel break before worker processing.
                    setTimeout((function(){
                            var pid = self.processId;
                            var bt = self.blobtree.toJSON();
                            return function(){
                                if(self.worker){ // could have been killed in the meantime
                                    self.worker.postMessage({
                                        cmd:"polygonize",
                                        blobtree:bt,
                                        processId:pid
                                    });
                                }
                            }
                        })(),
                        0
                    );
                }else{
                    this.processTimeout = setTimeout(function(){
                            var smc = null;
                            if(this.splitMaxPolygonizer){
                                smc = new Blobtree.SplitMaxPolygonizer(
                                    self.blobtree,
                                    {
                                        subPolygonizer:{
                                            class:Blobtree.SlidingMarchingCubes,
                                            convergence: { step: 4 },
                                            detailRatio: 1.0
                                        }
                                    }
                                );
                            }else{
                                smc = new Blobtree.SlidingMarchingCubes(
                                    self.blobtree,
                                    {
                                        convergence:{step:4},
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
            }else{
                console.log("Geometry is already computing and has not been set to outdated, updateGeometries is waiting for current computation result.");
                return this.processId;
            }
        }

    });

    var BlobtreeModel_1 = BlobtreeModel;

    const SceneManager = webglModelers.SceneManager;

    /**
     *  A SceneManager linked to a BlobtreeModel
     *  @param {ModelerModel} model
     */
    var BlobtreeSceneManager = function(model) {
        SceneManager.call(this, model);

        this.emptyG = new threeFull.BufferGeometry();
        this.emptyG.addAttribute('position',new threeFull.BufferAttribute(new Float32Array([0,0,0,0,0,0,0,0,0]), 3));// Avoid a THREE.JS Warning

        // Init with a Blobtree Mesh
        var m = new threeFull.Mesh(
            this.emptyG,
            this.surfaceMat
        );
        m.receiveShadow = true;
        m.castShadow = true;
        m.name = "blobtree";
        this.addModel(m);

    };
    BlobtreeSceneManager.prototype = Object.create( SceneManager.prototype );
    BlobtreeSceneManager.prototype.constructor = BlobtreeSceneManager;

    /**
     *  Will return
     *  @param {number} precision DEfault to 0.001
     */
    BlobtreeSceneManager.prototype.getSceneIntersections = (function(){
        var size = new threeFull.Vector3();
        var center = new threeFull.Vector3();
        var dcomputer = new threeFull.Vector3();

        return function(ray, precision){
            var bt = this.model.getBlobtree();
            if(bt){
                bt.prepareForEval();
                bt.getAABB().getSize(size);
                bt.getAABB().getCenter(center);
                var res = {
                    v:0,
                    g : new threeFull.Vector3(),
                    step:0
                };
                dcomputer.subVectors(ray.origin,center);
                if(bt.intersectRayBlob(ray,res,dcomputer.length()+size.x+size.y+size.z,precision || 0.001)){
                    return [{
                        distance:   res.distance,
                        object:     this.modelGroup.getObjectByName("blobtree"),
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
        this.modelGroup.getObjectByName("blobtree").geometry.dispose();
        this.modelGroup.getObjectByName("blobtree").geometry = this.emptyG;
        this.requireRender();
    };


    var BlobtreeSceneManager_1 = BlobtreeSceneManager;

    webglModelers.Plugins.Blobtree = {
        SimpleSMCWorker : SimpleSMCWorker_1,
        BlobtreeSceneManager : BlobtreeSceneManager_1,
        BlobtreeModel : BlobtreeModel_1
    };

    Object.keys(webglModelers.Plugins.Blobtree).forEach(function(k){
        webglModelers.Plugins.Blobtree[k];
        webglModelers[k] = webglModelers.Plugins.Blobtree[k];
    });

    var exports$1 = webglModelers;

    return exports$1;

})));
