function Rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y){
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.width = width || 32;
	this.height = height || 32;
	this.fillStyle = fillStyle || "gray";
	this.strokeStyle = strokeStyle || "none";
	this.lineWidth = lineWidth || 0;
	this.x = x || 0;
	this.y = y || 0;
	this.mask = false;
}

Rectangle.prototype = new DisplayObject();
Rectangle.prototype.constructor=Rectangle;

//The `render` method explains how to draw the sprite
Rectangle.prototype.render= function(ctx) {
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		if (this.gradient)
			ctx.fillStyle = this.gradient;
		else if(this.pattern)
			ctx.fillStyle = this.pattern;
		else
			ctx.fillStyle = this.fillStyle;
		ctx.beginPath();
		ctx.rect(
		//Draw the sprite around its `pivotX` and `pivotY` point
		-this.width * this.pivotX,
		-this.height * this.pivotY,
		this.width,
		this.height
		);
		if (this.strokeStyle !== "none") ctx.stroke();
		if (this.fillStyle !== "none") ctx.fill();
		if (this.mask && this.mask === true) ctx.clip();
};
//A higher-level wrapper for the rectangle sprite
function rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y) {
	//Create the sprite
	var sprite = new Rectangle(width, height, fillStyle, strokeStyle, lineWidth, x, y);
	//Add the sprite to the stage
	stage.addChild(sprite);
	//Return the sprite to the main program
	return sprite;
}


function Circle(diameter,fillStyle,strokeStyle,lineWidth,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	//Enable `radius` and `diameter` properties
	this.circular = true;

	//Assign the argument values to this sprite
	this.diameter = (typeof diameter !== 'undefined') ? diameter : 32;
	this.fillStyle = (typeof fillStyle !== 'undefined') ? fillStyle : "gray";
	this.strokeStyle = (typeof strokeStyle !== 'undefined') ? strokeStyle : "none";
	this.lineWidth = (typeof lineWidth !== 'undefined') ? lineWidth : 0;
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
	//Add a `mask` property to enable optional masking
	this.mask = false;
}
Circle.prototype = new DisplayObject();
Circle.prototype.constructor=Circle;
//The `render` method
Circle.prototype.render= function(ctx) {
			ctx.strokeStyle = this.strokeStyle;
			ctx.lineWidth = this.lineWidth;
			if (this.gradient){
				ctx.fillStyle = this.gradient;
			}
			else{
					ctx.fillStyle = this.fillStyle;
			}
			ctx.beginPath();
			ctx.arc(
				this.radius + (-this.diameter * this.pivotX),
				this.radius + (-this.diameter * this.pivotY),
				this.radius,
				0, 2*Math.PI,
				false
			);
		if (this.strokeStyle !== "none") ctx.stroke();
		if (this.fillStyle !== "none") ctx.fill();
		if (this.mask && this.mask === true) ctx.clip();
};
//A higher level wrapper for the circle sprite
function circle(diameter, fillStyle, strokeStyle, lineWidth, x, y) {
	var sprite = new Circle(diameter, fillStyle, strokeStyle, lineWidth, x, y);
	stage.addChild(sprite);
	return sprite;
}

function Ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth){
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.x = x || 0;
	this.y = y || 0;
	this.width = width;
	this.height = height;

	this.fillStyle = (typeof fillStyle !== 'undefined') ? fillStyle : "black";
	this.strokeStyle = (typeof strokeStyle !== 'undefined') ? strokeStyle : "none";
	this.lineWidth = (typeof lineWidth !== 'undefined') ? lineWidth : 0;

	//Add a `mask` property to enable optional masking
	this.mask = false;
}

Ellipse.prototype = new DisplayObject();
Ellipse.prototype.constructor=Ellipse;

Ellipse.prototype.render = function(ctx){
	ctx.strokeStyle = this.strokeStyle;
	ctx.lineWidth = this.lineWidth;
	ctx.fillStyle = this.fillStyle;

	ctx.beginPath();

	ctx.moveTo(this.x, this.y - this.height/2);
	ctx.bezierCurveTo(
		this.x + this.width/2, this.y - this.height/2,
		this.x + this.width/2, this.y + this.height/2,
		this.x, this.y + this.height/2
	);

	ctx.bezierCurveTo(
		this.x - this.width/2, this.y + this.height/2,
		this.x - this.width/2, this.y - this.height/2,
		this.x, this.y - this.height/2
	);

	if (this.strokeStyle !== "none") ctx.stroke();
	if (this.fillStyle !== "none") ctx.fill();
	if (this.mask && this.mask === true) ctx.clip();
}

//A higher level wrapper for the circle sprite
function ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth){
	var sprite = new Ellipse(x, y, width, height,fillStyle, strokeStyle, lineWidth);
	stage.addChild(sprite);
	return sprite;
}

function Line(strokeStyle,lineWidth,ax,ay,bx,by) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	//Assign the argument values to this sprite
	this.ax = (typeof ax !== 'undefined') ? ax : 0;
	this.ay = (typeof ay !== 'undefined') ? ay : 0;
	this.bx = (typeof bx !== 'undefined') ? bx : 32;
	this.by = (typeof by !== 'undefined') ? by : 32;

	this.strokeStyle = strokeStyle || "none";
	this.lineWidth = lineWidth || 0;

	//The `lineJoin` style.
	//Options are "round", "mitre" and "bevel".
	this.lineJoin = "round";

}
Line.prototype = new DisplayObject();
Line.prototype.constructor=Line;
//The `render` method
Line.prototype.render=function(ctx) {
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.lineJoin = this.lineJoin;
		ctx.beginPath();
		ctx.moveTo(this.ax, this.ay);
		ctx.lineTo(this.bx, this.by);
		if (this.strokeStyle !== "none") ctx.stroke();
};
//A higher-level wrapper for the line sprite
function line(strokeStyle, lineWidth, ax, ay, bx, by) {
	var sprite = new Line(strokeStyle, lineWidth, ax, ay, bx, by);
	stage.addChild(sprite);
	return sprite;
}

function Text(content,font,fillStyle,x,y) {
	//Call the DisplayObject's constructor
	DisplayObject.call(this);

	this.content = content || "Hello";
	this.font = font || "12px sans-serif";
	this.fillStyle = fillStyle || "red";
	this.x = x || 0;
	this.y = y || 0;

	//Set the default text baseline to "top"
	this.textBaseline = "top";

	//Set `strokeText` to "none"
	this.strokeText = "none";
}
Text.prototype = new DisplayObject();
Text.prototype.constructor = Text;
//The `render` method describes how to draw the sprite
Text.prototype.render = function(ctx) {
		ctx.font = this.font;
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;
		ctx.fillStyle = this.fillStyle;
		//Measure the width and height of the text
		if (this.width === 0) this.width = ctx.measureText(this.content).width;
		if (this.height === 0) this.height = ctx.measureText("M").width;
		ctx.translate(
			-this.width * this.pivotX,
			-this.height * this.pivotY
		);
		ctx.textBaseline = this.textBaseline;
		ctx.fillText(
			this.content,
			0,
			0
		);
		if (this.strokeText !== "none") ctx.strokeText();
};
//A higher level wrapper
function text(content, font, fillStyle, x, y) {
	var sprite = new Text(content, font, fillStyle, x, y);
	stage.addChild(sprite);
	return sprite;
}
