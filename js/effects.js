function smokeEmitter(x,y,source){
	particleEffect(
		x, //The particle's starting x position
		y, //The particle's starting y position
		function () { return sprite(source); },
		5, //Number of particles
		0, //Gravity
		true, //Random spacing
		2.4, 3.6, //Min/max angle
		1, 10, //Min/max size
		0.1, 2, //Min/max speed
		0.005, 0.01, //Min/max scale speed
		0.005, 0.01, //Min/max alpha speed
		0, 0 //Min/max rotation speed
	);
}
function fire(shooter){
	bullets.getBullet(shooter,0,contr.bulletSpeed);
	shotSound.play();
}
function Bullet(){
	//bullet Pool and active Pool
	this.bulletPool = [];
	this.activeBullets=[];

	this.createBullet = function(){
		//Make a new sprite using the user-supplied 'bulletSprite' function
		var bullet = 	rectangle(15,4, "black");
		var cBox = rectangle(60,2,"red","red",1)
		bullet.addChild(cBox);
		bullet.cBox = cBox;
		cBox.visible = false;
		gameScene.addChild(bullet);
		return bullet;
	};

	this.getBullet = function(shooter,offsetFromCenter,bulletSpeed){
		var bullet = null;
		if(this.bulletPool.length > 0){
			bullet = this.bulletPool.pop();
		}
		else{
			bullet = this.createBullet();
		}
		bullet.rotation = shooter.rotation;
		//Set the bullet's start point
		bullet.x= (shooter.gx + shooter.width) - bullet.halfWidth + (offsetFromCenter * Math.cos(shooter.rotation));
		bullet.y= shooter.gy  - bullet.halfHeight + (offsetFromCenter * Math.sin(shooter.rotation));
		//Set the bullet's velocity
		bullet.vx = Math.cos(shooter.rotation) * bulletSpeed;
		bullet.vy = Math.sin(shooter.rotation) * bulletSpeed;
		bullet.visible = true;
		this.activeBullets.push(bullet);
	};

	this.freeBullet = function(bullet){
		bullet.visible = false;
		this.activeBullets.splice(this.activeBullets.indexOf(bullet), 1);
		// return the bullet back into the pool
		this.bulletPool.push(bullet);
	};
}
function toggleMenu(caller,callee){
	if(caller !== undefined){
		caller.visible = false;
		caller.children.forEach(function(scene){
			if(scene.release){
				scene.interactive = false;
				scene.state ="up";
			}
		});
	}
	if(callee !== undefined){
		callee.visible = true;
		callee.children.forEach(function(scene){
			if(scene.release){
				scene.interactive = true;
			}
		});
	}
}


function aliendBoxCol(r1, r2, bounce, global) {

  var collision, combinedHalfWidths, combinedHalfHeights,
    overlapX, overlapY, vx, vy;

  var global = global || false,
  bounce =bounce || false;

  //Calculate the distance vector
  if (global) {
    vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
    vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
  } else {
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;
  }

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check whether vx is less than the combined half widths
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring!
    //Check whether vy is less than the combined half heights
    if (Math.abs(vy) < combinedHalfHeights) {

      //A collision has occurred! This is good!
      //Find out the size of the overlap on both the X and Y axes
      overlapX = combinedHalfWidths - Math.abs(vx);
      overlapY = combinedHalfHeights - Math.abs(vy);

      //The collision has occurred on the axis with the
      //*smallest* amount of overlap. Let's figure out which
      //axis that is

      if (overlapX >= overlapY) {
        //The collision is happening on the X axis
        //But on which side? vy can tell us

        if (vy > 0) {
          collision = "top";
        } else {
          collision = "bottom";
        }

        //Bounce
        if (bounce) {
          r1.vy *= -1;
        }
      } else {
        //The collision is happening on the Y axis
        //But on which side? vx can tell us

        if (vx > 0) {
          collision = "left";
        } else {
          collision = "right";
        }

        //Bounce
        if (bounce) {
          r1.vx *= -1;
        }
      }
    } else {
      //No collision
    }
  } else {
    //No collision
  }

  //Return the collision string. it will be either "top", "right",
  //"bottom", or "left" depending on which side of r1 is touching r2.
  return collision;
}
