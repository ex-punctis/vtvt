// v 1.02
class vtvt {
	constructor({canvas_id, grid_res = 14, snap_to_grid = true, circle_rad = 0.5, point_rad = 0.06, rendering_scale = 1, show_matrix = true, show_eig = true, eig_col = "150, 150, 150", eig_length = 4, frame_duration = 500, anim_trigger_id = ''}={}) {
		this.grid_res = grid_res; 					// grid units for both width and height
		this.snap_to_grid_flag = snap_to_grid; 		// snap to gred flag
		this.circle_rad = circle_rad;   			// clickable/touchable area of a vector
		this.point_rad = point_rad;					// point radius
		this.frame_duration = frame_duration;     	// time per animation frame
		this.show_matrix_flag = show_matrix;		// show matrix?
		this.show_eigenvectors_flag = show_eig;		// show eigenvectors?
		this.eig_colour = eig_col;               	// eigenvector colour
		this.eig_length = eig_length;				// eigenvector length
		this.rendering_scale = rendering_scale;     // affects arrow size and sharpness

		this.anim_trigger_id = anim_trigger_id;
		if (this.anim_trigger_id) { 
			this.anim_trigger = document.getElementById(this.anim_trigger_id);
			this.anim_trigger.onclick = _ => this.playAnimation();
		}

		this.canvas = document.getElementById(canvas_id);
		this.ctx = this.canvas.getContext("2d");

		// Set actual size as per device screen density scale times rendering_scale
		this.scale = window.devicePixelRatio*this.rendering_scale; 
		this.canvas.width = this.canvas.offsetWidth * this.scale;
		this.canvas.height = this.canvas.offsetHeight * this.scale;
		// Normalize coordinate system to use css pixels.
		this.ctx.scale(this.scale, this.scale);

		this.vectors = [];          // persistent vector objects (populated by user)
		this.vectors_animated = []; // animated vector objects (populated by user)
		this.frames_left = 0;  // animation frames left to be displayed
		this.vectors_eigen = [];   // eigenvectors (calculated automatically)

		// set vector clickable/dragable area size
		this.circle_rad *= this.canvas.width/this.grid_res/this.scale;
		this.circle_rad_sq = this.circle_rad**2;	

		// set vector point size
		this.point_rad *= this.canvas.width/this.grid_res/this.scale;
		
		// declare mouse- and touch-event variables
		this.selection_index = undefined;
		this.offset_x = undefined;
		this.offset_y = undefined;
		// the following are handler placeholders that will be assigned functions when the corresponding event 
		// listeners are added in SelectVector. We need these placeholders in order to detach event listeners later
		this._onMouseMove = undefined;
		this._onTouchMove = undefined;
		// add some event listeners right away
		this.canvas.addEventListener("mousedown", event => this.onMouseDown(event));
		this.canvas.addEventListener("touchstart", event => this.onTouchStart(event));
		this.canvas.addEventListener("mouseup", event => this.deselectVector(event));	
		this.canvas.addEventListener("touchend", event => this.deselectVector(event));
		
		this.canvas_pos = this.canvas.getBoundingClientRect();

		// this is needed to access this class's methods and properties from the inner class (Vector)
		var parent = this;

		// vector class
		this.Vector = class  {
			constructor({coords=[1,1], origin=[0,0], c="150, 150, 150", label = '', kind = 'vector', draggable = false, visible = true, draw_arrow = true, draw_point = false, draw_stem = true, draw_line = false, mapping = undefined}={}) {
				this.coord_x = coords[0]; // virtual coordinate x (not screen position!)
				this.coord_y = coords[1]; // virtual coordinate y (not screen position!)
				this.orig_x = origin[0]; // virtual coordinate x (not screen position!)
				this.orig_y = origin[1]; // virtual coordinate y (not screen position!)
				this.line_col = "rgb(" + c + ")"; 			// vector line colour
				this.circle_col = "rgba(" + c + ",0.1)";    // draggable area colour
				this.draggable = draggable; 				// can the vector be dragged around?
				this.label = label;
				this.visible = visible; //visibility flag

				// Does the object look like vector, point, line or something else?
				this.draw_arrow = draw_arrow; 
				this.draw_point = draw_point;
				this.draw_stem = draw_stem;
				this.draw_line = draw_line;
				this.kind = kind;
				switch (this.kind) {
					case 'vector':
						this.draw_arrow = true; 
						this.draw_point = false;
						this.draw_stem = true;
						this.draw_line = false;
						break;
					case 'point':
						this.draw_arrow = false; 
						this.draw_point = true;
						this.draw_stem = false;
						this.draw_line = false;
						break;
					case 'line':
						this.draw_arrow = false; 
						this.draw_point = false;
						this.draw_stem = false;
						this.draw_line = true;
						break;
					case 'custom':
						break;
					default:
						alert(`Error! kind: '${this.kind}' is not an acceptable parameter. Please pick from 'vector', 'point', 'line', or 'custom'`);
						StopExecutionCompletely();
				}

				this.mapping = mapping; // method that maps vector's virtual coordinates to other vectors
				
				if (this.mapping) { // disable dragging if any of the coords is mapped
					if (this.mapping().mapX || this.mapping().mapY) { this.draggable = false; } 
				}
		
				this.recalculate(); // calculate screen positions based on coords
			}

			// calculate all screen positions based on virtual coordinates coord_x and coord_y
			recalculate() {
				if (this.mapping) { 
					let mapX, mapY, mapXo, mapYo;	
					( {mapX=undefined, mapY=undefined, mapXo=undefined, mapYo=undefined} = this.mapping() ); 
					if (mapX !== undefined) { this.coord_x = mapX; }
					if (mapY !== undefined) { this.coord_y = mapY; }
					if (mapXo !== undefined) { this.orig_x = mapXo; }
					if (mapYo !== undefined) { this.orig_y = mapYo; }
				}
		
				this.x = parent.canvas.width  * (0.5 + (this.coord_x + this.orig_x)/parent.grid_res)/parent.scale;
				this.y = parent.canvas.height * (0.5 - (this.coord_y + this.orig_y)/parent.grid_res)/parent.scale;

				this.o_x = parent.canvas.width  * (0.5 + this.orig_x/parent.grid_res)/parent.scale;
				this.o_y = parent.canvas.height * (0.5 - this.orig_y/parent.grid_res)/parent.scale;

				this.vec_norm = Math.sqrt(this.coord_x**2 + this.coord_y**2); // norm
		
				//arrow positions:
				this.arr_len = 0.2 * parent.canvas.width / parent.grid_res;
				this.arr_width = 0.05 * parent.canvas.width / parent.grid_res;
				this.arr_coord_x1 = this.x - this.coord_x/this.vec_norm*this.arr_len + this.coord_y/this.vec_norm*this.arr_width;
				this.arr_coord_y1 = this.y + this.coord_y/this.vec_norm*this.arr_len + this.coord_x/this.vec_norm*this.arr_width;
				this.arr_coord_x2 = this.x - this.coord_x/this.vec_norm*this.arr_len - this.coord_y/this.vec_norm*this.arr_width;
				this.arr_coord_y2 = this.y + this.coord_y/this.vec_norm*this.arr_len - this.coord_x/this.vec_norm*this.arr_width;
		
				// label positions
				this.label_x = (this.coord_x + this.orig_x) * (1 + parent.grid_res*0.01/Math.abs(this.coord_x + this.orig_x));
				this.label_x = parent.canvas.width  * (0.5 + this.label_x/parent.grid_res)/parent.scale;
				this.label_y = (this.coord_y  + this.orig_y) * (1 + parent.grid_res*0.01/Math.abs(this.coord_y + this.orig_y));
				this.label_y = parent.canvas.height  * (0.5 - this.label_y/parent.grid_res)/parent.scale;
			}
	

			// test if a vector's draggable zone has been clicked/touched
			checkHit(x, y) { 
				return this.draggable&(((this.x-x)**2 + (this.y-y)**2) < parent.circle_rad_sq);
			}
			// update vector coordinates during dragging based on mouse pointer/finger position
			updateCoordsOnMove(pointerX, pointerY) {
				this.coord_x = (parent.scale*pointerX/parent.canvas.width - 0.5)*parent.grid_res - this.orig_x;
				this.coord_y = -(parent.scale*pointerY/parent.canvas.height - 0.5)*parent.grid_res - this.orig_y;
				//this.recalculate();
			}

			// round coords to 0.01 (e.g. on "mouseup" or "touchend" event)
			snaptoGrid() {
				this.coord_x = Math.round(this.coord_x * 10)/10;
				this.coord_y = Math.round(this.coord_y * 10)/10;
				this.draw();
			}
	
			// draw vector
			draw() {
				this.recalculate();
				if (this.visible) {
					// line instead of a vector stem
					if (this.draw_line) {
						// line beginning coords:
						var l_y1 = 0;
						var l_x1 = this.o_x - (this.x - this.o_x)*this.o_y/(this.y - this.o_y);
						if (l_x1 < 0) { 
							l_x1 = 0;
							l_y1 = this.o_y - (this.y - this.o_y)*this.o_x/(this.x - this.o_x);
						} else if (l_x1 > parent.canvas.width/parent.scale) {
							l_x1 = parent.canvas.width/parent.scale;
							l_y1 = this.o_y + (this.y - this.o_y)*(parent.canvas.width/parent.scale - this.o_x)/(this.x - this.o_x);
						}
						// line end coords:
						var l_y2 = parent.canvas.height/parent.scale;
						var l_x2 = this.o_x + (this.x - this.o_x)*(parent.canvas.height/parent.scale - this.o_y)/(this.y - this.o_y);
						if (l_x2 < 0) { 
							l_x2 = 0;
							l_y2 = this.o_y - (this.y - this.o_y)*this.o_x/(this.x - this.o_x);
						} else if (l_x2 > parent.canvas.width/parent.scale) {
							l_x2 = parent.canvas.width/parent.scale;
							l_y2 = this.o_y + (this.y - this.o_y)*(parent.canvas.width/parent.scale - this.o_x)/(this.x - this.o_x);
						}
						parent.ctx.beginPath();
						parent.ctx.moveTo(l_x1, l_y1);
						parent.ctx.lineTo(l_x2, l_y2);
						parent.ctx.strokeStyle=this.line_col;
						parent.ctx.stroke();			
						parent.ctx.closePath();
					}
					// vector stem
					if (this.draw_stem) {
						parent.ctx.beginPath();
						parent.ctx.moveTo(this.o_x, this.o_y);
						parent.ctx.lineTo(this.x, this.y);
						parent.ctx.strokeStyle=this.line_col;
						parent.ctx.stroke();			
						parent.ctx.closePath();
					}
					// draw arrow
					if (this.draw_arrow) {
						parent.ctx.beginPath();
						parent.ctx.moveTo(this.x, this.y);
						parent.ctx.lineTo(this.arr_coord_x1, this.arr_coord_y1);
						parent.ctx.lineTo(this.arr_coord_x2, this.arr_coord_y2);
						parent.ctx.lineTo(this.x, this.y);
						parent.ctx.fillStyle = this.line_col;
						parent.ctx.fill();		
						parent.ctx.closePath();
					}
					// draw point
					if (this.draw_point) {
						parent.ctx.beginPath();
						parent.ctx.arc(this.x, this.y, parent.point_rad, 0, 2 * Math.PI, true);
						parent.ctx.fillStyle = this.line_col;
						parent.ctx.fill();
						parent.ctx.closePath();
					}
					// add circle if the vector object is draggable
					if (this.draggable) { 
						parent.ctx.beginPath();
						parent.ctx.arc(this.x, this.y, parent.circle_rad, 0, 2 * Math.PI, true);
						parent.ctx.fillStyle = this.circle_col;
						parent.ctx.fill();
						parent.ctx.closePath();
					}
					// add text if the vector has a label
					if (this.label) {
						parent.ctx.beginPath();
						parent.ctx.font = "12px Arial";
						parent.ctx.fillStyle = this.line_col;
						parent.ctx.fillText(this.label, this.label_x, this.label_y);
						parent.ctx.closePath();
					}
				}
			}
		}
	}
	

	// **************************************************************
	// methods for adding new vectors to the canvas
	addVector(args_obj) {
		this.vectors.push(new this.Vector(args_obj));
	}
	addAnimationFrame(args_obj) {
		const vec_arr = args_obj.map(el => new this.Vector(el))
		this.vectors_animated.push(vec_arr);
	}
	// **************************************************************
	

	// **************************************************************
	// calculate and add real eigenvectors
	eigenVecs() {
		this.vectors_eigen = []; // clear list
	
		var lambda = undefined;  // eigenvalue
		var eigen_x = undefined;  // eigen vec coord x
		var eigen_y = undefined; // eigen vec coord y
		var a = this.vectors[0].coord_x;
		var b = this.vectors[0].coord_y;
		var c = this.vectors[1].coord_x;
		var d = this.vectors[1].coord_y;
		var under_rad = (a + d)**2 + 4*c*b - 4*a*d;
	
		if (under_rad >= 0) {
			if (under_rad == 0) {
				lambda = a/2 + d/2;
				eigen_x = - c / Math.sqrt((a - lambda)**2 + c*c) * this.eig_length;
				eigen_y = eigen_x * (lambda - a) / c;
				if (eigen_x < 0) {
					eigen_x = -eigen_x;
					eigen_y = -eigen_y;
				}
				this.vectors_eigen.push(new this.Vector({coords: [eigen_x, eigen_y], c:this.eig_colour, label: `Eig (λ=${Math.round(lambda*100)/100})`, draggable: false,  visible: true}));	
			} else {
				lambda = a/2 + d/2 + Math.sqrt(under_rad)/2;
				eigen_x = - c / Math.sqrt((a - lambda)**2 + c*c) * this.eig_length;
				eigen_y = eigen_x * (lambda - a) / c;
				if (eigen_x < 0) {
					eigen_x = -eigen_x;
					eigen_y = -eigen_y;
				}
				this.vectors_eigen.push(new this.Vector({coords: [eigen_x, eigen_y], c:this.eig_colour, label: `Eig (λ=${Math.round(lambda*100)/100})`, draggable: false,  visible: true}));
				lambda = a/2 + d/2 - Math.sqrt(under_rad)/2;		
				eigen_x = - c / Math.sqrt((a - lambda)**2 + c*c) * this.eig_length;
				eigen_y = eigen_x * (lambda - a) / c;
				if (eigen_x < 0) {
					eigen_x = -eigen_x;
					eigen_y = -eigen_y;
				}
				this.vectors_eigen.push(new this.Vector({coords:[eigen_x, eigen_y], c:this.eig_colour, label: `Eig (λ=${Math.round(lambda*100)/100})`, draggable: false,  visible: true}));
			}
		}
	}
	// **************************************************************


	// **************************************************************
	// various rendering functions

	// render the scene (animated vectors excluded)
	render() {
		var parent = this;

		// helper func: draw grid
		function drawGrid() {
			// axes
			parent.ctx.beginPath();
			parent.ctx.moveTo(0, parent.canvas.height/parent.scale/2);
			parent.ctx.lineTo(parent.canvas.height/parent.scale, parent.canvas.height/parent.scale/2);
			parent.ctx.moveTo(parent.canvas.height/parent.scale/2, 0);
			parent.ctx.lineTo(parent.canvas.height/parent.scale/2, parent.canvas.height/parent.scale);
			parent.ctx.strokeStyle="rgba(160,160,160,1)";
			parent.ctx.stroke();
			parent.ctx.closePath();

			// grid
			parent.ctx.beginPath();
			for (var i = 0; i < parent.grid_res+1; i++) {
				parent.ctx.moveTo(0,  parent.canvas.height * i/parent.grid_res/parent.scale);
				parent.ctx.lineTo(parent.canvas.height/parent.scale, parent.canvas.height * i/parent.grid_res/parent.scale);
				parent.ctx.moveTo(parent.canvas.width  * i/parent.grid_res/parent.scale, 0);
				parent.ctx.lineTo(parent.canvas.width  * i/parent.grid_res/parent.scale, parent.canvas.height/parent.scale);			
			}	
			parent.ctx.strokeStyle="rgba(160,160,160,0.3)";
			parent.ctx.stroke();
			parent.ctx.closePath();
		}

		// helper func: show matrix (not labels)	
		function drawText() {
			parent.ctx.beginPath();
			parent.ctx.font = "20px Arial";
			parent.ctx.fillStyle = "#555555";
			parent.ctx.fillText("T=[               ]", 6, 23);
			parent.ctx.closePath();
	
			parent.ctx.beginPath();
			parent.ctx.font = "14px Arial";
			//parent.ctx.font-weight = "bold";
			parent.ctx.fillStyle = parent.vectors[0].line_col;
			parent.ctx.fillText(Math.round(parent.vectors[0].coord_x*100)/100, 42, 15);
			parent.ctx.fillText(Math.round(parent.vectors[0].coord_y*100)/100, 42, 35);
			parent.ctx.closePath();
	
			parent.ctx.beginPath();
			parent.ctx.font = "14px Arial";
			//parent.ctx.font-weight = "bold";
			parent.ctx.fillStyle = parent.vectors[1].line_col;
			parent.ctx.fillText(Math.round(parent.vectors[1].coord_x*100)/100, 80, 15);
			parent.ctx.fillText(Math.round(parent.vectors[1].coord_y*100)/100, 80, 35);
			parent.ctx.closePath();
		}

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		drawGrid();
	
		if (this.show_matrix_flag) { drawText(); }
	
		// draw regular vectors
		for (var i = this.vectors.length-1; i >= 0; i--) {
			this.vectors[i].draw();
		}
	
		// draw eigenvectors
		if (this.show_eigenvectors_flag) {
			this.eigenVecs();
			for (var i = 0; i < this.vectors_eigen.length; i++) {
				this.vectors_eigen[i].draw();
			}
		}
	}	

	// play animation
	playAnimation() {
		var parent = this;

		// helper func: render one frame of animation
		function render_frame() {
			parent.render();
			if (frames_left == 0) {
				clearInterval(timer);
			} else {
				for (let vec of parent.vectors_animated[parent.vectors_animated.length - frames_left]) {
					vec.draw();
				}
				//parent.vectors_animated[parent.vectors_animated.length - frames_left].draw();
				frames_left -= 1;
			}
		}
		var timer = setInterval(render_frame, this.frame_duration);
		var frames_left = this.vectors_animated.length;
	}	
	// END of rendering functions	
	// **************************************************************

	//document.addEventListener('orientationchange', render);


	// **********************************************
	// process mouse and touch events to move vectors

	onMouseDown(event) {
		this.canvas_pos = this.canvas.getBoundingClientRect();
		var mouseX = event.clientX - this.canvas_pos.left;
		var mouseY = event.clientY - this.canvas_pos.top;
		this.selectVector(mouseX, mouseY);
	}

	onTouchStart(event) {
		event.preventDefault();
		this.canvas_pos = this.canvas.getBoundingClientRect();
		var touchX = event.touches[0].clientX - this.canvas_pos.left;
		var touchY = event.touches[0].clientY - this.canvas_pos.top;
		this.selectVector(touchX, touchY);
	}

	selectVector(X, Y) {
		for (var i = this.vectors.length-1; i >= 0; i--) {
			if (this.vectors[i].checkHit(X, Y)) {
				this.selection_index = i;
				// record draggable area centre offset
				this.offset_x = X - this.vectors[this.selection_index].x;
				this.offset_y = Y - this.vectors[this.selection_index].y;
				// attach mousemove event
				this.canvas.addEventListener("mousemove", this._onMouseMove = event => this.onMouseMove(event));
				//this.canvas.addEventListener("mousemove", this._onMouseMove = this.onMouseMove.bind(this));
				this.canvas.addEventListener('touchmove', this._onTouchMove = event => this.onTouchMove(event));	
				return;
			}
		}
	}

	onMouseMove(event) {
		this.canvas_pos = this.canvas.getBoundingClientRect();
		var mouseX = event.clientX - this.canvas_pos.left - this.offset_x;
		var mouseY = event.clientY - this.canvas_pos.top - this.offset_y;
		this.vectors[this.selection_index].updateCoordsOnMove(mouseX, mouseY);
		this.render();
	}

	onTouchMove(event) {
		event.preventDefault();
		this.canvas_pos = this.canvas.getBoundingClientRect();
		var touchX = event.touches[0].clientX - this.canvas_pos.left - this.offset_x;
		var touchY = event.touches[0].clientY - this.canvas_pos.top - this.offset_y;
		this.vectors[this.selection_index].updateCoordsOnMove(touchX, touchY);
		this.render();
	}

	deselectVector(event) {			
		this.canvas.removeEventListener("mousemove", this._onMouseMove);
		this.canvas.removeEventListener("touchmove", this._onTouchMove);	

		if (this.selection_index !== undefined) {
			if (this.snap_to_grid_flag) {
				this.vectors[this.selection_index].snaptoGrid();
			}
			this.selection_index = undefined;
		}
		this.render();	
	}
	// END of mouse and touch processing
	// *****************************************************************	\
}