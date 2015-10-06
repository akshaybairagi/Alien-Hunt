var assets = {
    //Properties to help track the assets being loaded
    toLoad: 0,
    loaded: 0,

    //File extensions for different types of assets
    imageExtensions: ["png", "jpg", "gif"],
    fontExtensions: ["ttf", "otf", "ttc", "woff"],
    jsonExtensions: ["json"],
    audioExtensions: ["mp3", "ogg", "wav", "webm"],

    //The `load` method creates and loads all the assets. Use it like this:
    //`assets.load(["images/anyImage.png", "fonts/anyFont.otf"]);`
    load: function (sources,startFunction) {
		
		var _this = this;
		
        var loadHandler = function () {
            _this.loaded += 1;
			
			console.log(assets.loaded);
            //Check whether everything has loaded
            if (_this.toLoad === _this.loaded) {
                //Reset `toLoad` and `loaded` to `0` so you can use them
                //to load more assets later if you need to
                _this.toLoad = 0;
                _this.loaded = 0;

                console.log("Assets finished loading");
				//call the setup function to start the game execution
				if (startFunction)	{
					startFunction();
				}
            }
        };

        //Display a console message to confirm that the assets are being loaded
        console.log("Loading assets...");
        //Find the number of files that need to be loaded
        this.toLoad = sources.length;
		
        sources.forEach(function (source) {
            //Find the file extension of the asset
            var extension = source.split(".").pop();
			//Load fonts
            if (this.fontExtensions.indexOf(extension) !== -1) {
                this.loadFont(source, loadHandler);
            }
            //Load images that have file extensions that match the imageExtensions array
            else if (this.imageExtensions.indexOf(extension) !== -1) {
                this.loadImage(source, loadHandler);
            }        
                //Load JSON files
            else if (this.jsonExtensions.indexOf(extension) !== -1) {
                this.loadJson(source, loadHandler,this);
            }
                //Load audio files
            else if (this.audioExtensions.indexOf(extension) !== -1) {
                this.loadSound(source, loadHandler);
            }
			else if (this.audioExtensions.indexOf(extension) !== -1) {
				this.loadSound(source, loadHandler);
			}
                //Display a message if a file type isn't recognized
            else {
                console.log("File type not recognized: " + source);
            }
        },this);
    },

    loadImage: function (source, loadHandler) {
        //Create a new image and call the `loadHandler` when the image
        //file has loaded
        var image = new Image();
        image.addEventListener("load", loadHandler, false);
        //Assign the image as a property of the `assets` object so
        //you can access it like this: `assets["path/imageName.png"]`
        this[source] = image;
        //Alternatively, if you only want the file name without the full
        //path, you can get it like this:
        //image.name = source.split("/").pop();
        //this[image.name] = image;
        //This will allow you to access the image like this:
        //assets["imageName.png"];

        //Set the image's `src` property to start loading the image
        image.src = source;
    },
	loadFont: function(source, loadHandler) {
		//Use the font's filename as the `fontFamily` name. This code captures
		//the font file's name without the extension or file path
		var fontFamily = source.split("/").pop().split(".")[0];
		//Append an `@afont-face` style rule to the head of the HTML document
		var newStyle = document.createElement("style");
		var fontFace = "@font-face {font-family: '" + fontFamily + "'; src: url('" + source + "');}";
		newStyle.appendChild(document.createTextNode(fontFace));
		document.head.appendChild(newStyle);
		//Tell the loadHandler we're loading a font
		// Trick from http://stackoverflow.com/questions/2635814/
		var image = new Image;
		image.src = source;
		image.onerror = function() {
			console.log(source);
			loadHandler();
		};
		//loadHandler();
	},

    loadJson: function (source, loadHandler,_this) {
        //Create a new `xhr` object and an object to store the file
        var xhr = new XMLHttpRequest();
        //Use xhr to load the JSON file
        xhr.open("GET", source, true);
        //Tell xhr that it's a text file
        xhr.responseType = "text";
        //Create an `onload` callback function that
        //will handle the file loading
        xhr.onload = function (event) {
            //Check to make sure the file has loaded properly
            if (xhr.status === 200) {
                //Convert the JSON data file into an ordinary object
                var file = JSON.parse(xhr.responseText);
                //Get the filename
                file.name = source;
                //Assign the file as a property of the assets object so
                //you can access it like this: `assets["file.json"]`
                _this[file.name] = file;
                //Texture atlas support:
                //If the JSON file has a `frames` property then
                //it's in Texture Packer format
                if (file.frames) {
                    //Create the tileset frames
                    _this.createTilesetFrames(file, source, loadHandler,_this);
                } else {
                    //Alert the load handler that the file has loaded
                    loadHandler();
                }
            }
        };
        //Send the request to load the file
        xhr.send();
    },

    createTilesetFrames: function (file, source, loadHandler,_this) {
        //Get the tileset image's file path
        var baseUrl = source.replace(/[^\/]*$/, "");
        //Use the `baseUrl` and `image` name property from the JSON
        //file's `meta` object to construct the full image source path
        var imageSource = baseUrl + file.meta.image;
        //The image's load handler
        function imageLoadHandler() {
            //Assign the image as a property of the `assets` object so
            //you can access it like this:
            //`assets["images/imageName.png"]`
            _this[imageSource] = image;
            //Loop through all the frames
            Object.keys(file.frames).forEach(function (frame) {//(frame => {
                //The `frame` object contains all the size and position
                //data for each sub-image.
                //Add the frame data to the asset object so that you
                //can access it later like this: `assets["frameName.png"]`
                _this[frame] = file.frames[frame];
                //Get a reference to the source so that it will be easy for
                //us to access it later
                _this[frame].source = image;
            });
            //Alert the load handler that the file has loaded
            loadHandler();
        };
		
        //Load the tileset image
        var image = new Image();
        image.addEventListener("load", imageLoadHandler, false);
        image.src = imageSource;
    },

    loadSound: function (source, loadHandler) {
        //Create a sound object and alert the `loadHandler`
		//when the sound file has loaded
		var sound = makeSound(source, loadHandler);
		//Get the sound file name
		sound.name = source;
		//Assign the sound as a property of the assets object so
		//we can access it this way: `assets["sounds/sound.mp3"]`
		this[sound.name] = sound;
    },
};

function distance(s1, s2) {
	var vx = s2.centerX - s1.centerX,
		vy = s2.centerY - s1.centerY;
	return Math.sqrt(vx * vx + vy * vy);
}

function followEase(follower, leader, speed) {
	//Figure out the distance between the sprites
	var vx = leader.centerX - follower.centerX,
		vy = leader.centerY - follower.centerY,
	distance = Math.sqrt(vx * vx + vy * vy);
	//Move the follower if it's more than 1 pixel
	//away from the leader
	if (distance >= 1) {
		follower.x += vx * speed;
		follower.y += vy * speed;
	}
}

function followConstant(follower, leader, speed) {
	//Figure out the distance between the sprites
	var vx = leader.centerX - follower.centerX,
	vy = leader.centerY - follower.centerY,
	distance = Math.sqrt(vx * vx + vy * vy);
	//Move the follower if it's more than 1 move
	//away from the leader
	if (distance >= speed) {
		follower.x += (vx / distance) * speed;
		follower.y += (vy / distance) * speed;
	}
}

function angle(s1, s2) {
	return Math.atan2(
		s2.centerY - s1.centerY,
		s2.centerX - s1.centerX
	);
}

function rotateSprite(rotatingSprite, centerSprite, distance, angle) {
	rotatingSprite.x
	= centerSprite.centerX - rotatingSprite.parent.x
	+ (distance * Math.cos(angle))
	- rotatingSprite.halfWidth;
	rotatingSprite.y
	= centerSprite.centerY - rotatingSprite.parent.y
	+ (distance * Math.sin(angle))
	- rotatingSprite.halfWidth;
}

function rotatePoint(pointX, pointY, distanceX, distanceY, angle) {
	var point = {};
	point.x = pointX + Math.cos(angle) * distanceX;
	point.y = pointY + Math.sin(angle) * distanceY;
	return point;
}

function shoot(
	shooter, angle, offsetFromCenter,
	bulletSpeed, bulletArray, bulletSprite
) {
	//Make a new sprite using the user-supplied `bulletSprite` function
	var bullet = bulletSprite();
	bullet.rotation = shooter.rotation;
	//Set the bullet's start point
	bullet.x= shooter.centerX - bullet.halfWidth + (offsetFromCenter * Math.cos(angle));
	bullet.y= shooter.centerY - bullet.halfHeight + (offsetFromCenter * Math.sin(angle));
	//Set the bullet's velocity
	bullet.vx = Math.cos(angle) * bulletSpeed;
	bullet.vy = Math.sin(angle) * bulletSpeed;
	//Push the bullet into the `bulletArray`
	bulletArray.push(bullet);
}

function outsideBounds(sprite, bounds, extra){
	var x = bounds.x,
	y = bounds.y,
	width = bounds.width,
	height = bounds.height;
	
	//var extra = (typeof extra !== 'undefined') ? extra : 'undefined'
	//The `collision` object is used to store which
	//side of the containing rectangle the sprite hits
	var collision;
	//Left
	if (sprite.x < x - sprite.width) {
		collision = "left";
	}
	//Top
	if (sprite.y < y - sprite.height) {
		collision = "top";
	}
	//Right
	if (sprite.x > width) {
		collision = "right";
	}
	//Bottom
	if (sprite.y > height) {
		collision = "bottom";
	}
	//The `extra` function runs if there was a collision
	//and `extra` has been defined
	if (collision && extra) extra(collision);
		//Return the `collision` object
		return collision;
};

function checkIfUndefined(varToCheck,defaultValue){
	return ( typeof varToCheck !== 'undefined')? varToCheck : defaultValue;
}


/*
Move
----

Move a sprite by adding it's velocity to it's position

    move(sprite);
*/

function move(sprites) {
  if (sprites.length === 1) {
    var s = sprites[0];
    s.x += s.vx;
    s.y += s.vy;
  }
  else {
    for (var i = 0; i < sprites.length; i++) {
      var s = sprites[i];
      s.x += s.vx;
      s.y += s.vy;
    }
  }
}