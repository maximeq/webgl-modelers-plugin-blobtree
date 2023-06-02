'use strict';


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
     *  @param {Object} params
     *  @param {{name:string, url:string}[]} params.libpaths Library path in which we can look for our required libraries.
     *  @param {boolean} params.splitMax If true, the Blobtree.SplitmaxPolygonizer will be used instead of the simple SMC.
     */
    create: function (params) {

        const necessaryLibNames = ["threejs", "buffergeometryutils", "blobtreejs"];
        const necessaryLibDescription = ["Three.js", "BufferGeometryUtils (Three.js examples)", "Blobtree.js"];
        const necessaryLibUrls = necessaryLibNames.map((name, index) => {
            const url = params.libpaths.find((libpath) => libpath.name === name)?.url;
            if (!url) {
                throw "Error : SimpleSMCWorker needs lib " + necessaryLibDescription[index] + " imported with name " + name + " in libpaths.";
            }
            return url;
        });

        const imports = necessaryLibUrls.map((url) => `import("${url}");\n`).join("");

        let code = SimpleSMCWorker.code;
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
}

module.exports = SimpleSMCWorker;