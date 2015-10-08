/*
tilingSprite
------------
*/
//function tilingSprite(spriteFunction, tileHeight, tileWidth, totalWidth, totalHeight) {
function tilingSprite(width, height, source, x, y) {

  var x= checkIfUndefined(x,0), y= checkIfUndefined(y,0);
  //Figure out the tile's width and height
  var tileWidth, tileHeight;

  //If the source is a texture atlas frame, use its
  //`frame.w` and `frame.h` properties
  if(source.frame) {
    tileWidth = source.frame.w;
    tileHeight = source.frame.h;
  }

  //If it's an image, use the image's
  //`width` and `height` properties
  else {
    tileWidth = source.width;
    tileHeight = source.height;
  }

	//done to hide the blank line appearing b/w the tiling sprites issue resolved
	tileWidth = tileWidth-1;
	tileHeight = tileHeight-1;

  //Figure out the rows and columns.
  //The number of rows and columns should always be
  //one greater than the total number of tiles
  //that can fit in the rectangle. This give us one
  //additional row and column that we can reposition
  //to create the infinite scroll effect

  var columns, rows;

  //1. Columns
  //If the width of the rectangle is greater than the width of the tile,
  //calculate the number of tile columns
  if (width >= tileWidth) {
    columns = Math.round(width / tileWidth) + 1;
  }

  //If the rectangle's width is less than the width of the
  //tile, set the columns to 2, which is the minimum
  else {
    columns = 2;
  }

  //2. Rows
  //Calculate the tile rows in the same way
  if (height >= tileHeight) {
    rows = Math.round(height / tileHeight) + 1;
  } else {
    rows = 2;
  }

  //Create a grid of sprites that's just one sprite larger
  //than the `totalWidth` and `totalHeight`
  var tileGrid = grid(
   columns, rows, tileWidth, tileHeight, true, 0, 0,
   function(){
     //Make a sprite from the supplied `source`
     var tile = sprite(source);
     return tile;
   }
  );

  //Declare the grid's private properties that we'll use to
  //help scroll the tiling background
  tileGrid._tileX = 0;
  tileGrid._tileY = 0;

  //Create an empty rectangle sprite without a fill or stoke color.
  //Set it to the supplied `width` and `height`
  var container = rectangle(width, height, "none", "none");
  container.x = x;
  container.y = y;

  //Set the rectangle's `mask` property to `true`. This switches on `ctx.clip()`
  //In the rectangle sprite's `render` method.
  container.mask = true;

  //Add the tile grid to the rectangle container
  container.addChild(tileGrid);

  //Define the `tileX` and `tileY` properties on the parent container
  //so that you can scroll the tiling background
  Object.defineProperties(container, {
    tileX: {
      get () {
        return tileGrid._tileX;
      },

      set (value) {

        //Loop through all of the grid's child sprites
        tileGrid.children.forEach(function(child){

          //Figure out the difference between the new position
          //and the previous position
          var difference = value - tileGrid._tileX;

          //Offset the child sprite by the difference
          child.x += difference;

          //If the x position of the sprite exceeds the total width
          //of the visible columns, reposition it to just in front of the
          //left edge of the container. This creates the wrapping
          //effect
          if (child.x > (columns - 1) * tileWidth) {
            child.x = 0 - tileWidth + difference;
          }

          //Use the same procedure to wrap sprites that
          //exceed the left boundary
          if (child.x < 0 - tileWidth - difference) {
            child.x = (columns - 1) * tileWidth;
          }
        });

        //Set the private `_tileX` property to the new value
        tileGrid._tileX = value;
      },
      enumerable: true, configurable: true
    },
    tileY: {
      get() {
        return tileGrid._tileY;
      },

      //Follow the same format to wrap sprites on the y axis
      set(value){
        tileGrid.children.forEach(function(child){
          var difference = value - tileGrid._tileY;
          child.y += difference;
          if (child.y > (rows - 1) * tileHeight) child.y = 0 - tileHeight + difference;
          if (child.y < 0 - tileHeight - difference) child.y = (rows - 1) * tileHeight;
        });
        tileGrid._tileY = value;
      },
      enumerable: true, configurable: true
    }
  });

  //Return the rectangle container
  return container;
}
