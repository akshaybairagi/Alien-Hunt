//Global Array to hold Audio objects
var soundObjects = [];
function soundPool(numOfAudioInstance){
  for(var i=0;i<numOfAudioInstance;i++){
    var obj = new Audio();
    obj.playing = false;
    obj.addEventListener("ended", function() {
          if(!obj.loop){
    			  obj.playing = false;
            obj.src = "";
            obj.loop = false;
            soundObjects.push(obj);
          }
  			},true);
    soundObjects.push(obj);
  }
}

function Sound(source,loadHandler){
  //Assign the `source` and `loadHandler` values to this object
  this.source = source;
  this.loadHandler = loadHandler;
  this.buffer = null;
  this.sound = undefined;
  this.volume = 1;
  this.autoplay = false;
  this.loop = false;
  this.soundObjects = soundObjects;

  this.load();
}
Sound.prototype.load = function(){
  var _this = this;
  //Use xhr to load the sound file
  var xhr = new XMLHttpRequest();
  xhr.open("GET", this.source, true);
  xhr.responseType = "arraybuffer";
  xhr.addEventListener("load", function(){
      //  _this.buffer = xhr.response;
        _this.hasLoaded = true;

        if (_this.loadHandler) {
          _this.loadHandler();
        }
  });
  xhr.addEventListener("error", function(error){
    console.log("Error in loading");
  });
  //Send the request to load the file
  xhr.send();
};
Sound.prototype.play = function(){
  if(soundObjects.length>0){
    this.sound = this.soundObjects.pop();
  }
  else {
    this.sound = new Audio();
  }
  this.sound.src = this.source;
  this.sound.volume = this.volume;
  this.sound.loop = this.loop;
  this.sound.playing = true;
  this.sound.play();
};
Sound.prototype.stop = function(){
  this.sound.playing = false;
  this.sound.pause();
};
function makeSound(source, loadHandler) {
	return new Sound(source, loadHandler);
}
