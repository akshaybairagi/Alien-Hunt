
//make stage Global Object - create all the global variable here

var buttons = [];
var draggableSprites = [];
var particles = [];
var tweens = [];
var shakingSprites = [];

function makeCanvas(width, height,border,backgroundColor) {
	var width = width || 256,
		height = height || 256,
		border	= border || "1px dashed black",
		backgroundColor = backgroundColor || "white";

	//Make the canvas element and add it to the DOM
	var canvas = document.createElement("canvas");
	canvas.id = "canvas";
	canvas.width = width;
	canvas.height = height;
	// canvas.style.width  = canvas.width.toString() + "px";
	// canvas.style.height = canvas.height.toString() + "px";
	canvas.style.border = border;
	canvas.style.backgroundColor = backgroundColor;
	document.body.appendChild(canvas);
	//Create the context as a property of the canvas
	canvas.ctx = canvas.getContext("2d");
	//Return the canvas
	return canvas;
}

function getCanvas(border,backgroundColor){
	var canvas = document.getElementById("game");
	canvas.style.border = border;
	canvas.style.backgroundColor = backgroundColor;
	//Create the context as a property of the canvas
	canvas.ctx = canvas.getContext("2d");
	//Return the canvas
	return canvas;
}

function DisplayObject(){
	//The sprite's position and size
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	//Rotation, alpha, visible, and scale properties
	this.rotation = 0;
	this.alpha = 1;
	this.visible = true;
	this.scaleX = 1;
	this.scaleY = 1;

	//`pivotX` and `pivotY` let you set the sprite's axis of rotation
	//(o.5 represents the sprite's center point)
	this.pivotX = 0.5;
	this.pivotY = 0.5;

	//Add `vx` and `vy` (velocity) variables that will help you move the sprite
	this.vx = 0;
	this.vy = 0;

	//A "private" `_layer` property
	this._layer = 0;

	//A `children` array on the sprite that will contain all the
	//child sprites in this container
	this.children = [];

	//The sprite's `parent` property
	this.parent = undefined;

	//The sprite's `children` array
	//this.children = [];

	//Optional drop shadow properties.
	//Set `shadow` to `true` if you want the sprite to display a shadow
	this.shadow = false;
	this.shadowColor = "black";
	this.shadowOffsetX = 3;
	this.shadowOffsetY = 3;
	this.shadowBlur = 3;

	//Optional blend mode property
	this.blendMode = undefined;

	//pattern
	this.pattern = false;

	//Properties for advanced features:
	//Image states and animation
	this.frames = [];
	this.loop = true;
	this._currentFrame = 0;
	this.playing = false;

	//Can the sprite be dragged?
	this._draggable = undefined;

	//Is the sprite circular? If it is, it will be given a `radius`
	//and `diameter`
	this._circular = false;

	//Is the sprite `interactive`? If it is, it can become clickable
	//or touchable
	this._interactive = false;

	//To move the object as per frames angle -- custome animation
	this.animate = {};
}

DisplayObject.prototype = {
	//Global position
	get gx() {
			if (this.parent) {

				//The sprite's global x position is a combination of
				//its local x value and its parent's global x value
				return this.x + this.parent.gx;
			} else {
				return this.x;
			}
		},

	get gy() {
		if (this.parent) {
		return this.y + this.parent.gy;
		} else {
		return this.y;
		}
	},

	//Depth layer
	get layer() {
		return this._layer;
	},

	set layer(value) {
		this._layer = value;
		if (this.parent) {
			this.parent.children.sort(function(a, b) {return a.layer - b.layer});
		}
	},

	//The `addChild` method lets you add sprites to this container
	addChild: function(sprite) {
		if (sprite.parent) {
			sprite.parent.removeChild(sprite);
		}
		sprite.parent = this;
		this.children.push(sprite);
	},

	removeChild: function(sprite) {
		if(sprite.parent === this) {
			this.children.splice(this.children.indexOf(sprite), 1);
		} else {
			throw new Error(sprite + "is not a child of " + this);
		}
	},

	//Getters that return useful points on the sprite
	get halfWidth() {
		return this.width / 2;
	},

	get halfHeight() {
		return this.height / 2;
	},

	get centerX() {
		return this.x + this.halfWidth;
	},

	get centerY() {
		return this.y + this.halfHeight;
	},

	/* Conveniences */
	//A `position` getter. It returns an object with x and y properties
	get position() {
		return {x: this.x, y: this.y};
	},

	//A `setPosition` method to quickly set the sprite's x and y values
	setPosition: function(x, y) {
		this.x = x;
		this.y = y;
	},

	//method to create and intialize pattern
	setPattern: function(image,pattern){
		this.pattern = true;
		this.pattern = g.canvas.ctx.createPattern(image,pattern);
	},

	//The `localBounds` and `globalBounds` methods return an object
	//with `x`, `y`, `width`, and `height` properties that define
	//the dimensions and position of the sprite. This is a convenience
	//to help you set or test boundaries without having to know
	//these numbers or request them specifically in your code.
	get localBounds() {
		return {
			x: 0,
			y: 0,
			width: this.width,
			height: this.height
		};
	},
	get globalBounds() {
		return {
			x: this.gx,
			y: this.gy,
			width: this.gx + this.width,
			height: this.gy + this.height
		};
	},
	//`empty` is a convenience property that will return `true` or
	//`false` depending on whether this sprite's `children`
	//array is empty
	get empty() {
		if (this.children.length === 0) {
			return true;
		} else {
			return false;
		}
	},

	//The following "put" methods help you position
	//another sprite in and around this sprite. You can position
	//sprites relative to this sprite's center, top, right, bottom or
	//left sides. The `xOffset` and `yOffset`
	//arguments determine by how much the other sprite's position
	//should be offset from this position.
	//In all these methods, `b` is the second sprite that is being
	//positioned relative to the first sprite (this one), `a`
	//Center `b` inside `a`
	putCenter: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Position `b` above `a`
	putTop: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y - b.height) + yOffset;
	},

	//Position `b` to the right of `a`
	putRight: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.width) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Position `b` below `a`
	putBottom: function(b, xOffset , yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x + a.halfWidth - b.halfWidth) + xOffset;
		b.y = (a.y + a.height) + yOffset;
	},

	//Position `b` to the left of `a`
	putLeft: function(b, xOffset, yOffset) {
		var a = this,
			xOffset = xOffset || 0,
			yOffset = yOffset || 0;
		b.x = (a.x - b.width) + xOffset;
		b.y = (a.y + a.halfHeight - b.halfHeight) + yOffset;
	},

	//Some extra conveniences for working with child sprites
	//Swap the depth layer positions of two child sprites
	swapChildren: function(child1, child2) {
		var index1 = this.children.indexOf(child1),
		index2 = this.children.indexOf(child2);
		if (index1 !== -1 && index2 !== -1) {
			//Swap the indexes
			child1.childIndex = index2;
			child2.childIndex = index1;
			//Swap the array positions
			this.children[index1] = child2;
			this.children[index2] = child1;
		} else {
			throw new Error('Both objects must be a child of the caller ' + this);
		}
	},

	//`add` and `remove` let you add and remove many sprites at the same time
	add: function(spritesToAdd) {
		spritesToAdd.forEach(function(sprite){ this.addChild(sprite);},this);
	},

	remove: function(spritesToRemove){
		for(var i = spritesToRemove.length-1; i >= 0; i--){
			this.removeChild(spritesToRemove[i]);
		}
	},
	removeHierarchy: function(spritesToRemove){
		for(var i = spritesToRemove.length -1; i >= 0; i--){
			if(spritesToRemove[i].children && spritesToRemove[i].children.length > 0){
				spritesToRemove[i].remove(spritesToRemove[i].children);
			}
			this.removeChild(spritesToRemove[i]);
		}
	},
	/* Advanced features */
	//If the sprite has more than one frame, return the
	//value of `_currentFrame`
	get currentFrame() {
		return this._currentFrame;
	},

	//The `circular` property lets you define whether a sprite
	//should be interpreted as a circular object. If you set
	//`circular` to `true`, the sprite is given `radius` and `diameter`
	//properties. If you set `circular` to `false`, the `radius`
	//and `diameter` properties are deleted from the sprite
	get circular() {
		return this._circular;
	},
	set circular (value) {
		//Give the sprite `diameter` and `radius` properties
		//if `circular` is `true`
		if (value === true && this._circular === false) {
			Object.defineProperties(this, {
				diameter: {
					get: function() {
						return this.width;
					},
					set: function(value) {
						this.width = value;
						this.height = value;
					},
					enumerable: true, configurable: true
				},
				radius: {
					get: function() {
						return this.halfWidth;
					},
					set: function(value) {
						this.width = value * 2;
						this.height = value * 2;
					},
					enumerable: true, configurable: true
				}
			});
			//Set this sprite's `_circular` property to `true`
			this._circular = true;
		}
		//Remove the sprite's `diameter` and `radius` properties
		//if `circular` is `false`
		if (value === false && this._circular === true) {
			delete this.diameter;
			delete this.radius;
			this._circular = false;
		}
	},

	//Is the sprite draggable by the pointer? If `draggable` is set
	//to `true`, the sprite is added to a `draggableSprites`
	//array. All the sprites in `draggableSprites` are updated each
	//frame to check whether they're being dragged.
	get draggable() {
		return this._draggable;
	},
	set draggable(value){
		if (value === true){
			draggableSprites.push(this);
			this._draggable = true;
		}
		//If it's `false`, remove it from the `draggableSprites` array
		if (value === false){
			draggableSprites.splice(draggableSprites.indexOf(this), 1);
		}
	},
	//Is the sprite interactive? If `interactive` is set to `true`,
	//the sprite is run through the `makeInteractive` function.
	//`makeInteractive` makes the sprite sensitive to pointer
	//actions. It also adds the sprite to the `buttons` array,
	//which is updated each frame.
	//(You’ll learn how to implement this in Chapter 6.)
	get interactive(){
		return this._interactive;
	},
	set interactive(value){
		if (value === true){
			//Add interactive properties to the sprite
			//so that it can act like a button
			makeInteractive(this);
			//Add the sprite to the global `buttons` array so
			//it can be updated each frame
			buttons.push(this);
			//Set this sprite’s private `_interactive` property to `true`
			this._interactive = true;
		}
		if (value === false){
			//Remove the sprite's reference from the
			//`buttons` array so that it's no longer affected
			//by mouse and touch interactivity
			buttons.splice(buttons.indexOf(this), 1);
			this._interactive = false;
		}
	}
};
//General Purpose remove function
function remove(spritesToRemove){
	for(var i = spritesToRemove.length-1; i >= 0; i--){
		spritesToRemove[i].parent.removeChild(spritesToRemove[i]);
	}
}

//Global object - container for the game
var stage = new DisplayObject();

function render(canvas) {
	//Get a reference to the context
	var ctx = canvas.ctx;

	//Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//Loop through each sprite object in the stage's `children` array
	stage.children.forEach(displaySprite);
	function displaySprite(sprite) {
		//Only display the sprite if it's visible
		//and within the area of the canvas
		if (
			sprite.visible
			&& sprite.gx < canvas.width + sprite.width
			&& sprite.gx + sprite.width >= -sprite.width
			&& sprite.gy < canvas.height + sprite.height
			&& sprite.gy + sprite.height >= -sprite.height
		) {
			//Save the canvas's present state
			ctx.save();

			//Shift the canvas to the center of the sprite's position
			ctx.translate(
			sprite.x + (sprite.width * sprite.pivotX),
			sprite.y + (sprite.height * sprite.pivotY)
			);
			//Set the sprite's `rotation`, `alpha` and `scale`
			ctx.rotate(sprite.rotation);
			ctx.globalAlpha = sprite.alpha * sprite.parent.alpha;
			ctx.scale(sprite.scaleX, sprite.scaleY);
			//Display the sprite's optional drop shadow
			if(sprite.shadow) {
				ctx.shadowColor = sprite.shadowColor;
				ctx.shadowOffsetX = sprite.shadowOffsetX;
				ctx.shadowOffsetY = sprite.shadowOffsetY;
				ctx.shadowBlur = sprite.shadowBlur;
			}
			//Display the optional blend mode
			if (sprite.blendMode) ctx.globalCompositeOperation = sprite.blendMode;

			//Use the sprite's own `render` method to draw the sprite
			if (sprite.render) sprite.render(ctx);

			if (sprite.children && sprite.children.length > 0) {
				//Reset the context back to the parent sprite's top-left corner,
				//relative to the pivot point
				ctx.translate(-sprite.width * sprite.pivotX , -sprite.height * sprite.pivotY);
				//Loop through the parent sprite's children
				sprite.children.forEach(function(child){
					//display the child
					displaySprite(child);
				});
			}
			//Restore the canvas to its previous state
			ctx.restore();
		}
	}
}

function Group(spritesToGroup){
	DisplayObject.call(this);

	spritesToGroup.forEach(function(sprite){this.addChild(sprite);},this);

}
Group.prototype = new DisplayObject();
Group.prototype.constructor = Group;

Group.prototype.addChild = function(sprite) {
	if (sprite.parent) {
		sprite.parent.removeChild(sprite);
	}
	sprite.parent = this;
	this.children.push(sprite);
	//Figure out the new size of the group
	this.calculateSize();
};
Group.prototype.removeChild = function(sprite) {
	if(sprite.parent === this) {
		this.children.splice(this.children.indexOf(sprite),1);
		//Figure out the new size of the group
		this.calculateSize();
	} else {
		throw new Error(sprite + 'is not a child of ' + this);
	}
};
Group.prototype.calculateSize = function() {
//Calculate the width based on the size of the largest child
//that this sprite contains
	if (this.children.length > 0) {
		//Some temporary private variables to help track the new
		//calculated width and height
		this._newWidth = 0;
		this._newHeight = 0;
		//Find the width and height of the child sprites furthest
		//from the top left corner of the group
		this.children.forEach(function(child){

			//Find child sprites that combined x value and width
			//that's greater than the current value of `_newWidth`
			if (child.x + child.width > this._newWidth) {
				//The new width is a combination of the child's
				//x position and its width
				this._newWidth = child.x + child.width;
			}
			if (child.y + child.height > this._newHeight) {
				this._newHeight = child.y + child.height;
			}
		},this);
		//Apply the `_newWidth` and `_newHeight` to this sprite's width
		//and height
		this.width = this._newWidth;
		this.height = this._newHeight;
	}
};
//A higher level wrapper for the group sprite
function group(spritesToGroup) {
	var sprite = new Group(spritesToGroup);
	stage.addChild(sprite);
	return sprite;
}

function Sprite(source,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);
	//Assign the argument values to this sprite
	this.x = x || 0;
	this.y = y || 0;

	//We need to figure out what the source is, and then use
	//that source data to display the sprite image correctly
	//Is the source a JavaScript Image object?
	if (source){
		if(source instanceof Image) {
			this.createFromImage(source);
		}
		//Is the source a tileset from a texture atlas?
		//(It is if it has a `frame` property)
		else if (source.frame) {
			this.createFromAtlas(source);
		}
		//If the source contains an `image` subproperty, this must
		//be a `frame` object that's defining the rectangular area of an inner subimage.
		//Use that subimage to make the sprite. If it doesn't contain a
		//`data` property, then it must be a single frame
		else if (source.image && !source.data) {
			this.createFromTileset(source);
		}
		//If the source contains an `image` subproperty
		//and a `data` property, then it contains multiple frames
		else if (source.image && source.data) {
			this.createFromTilesetFrames(source);
		}
		else if (source instanceof Array) {
			if (source[0] && source[0].source) {
				//The source is an array of frames on a texture atlas tileset
				this.createFromAtlasFrames(source);
			}
			//It must be an array of image objects
			else if (source[0] instanceof Image){
				this.createFromImages(source);
			}
			//throw an error if the sources in the array aren't recognized
			else {
				throw new Error('The image sources in '+source+' are not recognized');
			}
		}
		//Throw an error if the source is something we can't interpret
		else {
			throw new Error('The image source '+source+' is not recognized');
		}
	}
}

Sprite.prototype = new DisplayObject();
Sprite.prototype.constructor = Sprite;

Sprite.prototype.createFromImage = function(source) {
    //Throw an error if the source is not an Image object
    if (!(source instanceof Image)) {
      throw new Error(source + ' is not an image object');
    } else {
		  this.source = source;
		  this.sourceX =  0;
		  this.sourceY =  0;
		  this.width = source.width;
		  this.height = source.height;
		  this.sourceWidth = source.width;
		  this.sourceHeight = source.height;
	}
};

 Sprite.prototype.createFromAtlas = function(source) {
    this.tilesetFrame = source;
    this.source = this.tilesetFrame.source;
    this.sourceX = this.tilesetFrame.frame.x;
    this.sourceY = this.tilesetFrame.frame.y;
    this.width = this.tilesetFrame.frame.w;
    this.height = this.tilesetFrame.frame.h;
    this.sourceWidth = this.tilesetFrame.frame.w;
    this.sourceHeight = this.tilesetFrame.frame.h;
};

Sprite.prototype.createFromTileset = function(source) {
	//Throw an error if the source is not an image object
	if (!(source.image instanceof Image)) {
	  throw new Error(source.image + ' is not an image object');
	}
	else {
	  this.source = source.image;
	  this.sourceX = source.x;
	  this.sourceY = source.y;
	  this.width = source.width;
	  this.height = source.height;
	  this.sourceWidth = source.width;
	  this.sourceHeight = source.height;
	}
};

Sprite.prototype.createFromTilesetFrames = function(source) {
	//Throw an error if the source is not an Image object
	if (!(source.image instanceof Image)) {
	  throw new Error(source.image + ' is not an image object');
	} else {
	  this.source = source.image;
	  this.frames = source.data;
	  //Set the sprite to the first frame
	  this.sourceX = this.frames[0][0];
	  this.sourceY = this.frames[0][1];
	  this.width = source.width;
	  this.height = source.height;
	  this.sourceWidth = source.width;
	  this.sourceHeight = source.height;
	}
};

Sprite.prototype.createFromAtlasFrames = function(source) {
	this.frames = source;
	this.source = source[0].source;
	this.sourceX = source[0].frame.x;
	this.sourceY = source[0].frame.y;
	this.width = source[0].frame.w;
	this.height = source[0].frame.h;
	this.sourceWidth = source[0].frame.w;
	this.sourceHeight = source[0].frame.h;
};

Sprite.prototype.createFromImages = function(source) {
	this.frames = source;
	this.source = source[0];
	this.sourceX = 0;
	this.sourceY = 0;
	this.width = source[0].width;
	this.height = source[0].width;
	this.sourceWidth = source[0].width;
	this.sourceHeight = source[0].height;
};
//Add a `gotoAndStop` method to go to a specific frame.
Sprite.prototype.gotoAndStop = function(frameNumber) {
    if (this.frames.length > 0 && frameNumber < this.frames.length) {

      //a. Frames made from tileset sub-images.
      //If each frame is an array, then the frames were made from an
      //ordinary Image object using the `frames` method
      if (this.frames[0] instanceof Array) {
        this.sourceX = this.frames[frameNumber][0];
        this.sourceY = this.frames[frameNumber][1];
      }

      //b. Frames made from texture atlas frames.
      //If each frame isn't an array, and it has a sub-object called `frame`,
      //then the frame must be a texture atlas id name.
      //In that case, get the source position from the atlas's `frame` object.
      else if (this.frames[frameNumber].frame) {
        this.sourceX = this.frames[frameNumber].frame.x;
        this.sourceY = this.frames[frameNumber].frame.y;
        this.sourceWidth = this.frames[frameNumber].frame.w;
        this.sourceHeight = this.frames[frameNumber].frame.h;
        this.width = this.frames[frameNumber].frame.w;
        this.height = this.frames[frameNumber].frame.h;
      }

      //c. Frames made from individual image objects.
      //If neither of the above are true, then each frame must be
      //an individual Image object
      else {
        this.source = this.frames[frameNumber];
        this.sourceX = 0;
        this.sourceY = 0;
        this.width = this.source.width;
        this.height = this.source.height;
        this.sourceWidth = this.source.width;
        this.sourceHeight = this.source.height;
      }
      //Set the `_currentFrame` value to the chosen frame
      this._currentFrame = frameNumber;
    }
    //Throw an error if this sprite doesn't contain any frames
    else {
      throw new Error('Frame number ' + frameNumber +' does not exist');
    }
  };

  //The `render` method explains how to draw the sprite
Sprite.prototype.render = function(ctx) {
	ctx.drawImage(
	  this.source,
	  Math.round(this.sourceX), Math.round(this.sourceY),
	  Math.round(this.sourceWidth), Math.round(this.sourceHeight),
	  Math.round(-this.width * this.pivotX),
	  Math.round(-this.height * this.pivotY),
	  Math.round(this.width), Math.round(this.height)
	);
};

//A higher-level wrapper
function sprite(source,x,y) {
	var sprite = new Sprite(source, x, y);
	if (sprite.frames.length > 0) addStatePlayer(sprite);
	stage.addChild(sprite);
	return sprite;
};

function frame(source, x, y, width, height){
	var o = {};
	o.image = source;
	o.x = x;
	o.y = y;
	o.width = width;
	o.height = height;
	return o;
};

function frames(source, arrayOfPositions, width, height){
	var o = {};
	o.image = source;
	o.data = arrayOfPositions;
	o.width = width;
	o.height = height;
	return o;
};
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

function contain (sprite, bounds, _bounce, _extra){
	var x = bounds.x,
	y = bounds.y,
	width = bounds.width,
	height = bounds.height;

	var bounce = _bounce || false;
	var extra = _extra || undefined;
	//The `collision` object is used to store which
	//side of the containing rectangle the sprite hits
	var collision;
	//Left
	if (sprite.x < x) {
		//Bounce the sprite if `bounce` is true
		if (bounce) sprite.vx *= -1;
		//If the sprite has `mass`, let the mass
		//affect the sprite's velocity
		if(sprite.mass) sprite.vx /= sprite.mass;
		sprite.x = x;
		collision = "left";
	}
	//Top
	if (sprite.y < y) {
		if (bounce) sprite.vy *= -1;
		if(sprite.mass) sprite.vy /= sprite.mass;
		sprite.y = y;
		collision = "top";
	}
	//Right
	if (sprite.x + sprite.width > width) {
		if (bounce) sprite.vx *= -1;
		if(sprite.mass) sprite.vx /= sprite.mass;
		sprite.x = width - sprite.width;
		collision = "right";
	}
	//Bottom
	if (sprite.y + sprite.height > height) {
		if (bounce) sprite.vy *= -1;
		if(sprite.mass) sprite.vy /= sprite.mass;
		sprite.y = height - sprite.height;
		collision = "bottom";
	}
	//The `extra` function runs if there was a collision
	//and `extra` has been defined
	if (collision && extra) extra(collision);
		//Return the `collision` object
		return collision;
};


function renderWithInterpolation(canvas, lagOffset){
  //Get a reference to the context
  var ctx = canvas.ctx;

  //Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Loop through each sprite object in the stage's `children` array
  stage.children.forEach(displaySprite);

  function displaySprite(sprite) {
    //Only display the sprite if it's visible
    //and within the area of the canvas
    if (
      sprite.visible
      && sprite.gx < canvas.width + sprite.width
      && sprite.gx + sprite.width > -sprite.width
      && sprite.gy < canvas.height + sprite.height
      && sprite.gy + sprite.height > -sprite.height
		) {

		  //Save the canvas's present state
		  ctx.save();
		  //Interpolation
		  if (sprite.previousX !== undefined) {
				sprite.renderX = (sprite.x - sprite.previousX) * lagOffset + sprite.previousX;
		  }else{
				sprite.renderX = sprite.x;
		  }
		  if (sprite.previousY !== undefined) {
				sprite.renderY = (sprite.y - sprite.previousY) * lagOffset + sprite.previousY;
		  }else{
				sprite.renderY = sprite.y;
		  }

		  //Draw the sprite at its interpolated position
		  ctx.translate(
				sprite.renderX + (sprite.width * sprite.pivotX),
				sprite.renderY + (sprite.height * sprite.pivotY)
		  );

		  //Set the sprite's `rotation`, `alpha` and `scale`
		  ctx.rotate(sprite.rotation);
		  ctx.globalAlpha = sprite.alpha * sprite.parent.alpha;
		 	ctx.scale(sprite.scaleX, sprite.scaleY);

		  //Display the sprite's optional drop shadow
		  if(sprite.shadow) {
				ctx.shadowColor = sprite.shadowColor;
				ctx.shadowOffsetX = sprite.shadowOffsetX;
				ctx.shadowOffsetY = sprite.shadowOffsetY;
				ctx.shadowBlur = sprite.shadowBlur;
		  }

		  //Display the optional blend mode
		  if(sprite.blendMode) ctx.globalCompositeOperation = sprite.blendMode;

		  //Use the sprite's own `render` method to draw the sprite
		  if(sprite.render) sprite.render(ctx);

		  //If the sprite contains child sprites in its
		  //`children` array, display them by recursively calling this very same
		  //`displaySprite` function again
		  if(sprite.children && sprite.children.length > 0){
				//Reset the context back to the parent sprite's top left corner,
				//relative to the pivot point
				ctx.translate(-sprite.width * sprite.pivotX , -sprite.height * sprite.pivotY);
				//Loop through the parent sprite's children
				sprite.children.forEach(displaySprite);
		  }
		  //Restore the canvas to its previous state
		  ctx.restore();
		}
  }
}

function Button(source, x, y){
	Sprite.call(this,source,x,y);
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
	this.interactive = true;
}

Button.prototype = new Sprite();
Button.prototype.constructor = Button;

function button(source, x, y) {
	var sprite = new Button(source, x, y);
	stage.addChild(sprite);
	return sprite;
}

function makeInteractive(o){
	//The `press`, `release`, `over`, `out`, and `tap` methods. They're `undefined`
	//for now, but they can be defined in the game program
	o.press = o.press || undefined;
	o.release = o.release || undefined;
	o.over = o.over || undefined;
	o.out = o.out || undefined;
	o.tap = o.tap || undefined;
	//The `state` property tells you the button's
	//current state. Set its initial state to "up"
	o.state = "up";
	//The `action` property tells you whether it’s being pressed or
	//released
	o.action = "";
	//The `pressed` and `hoverOver` Booleans are mainly for internal
	//use in this code to help figure out the correct state.
	//`pressed` is a Boolean that helps track whether
	//the sprite has been pressed down
	o.pressed = false;
	//`hoverOver` is a Boolean that checks whether the pointer
	//has hovered over the sprite
	o.hoverOver = false;
	//The `update` method will be called each frame
	//inside the game loop
	o.update = function(pointer, canvas){
		//Figure out if the pointer is touching the sprite
		var hit = pointer.hitTestSprite(o);
		//1. Figure out the current state
		if (pointer.isUp) {
			//Up state
			o.state = "up";
			//Show the first image state frame, if this is a `Button` sprite
			if (o instanceof Button) o.gotoAndStop(0);
		}
		//If the pointer is touching the sprite, figure out
		//if the over or down state should be displayed
		if (hit) {
			//Over state
			o.state = "over";
			//Show the second image state frame if this sprite has
			//3 frames and it's a `Button` sprite
			if (o.frames && o.frames.length === 3 && o instanceof Button) {
				o.gotoAndStop(1);
			}
			//Down state
			if (pointer.isDown) {
				o.state = "down";
				//Show the third frame if this sprite is a `Button` sprite and it
				//has only three frames, or show the second frame if it
				//has only two frames
				if(o instanceof Button) {
					if (o.frames.length === 3) {
						o.gotoAndStop(2);
					} else {
						o.gotoAndStop(1);
					}
				}
			}
		}
		//Perform the correct interactive action
		//a. Run the `press` method if the sprite state is "down" and
		//the sprite hasn't already been pressed
		if (o.state === "down") {
			if (!o.pressed) {
				if (o.press) o.press();
				o.pressed = true;
				o.action = "pressed";
			}
		}
		//b. Run the `release` method if the sprite state is "over" and
		//the sprite has been pressed
		if (o.state === "over") {
			if (o.pressed) {
				if (o.release) o.release();
				o.pressed = false;
				o.action = "released";
				//If the pointer was tapped and the user assigned a `tap`
				//method, call the `tap` method
				if (pointer.tapped && o.tap) o.tap();
			}
			//Run the `over` method if it has been assigned
			if (!o.hoverOver){
				if (o.over) o.over();
				o.hoverOver = true;
			}
		}
		//c. Check whether the pointer has been released outside
		//the sprite's area. If the button state is "up" and it has
		//already been pressed, then run the `release` method
		if (o.state === "up") {
			if (o.pressed) {
				if (o.release) o.release();
				o.pressed = false;
				o.action = "released";
			}
			//Run the `out` method if it has been assigned
			if (o.hoverOver) {
				if (o.out) o.out();
				o.hoverOver = false;
			}
		}
	};
}



/*
grid
----

Helps you to automatically create a grid of sprites. `grid` returns a
`group` sprite object that contains a sprite for every cell in the
grid. You can define the rows and columns in the grid, whether or
not the sprites should be centered inside each cell, or what their offset from the
top left corner of each cell should be. Supply a function that
returns the sprite that you want to make for each cell. You can
supply an optional final function that runs any extra code after
each sprite has been created. Here's the format for creating a grid:

    gridGroup = grid(

      //Set the grid's properties
      columns, rows, cellWidth, cellHeight,
      areSpirtesCentered?, xOffset, yOffset,

      //A function that returns a sprite
      () => g.circle(16, "blue"),

      //An optional final function that runs some extra code
      () => console.log("extra!")
    );
*/
function grid(
    columns, rows, cellWidth, cellHeight,
    centerCell, xOffset, yOffset ,
    makeSprite,
    extra
  ){

	var columns = (typeof columns !== 'undefined') ? columns : 0,
	rows = (typeof rows !== 'undefined') ? rows : 0,
	cellWidth = (typeof cellWidth !== 'undefined') ? cellWidth : 32,
	cellHeight = (typeof cellHeight !== 'undefined') ? cellHeight : 32,
	centerCell = (typeof centerCell !== 'undefined') ? centerCell : false,
	xOffset = (typeof xOffset !== 'undefined') ? xOffset : 0,
	yOffset = (typeof yOffset !== 'undefined') ? yOffset : 0,
	makeSprite = (typeof makeSprite !== 'undefined') ? makeSprite : undefined,
	extra = (typeof extra !== 'undefined') ? extra : undefined;

  //Create an empty group called `container`. This `container`
  //group is what the function returns back to the main program.
  //All the sprites in the grid cells will be added
  //as children to this container
  var container = group([]);

  //The `create` method plots the grid

  var createGrid = function(){

    //Figure out the number of cells in the grid
    var length = columns * rows;

    //Create a sprite for each cell
    for(var i = 0; i < length; i++) {

      //Figure out the sprite's x/y placement in the grid
      var x = (i % columns) * cellWidth,
          y = Math.floor(i / columns) * cellHeight;

      //Use the `makeSprite` function supplied in the constructor
      //to make a sprite for the grid cell
      var sprite = makeSprite();

      //Add the sprite to the `container`
      container.addChild(sprite);

      //Should the sprite be centered in the cell?

      //No, it shouldn't be centered
      if (!centerCell) {
        sprite.x = x + xOffset;
        sprite.y = y + yOffset;
      }

      //Yes, it should be centered
      else {
        sprite.x
          = x + (cellWidth / 2)
          - sprite.halfWidth + xOffset;
        sprite.y
          = y + (cellHeight / 2)
          - sprite.halfHeight + yOffset;
      }
      //Run any optional extra code. This calls the
      //`extra` function supplied by the constructor
      if (extra) extra(sprite);
    }
  };

  //Run the `createGrid` method
  createGrid();

  //Return the `container` group back to the main program
  return container;
}

/*
addStatePlayer
-------------

`addStatePlayer` adds a state manager and keyframe animation player for
sprites with more than one frame. Its called automatically when
`sprite`s are created.

*/

function addStatePlayer(sprite) {
  var frameCounter = 0,
      numberOfFrames = 0,
      startFrame = 0,
      endFrame = 0,
      timerInterval = undefined;
      //playing = false;

  //The `show` function (to display static states.)
  function show(frameNumber) {
    //Reset any possible previous animations
    reset();

    //Find the new state on the sprite.
    sprite.gotoAndStop(frameNumber);
  }

  //The `play` function plays all the sprites frames
function play() {
	if (!sprite.playing) {
	  playSequence([0, sprite.frames.length - 1]);
	}
}

//The `stop` function stops the animation at the current frame
function stop() {
	if (sprite.playing) {
	  reset();
	  sprite.gotoAndStop(sprite.currentFrame);
	}
}

	//The `playSequence` function, to play a sequence of frames.
	function playSequence(sequenceArray){
		//Reset any possible previous animations
		reset();

		//Figure out how many frames there are in the range
		startFrame = sequenceArray[0];
		endFrame = sequenceArray[1];
		numberOfFrames = endFrame - startFrame;

		//Compensate for two edge cases:
		//1. If the `startFrame` happens to be `0`
		if (startFrame === 0) {
		  numberOfFrames += 1;
		  frameCounter += 1;
		}

		//2. If only a two-frame sequence was provided
		if(numberOfFrames === 1){
		  numberOfFrames = 2;
		  frameCounter += 1;
		};

		//Calculate the frame rate. Set the default fps to 12
		if (!sprite.fps) sprite.fps = 12;

		var frameRate = 1000 / sprite.fps;

		//Set the sprite to the starting frame
		sprite.gotoAndStop(startFrame);

		//If the state isn't already playing, start it
		if(!sprite.playing) {
		  timerInterval = setInterval(advanceFrame.bind(this), frameRate);
		  sprite.playing = true;
		}
	}

//`advanceFrame` is called by `setInterval` to display the next frame
//in the sequence based on the `frameRate`. When frame sequence
//reaches the end, it will either stop it or loop it
	function advanceFrame(){
	//Advance the frame if `frameCounter` is less than
	//the state's total frames
	if (frameCounter < numberOfFrames) {

	  //Advance the frame
	  sprite.gotoAndStop(sprite.currentFrame + 1);

	  //Update the frame counter
	  frameCounter += 1;

	//If we've reached the last frame and `loop`
	//is `true`, then start from the first frame again
	} else {
	  if (sprite.loop) {
		sprite.gotoAndStop(startFrame);
		frameCounter = 1;
	  }
	}
}

function reset(){
	//Reset `playing` to `false`, set the `frameCounter` to 0,
	//and clear the `timerInterval`
	if (timerInterval !== undefined && sprite.playing === true) {
	  sprite.playing = false;
	  frameCounter = 0;
	  startFrame = 0;
	  endFrame = 0;
	  numberOfFrames = 0;
	  clearInterval(timerInterval);
	}
}

  //Add the `show`, `play`, `stop` and `playSequence` methods to the sprite.
  sprite.show = show;
  sprite.play = play;
  sprite.stop = stop;
  //sprite.playing = playing;
  sprite.playSequence = playSequence;
}

function filmstrip(image, frameWidth, frameHeight, spacing){
	var spacing = (typeof spacing !== 'undefined')? spacing : 0;
	//An array to store the x and y positions of each frame
	var positions = [];
	//Find out how many columns and rows there are in the image
	var columns = image.width / frameWidth,
	rows = image.height / frameHeight;
	//Find the total number of frames
	var numberOfFrames = columns * rows;

	for(var i = 0; i < numberOfFrames; i++) {
		//Find the correct row and column for each frame
		//and figure out its x and y position
		var x = (i % columns) * frameWidth,
		y = Math.floor(i / columns) * frameHeight;
		//Compensate for any optional spacing (padding) around the frames if
		//there is any. This bit of code accumulates the spacing offsets from the
		//left side of the tileset and adds them to the current tile's position
		if (spacing && spacing > 0) {
			x += spacing + (spacing * i % columns);
			y += spacing + (spacing * Math.floor(i / columns));
		}
		//Add the x and y value of each frame to the `positions` array
		positions.push([x, y]);
	}
	//Create and return the animation frames using the `frames` method
	return frames(image, positions, frameWidth, frameHeight);
};


var progressBar = {
	maxWidth: 0,
	height: 0,
	backgroundColor: "gray",
	foregroundColor: "cyan",
	backBar: null,
	frontBar: null,
	percentage: null,
	assets: null,
	initialized: false,
	//Use the `create` method to create the progress bar
	create: function(canvas, assets) {
		if (!this.initialized) {
			//Store a reference to the `assets` object
			this.assets = assets;
			//Set the maximum width to half the width of the canvas
			this.maxWidth = canvas.width / 2;
			//Build the progress bar using two rectangle sprites and
			//one text sprite:
			//1. Create the background bar's gray background
			this.backBar = rectangle(this.maxWidth, 32, this.backgroundColor);
			this.backBar.x = (canvas.width / 2) - (this.maxWidth / 2);
			this.backBar.y = (canvas.height / 2) - 16;
			//2. Create the blue foreground bar. This is the element of the
			//progress bar that will increase in width as assets load
			this.frontBar = rectangle(this.maxWidth, 32, this.foregroundColor);
			this.frontBar.x = (canvas.width / 2) - (this.maxWidth / 2);
			this.frontBar.y = (canvas.height / 2) - 16;
			//3. A text sprite that will display the percentage
			//of assets that have loaded
			this.percentage = text("0%", "28px sans-serif", "black");
			this.percentage.x = (canvas.width / 2) - (this.maxWidth / 2) + 12;
			this.percentage.y = (canvas.height / 2) - 16;
			//Flag the `progressBar` as having been initialized
			this.initialized = true;
		}
	},
	//Use the `update` method to update the width of the bar and
	//percentage loaded each frame:
	update: function(){
		//Change the width of the blue `frontBar` to match the
		//ratio of assets that have loaded. Adding `+1` to
		//`assets.loaded` means that the loading bar will appear at 100%
		//when the last asset is being loaded, which is reassuring for the
		//player observing the load progress

		var ratio = (this.assets.loaded + 1) / this.assets.toLoad;
		this.frontBar.width = this.maxWidth * ratio;
		//Display the percentage
		this.percentage.content = Math.floor((ratio) * 100) + '%';
	},
	//Use the `remove` method to remove the progress bar when all the
	//game assets have finished loading
/* 	remove: function() {
		//Remove the progress bar using the universal sprite `remove` function
		remove([this.frontBar]);
		remove([this.backBar]);
		remove([this.percentage]);
	} */
	remove: function() {
		//Remove the progress bar using the universal sprite `remove` function
		remove([this.frontBar,this.backBar,this.percentage]);
	}
};


function shake(sprite, magnitude, angular,noOfFrames){
	var magnitude = checkIfUndefined(magnitude,16),
		angular = checkIfUndefined(angular,false);
	//A counter to count the number of shakes
	var counter = 1;
	//The total number of shakes (there will be 1 shake per frame)
	var numberOfShakes = noOfFrames || 10;
	//Capture the sprite's position and angle so you can
	//restore them after the shaking has finished
	var startX = sprite.x,
	startY = sprite.y,
	startAngle = sprite.rotation;
	//Divide the magnitude into 10 units so that you can
	//reduce the amount of shake by 10 percent each frame
	var magnitudeUnit = magnitude / numberOfShakes;
	//The `randomInt` helper function
	var randomInt = function(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	//Add the sprite to the `shakingSprites` array if it
	//isn't already there
	if(shakingSprites.indexOf(sprite) === -1){
		shakingSprites.push(sprite);
		//Add an `updateShake` method to the sprite.
		//The `updateShake` method will be called each frame
		//in the game loop. The shake effect type can be either
		//up and down (x/y shaking) or angular (rotational shaking)
		sprite.updateShake = function(){
			if(angular) {
				angularShake();
			} else {
				upAndDownShake();
			}
		};
	}
	//The `upAndDownShake` function
	function upAndDownShake() {
		//Shake the sprite while the `counter` is less than
		//the `numberOfShakes`
		if (counter < numberOfShakes) {
			//Reset the sprite's position at the start of each shake
			sprite.x = startX;
			sprite.y = startY;
			//Reduce the magnitude
			magnitude -= magnitudeUnit;
			//Randomly change the sprite's position
			sprite.x += randomInt(-magnitude, magnitude);
			sprite.y += randomInt(-magnitude, magnitude);
			//Add 1 to the counter
			counter += 1;
		}
		//When the shaking is finished, restore the sprite to its original
		//position and remove it from the `shakingSprites` array
		if (counter >= numberOfShakes){
			sprite.x = startX;
			sprite.y = startY;
			shakingSprites.splice(shakingSprites.indexOf(sprite), 1);
		}
	}
	//The `angularShake` function
	//First set the initial tilt angle to the right (+1)
	var tiltAngle = 1;

	function angularShake() {
		if (counter < numberOfShakes) {
			//Reset the sprite's rotation
			sprite.rotation = startAngle;
			//Reduce the magnitude
			magnitude -= magnitudeUnit;
			//Rotate the sprite left or right, depending on the direction,
			//by an amount in radians that matches the magnitude
			sprite.rotation = magnitude * tiltAngle;
			counter += 1;
			//Reverse the tilt angle so that the sprite is tilted
			//in the opposite direction for the next shake
			tiltAngle *= -1;
		}
		//When the shaking is finished, reset the sprite's angle and
		//remove it from the `shakingSprites` array
		if (counter >= numberOfShakes){
			sprite.rotation = startAngle;
			shakingSprites.splice(shakingSprites.indexOf(sprite), 1);
		}
	}
}
