# Vector Transformation Visualization Tool (vtvt) 
 
vtvt is an interactive tool for visualizing vectors and their transformations in R2. It's written in plain JavaScript (ECMAScript 2015) and utilizes html5 \<canvas\>. 

Current version: 1.00 (2019-01-11)

## Features:
- displays custom vectors and lines (at this point both must originate from or pass through [0,0])
- supports object dragging (mouse or touch gestures)
- supports custom vector mapping (i.e. you can make a vector update itself continuously based on other vectors)
- built-in calculation and display of eigenvectors
- can display an animated sequence of vectors
- multi-platform support (tested with the following operating systems: MacOS Sierra, Windows 10, Ubuntu 16.04, iOS 12, Raspbian Stretch[rpi3])

[Online demos](https://www.expunctis.com/2019/01/11//vtvt-demo.html) 

## Reference

### Scene initialization

```javascript
var <scene> = new vtvt("<canvas_id>", {<aesthetic parameters>});
```
\<scene\> is the scene object variable

\<canvas_id\> is the id of the canvas element

The `{<aesthetic parameters}` object controls the looks of the scene. It should be specified as `{param1:value1, param2:value2, ..., paramN:valueN}`. The following parameters can be specified:

- grid_res [default: 14] — the number of axis units per canvas width/height (grid lines are spaced one unit apart, so don't go crazy with this parameter)
- snap_to_grid [default: true] — round vector coordinates to the first decimal place
- circle_rad [default: 0.5] — the size of the clickable/touchable area by which an object can be dragged around
- rendering_scale [default: 1] — resolution upscaling factor; try setting to two on regular low-ppi monitors for sharper graphics (note: it also affect the size of vector arrows)
- show_eig [default: true] - show eigenvectors or not?
- eig_col [default: "150, 150, 150"] — eigenvector colour
- eig_length [default: 4] — eigenvector length
- frame_duration [default: 500] — time (ms) per animation frame
- anim_trigger_id [default: ''] — the id of the animation triger element (e.g., a button)

Example:

```javascript
scene = new vtvt("canvas1", {grid_res: 16, circle_rad: 0.5, show_eig: false});
```

### Adding regular vectors/lines (not part of the animation sequence)

To add vectors to the animation sequence use the following method:

```javascript
<scene>.addVector([coord_x, coord_y], {<aethetic parameters>});
```

`{<aesthetic parameters}`:

- c [default: "150, 150, 150"] — colour (RGB 0-255)
- label [default: ''] — vector label
- selectable [default: false] — can the object be dragged?
— visible [default: true] — is the object visible?
— draw_arrow [default: true] — draw the arrowhead?
- draw_line [default: false] — draw a line across the whole screen (as opposed to just the vector stem)?
- mapping [default: undefined] — if you want the vector to be mapped to other vectors, specify a function returning the vector coordinates here

Example:

```javascript
scene.addVector([-1, 3], {c: "250, 200, 200", label: "m = t1+t2", visible: true, mapping: function(){ 
	return [scene.vectors[0].coord_x + scene.vectors[1].coord_x, scene.vectors[0].coord_y + scene.vectors[1].coord_y ];} });
```

Please refer to vvt_demo.html for more examples of specifying the mapping function.

Note: the first two vectors (regardless of their aesthetic parameters) created via `<scene>.addVector();` determine the columns of matrix T which is displayed on the canvas.

### Adding vectors to the animation sequence

```javascript
<scene>.addAnimationFrame([coord_x, coord_y], {<aethetic parameters>});
```

The parameters are the same as for `<scene>.addVector()`

Example:

```javascript
scene.addAnimationFrame([1, 1], {c: "150, 100, 100", label: "iter0", mapping: function(){ 
    return [scene.vectors[2].coord_x, scene.vectors[2].coord_y]} });
```

## Things to do in the future

- add grid transformation
- add support for displaying arbitrary text
- show matrix T in a separate html element
- add support for origin displacement

## License and credits

The source, demos and this reference are available from the [github repository](https://github.com/ex-punctis/vtvt). The code is distributed under the terms of the MIT license. Thanks to **u/senocular** and **u/theogjpeezy** from [reddit](www.reddit.com) for answering a few questions I had about js while working on **vtvt**.