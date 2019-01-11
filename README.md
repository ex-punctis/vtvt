# Vector Transformation Visualization Tool (vtvt) 
 
vtvt is an interactive tool for visualizing vectors and their transformations in R2. It's written in plain JavaScript (ECMAScript 2015) and utilizes html5 \<canvas\>. 

Current version: 1.00 (2019-01-11)

Features:
- displays custom vectors and lines (at this point both must originate from or pass through [0,0])
- supports object dragging (mouse or touch gestures)
- supports custom vector mapping (i.e. you can make a vector update itself continuously based on other vectors)
- built-in calculation and display of eigenvectors
- can display an animated sequence of vectors
- multi-platform support (tested with the following operating systems: MacOS Sierra, Windows 10, Ubuntu 16.04, iOS 12, Raspbian Stretch[rpi3])

A sample visualization: link

constructor(canvas_id, {grid_res = 14, snap_to_grid = true, circle_rad = 0.5, rendering_scale = 1, show_eig = true, eig_col = "150, 150, 150", eig_length = 4, frame_duration = 500, anim_trigger_id = '' }

		this.grid_res = grid_res; 					// grid units for both width and height
		this.snap_to_grid_flag = snap_to_grid; 		// snap to gred flag
		this.circle_rad = circle_rad;   			// clickable/touchable area of a vector
		this.frame_duration = frame_duration;     	// time per animation frame
		this.show_eigenvectors_flag = show_eig;
		this.eig_colour = eig_col;               	// eigenvector colour
		this.eig_length = eig_length;				// eigenvector length


constructor(coords, {c="150, 150, 150", label = '', selectable = false, visible = true, draw_arrow = true, draw_line = false, mapping = undefined}


First two vectors determine the columns of matrix T

Built-in eigen-calculator calculates eigenvalues and eigenvectors of matrix T. Relevant options: show_eig = true, eig_col = "150, 150, 150", eig_length = 4


to do:

//move nested class

add grid transformation

add support for arbitrary text

render matrix on a separate elment

add vector displacement


