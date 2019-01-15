# Vector Transformation Visualization Tool (vtvt) 
 
vtvt is an interactive tool for visualizing vectors and their transformations in R2. It's written in plain JavaScript (ECMAScript 2015) and utilizes html5 \<canvas\>. 

Current version: 1.01 (2019-01-14)

## Features
- displays custom vectors, lines (at this point both must originate from or pass through [0,0]) and points;
- supports object dragging (mouse or touch gestures);
- supports custom vector mapping (i.e. you can make a vector update itself continuously based on other vectors);
- built-in calculation and display of eigenvectors;
- can display an animated sequence of vectors (multiple vectors per frame are allowed);
- multi-platform support (tested with the following operating systems: MacOS Sierra, Windows 10, Ubuntu 16.04, iOS 12, Raspbian Stretch[rpi3]).

## Online demos

[Online demos](https://www.expunctis.com/2019/01/11//vtvt-demo.html) 

## Reference

### Workflow:

1. Add a canvas element to your web page with its width and height specified (must be equal!) in CSS. Example:
```html
<style>
    .canvas-wrapped { width: 90vmin; height: 90vmin; }
</style>
<canvas id='vector_canvas' class="canvas-wrapped">
```

2. If you are planning to create an animation sequence, add a trigger element as well, e.g.:
```html
<button id='animation_trigger'>Press to animate</button>
```
3. Initialize a scene (an instance of **vtvt**) using the canvas id (and the animation trigger element if applicable)

4. Add vectors (static and animated) to the scene

5. Render


### Scene initialization:

```
var <scene> = new vtvt({canvas_id: '<canvas_id>', <aesthetic_args> });
```
\<scene\> is the scene object variable

\<canvas_id\> is the id of the canvas element

`<aesthetic_args>` control the looks of the scene. They should be specified as `arg1:value1, arg2:value2, ..., argN:valueN`. The following arguments can be specified:

| key | default value | Description |
| --- | ------------- | ------------|
| grid_res | 14 | the number of axis units per canvas width/height (grid lines are spaced one unit apart, so don't go crazy with this parameter) |
| snap_to_grid | true | round vector coordinates to the first decimal place |
| circle_rad | 0.5 | the size of the clickable/touchable area by which an object can be dragged around |
| point_rad | 0.06] | the size of the point (when a vector is rendered as a point) |
| rendering_scale | 1 | resolution upscaling factor; try setting to two on regular low-ppi monitors for sharper graphics (note: it also affect the size of vector arrows) |
| show_eig | true | show eigenvectors or not? |
| eig_col | "150, 150, 150" | eigenvector colour |
| eig_length | 4 | eigenvector length |
| frame_duration | 500 | time (ms) per animation frame |
| anim_trigger_id | '' | the id of the animation triger element (e.g., a button) |

Example:

```javascript
scene = new vtvt({canvas_id: 'canvas1', grid_res: 16, circle_rad: 0.5, show_eig: false});
```

### Adding regular vectors/lines (not specific to the animation sequence):

To add vectors that are always rendered use the following method:

```
<scene>.addVector({coords: [<coord_x>, <coord_y>], <aesthetic_args>});
```

`<aesthetic_args> (format: arg1:value1, arg2:value2, ..., argN:valueN):`

| key | default value | Description |
| --- | ------------- | ------------|
| c | "150, 150, 150" | colour (RGB 0-255) |
| label | '' | vector label |
| draggable |false | can the object be dragged? |
| visible | true | is the object visible? |
| kind | 'vector' | an easy way to specify what the object should look like: 'vector', 'line', 'point' or 'custom' |
| draw_arrow | true | (applies if kind: 'custom') draw the arrowhead? |
| draw_point | false | (applies if kind: 'custom') draw a point at [coord_x, coord_y]? |
| draw_stem | true | (applies if kind: 'custom') draw the vector stem? |
| draw_line | false | (applies if kind: 'custom') draw a line across the whole screen (as opposed to just the vector stem)? |
| mapping | undefined | if you want the vector to be mapped to other vectors, specify a function returning the vector coordinates here. | 

**Note:** you can access i-th vector's coordinates with `<scene>.vectors[i].coord_x` and `.coord_y`

Example:

```javascript
scene.addVector({coords: [-1, 3], c: "250, 200, 200", label: "m = t1+t2", visible: true, mapping: function(){ 
	return [scene.vectors[0].coord_x + scene.vectors[1].coord_x, scene.vectors[0].coord_y + scene.vectors[1].coord_y ];} });
```
**Note:** the first two vectors (regardless of their aesthetic arguments) created via `<scene>.addVector();` determine the columns of matrix T which is displayed on the canvas.

Please refer to the demo files for more/better examples of specifying the mapping function.

### Adding vectors to the animated sequence:

Vectors from the animation sequence are rendered only once the animation is triggered. To add one frame of animation

```
<scene>.addAnimationFrame([<args_obj_1, args_obj_2, ..., args_obj_N]);
```
where N is the number of animated vectors shown in this frame

each `args_obj_K` = `{coords: [coord_x, coord_y], <aesthetic_args>}`

The aesthetic arguments are the same as for `<scene>.addVector()`

`.addAnimationFrame()` always takes an array as its argument. Even if you want only one animated vector per frame, it still needs to surrounded by the square brackets.

**Note:** you can access k-th animated vector's coordinates in i-th frame with `<scene>.vectors_animated[i][k].coord_x` and `.coord_y` 

Example:

```javascript
scene.addAnimationFrame([{coords: [1, 1], c: "150, 100, 100", label: "iter0", mapping: function(){ 
    return [scene.vectors[2].coord_x, scene.vectors[2].coord_y]} }]);
```

## Troubleshooting

When something doesn't work, first ~~**blame me**~~ check your browser's console for error messages. Most likely, the arguments to `.addVector()` or `.addAnimationFrame()` are messed up. Errors in custom mapping functions are fairly common as well. Try probing vector objects in the console (e.g., `scene.vectors[i]`) to see what they look like.

If you're lost or you suspect something is wrong with **vtvt**, [report the issue](https://github.com/ex-punctis/vtvt/issues) on github.

## Change log

v1.01 2019-01-14

- updated readme
- class vtvt: new point_rad property
- class Vector: 
    - property 'selectable' renamed as 'draggable'
    - new properties:
        - kind 
        - draw_point
        - draw_stem 
    - methods modified:
        - addVector() — the argument is now an object
        - addAnimationFrame() — the argument is now a list of objects


## Things to do in the future

- add grid transformation
- add support for displaying arbitrary text
- show matrix T in a separate html element
- add support for origin displacement

## License and credits

The source, demos and this reference are available from the [github repository](https://github.com/ex-punctis/vtvt). The code is distributed under the terms of the MIT license. Thanks to **u/senocular** and **u/theogjpeezy** from reddit for answering a few questions I had about js while working on **vtvt**.