# WebGLModelers Plugin for Blobtrees

This lib contains some classes useful for modelers or viewers based on [WebGLModelers](https://github.com/maximeq/webgl-modelers).

## Install

You need to install package [three-js-blobtree](https://github.com/maximeq/three-js-blobtree) first. Install it in the same folder as this package.
Then run :

> npm install

[WebGLModelers](https://github.com/maximeq/webgl-modelers) plugins are meant to be directly bundled with the target modeler package. However, it is possible to build this package and include it directly in a web page.
Builds are commited for a direct usage, but you can also run :

> npm run build

## Usage

> var WebGLModelers = require("webgl-modelers");
> var WebGLModelersPluginBlobtree = require("webgl-modelers-plugin-blobtree");
>
> // WebGLModelers now contains all classes from WebGLModelersPluginBlobtree;
