;(function() {
  //  Hold all main game code
  var Game = function(canvasId) {
    //  Get canvas element; canvasId is assigned on window.onload at bottom
    var canvas = document.getElementById(canvasId);
    // getContext('2d') used to draw text, lines, etc on the canvas
    var screen = canvas.getContext('2d');
    // Save dimensions so you can use them to place player, invaders and lasers
    var gameSize = { x: canvas.width, y: canvas.height };

    //creates an array (I think) of invaders and players
    this.bodies = createInvaders(this).concat(new Player(this, gameSize));

    var self = this;
    //calling function loadSound (at bottom) with callback included here
    loadSound("./sounds/laser.wav", function(shootSound) {
      self.shootSound = shootSound;
      var tick = function() {
        // Update game (from Game.prototype)
        self.update();
        // "Draw" invaders, player & lasers (Don't quite understand this)
        self.draw(screen, gameSize);
        //browser runs this and aims for 60 times a second
        requestAnimationFrame(tick);
      };

      tick();
    });
  };


  Game.prototype = {
    //running main game logic
    update: function() {
      var bodies = this.bodies;
      //somehow calling colliding function (at bottom), and if the length of the return is 0, theny they are NOT colliding.
      var notCollidingWithAnything = function (b1) {
        return bodies.filter(function(b2) {return colliding(b1, b2); }).length === 0;
      };

      // somehow gets rid of invaders that are hit with laser (or player that is hit)
      this.bodies = this.bodies.filter(notCollidingWithAnything);

      // run to update?
      for (var i = 0; i < this.bodies.length; i++) {
        this.bodies[i].update();
      }
    },
    // Function for how to draw invaders, player, lasers
    // Goes through array of bodies to create each one
    draw: function(screen, gameSize) {
      screen.clearRect(0, 0, gameSize.x, gameSize.y);
      for (var i = 0; i < this.bodies.length; i++) {
        drawRect(screen, this.bodies[i]);
      }
    },

    // create function to add body to array, used in invaders and players prototype
    addBody: function(body) {
      this.bodies.push(body);
    },

    // Check to see where invaders are in relation to each other... Don't quite understand how this works.
    invadersBelow: function(invader) {
      return this.bodies.filter(function(b) {
        return b instanceof Invader &&
          b.center.y > invader.center.y &&
          b.center.x - invader.center.x < invader.size.x;
      }).length > 0;
    }
  };
///////////////////////  Player  ///////////////////////
  // Function to make a player and control it
  // Is called on line 12, and will constantly update
  var Player = function(game, gameSize) {
    this.game = game;
    this.size = { x: 15, y: 15};
    this.center= { x: gameSize.x / 2, y: gameSize.y - this.size.x};
    this.keyboarder = new Keyboarder();
  };

  Player.prototype = {
    // each tick() updates player. Load sound instigates defining the function tick. The this/self in tick, will refer to the Game prototype in which this.bodies is defined and linked to the array of bodies, which will then look at the individual bodies update?
    update: function() {
      if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        this.center.x -= 2;
      } else if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
          this.center.x += 2;
        }

      if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
        var bullet = new Bullet({ x:this.center.x, y: this.center.y - this.size.x * 2 },
          { x: 0, y: -6 });
        this.game.addBody(bullet);
        this.game.shootSound.load();
        this.game.shootSound.play();
      }
    }
  };
//////////////////////  Invaders   /////////////////////
var Invader = function(game, center) {
  this.game = game;
  this.size = { x: 15, y: 15};
  this.center= center;
  this.patrolX = 0;
  this.speedX = 0.3;
};

Invader.prototype = {
    update: function() {
      if(this.patrolX < 0 || this.patrolX > 40) {
        this.speedX = -this.speedX;
      }
      this.center.x += this.speedX;
      this.patrolX += this.speedX;

      if ( Math.random() > 0.995 && !this.game.invadersBelow(this) ) {
        var bullet = new Bullet({ x:this.center.x, y: this.center.y + this.size.x * 2 },
          { x: Math.random() - 0.5, y: 2 });
        this.game.addBody(bullet);
      }
    }
  };
//24 invaders
  var createInvaders = function(game) {
    var invaders = [];
    for (var i = 0; i < 24; i++) {
      var x = 30 + (i % 8) * 30;
      var y = 30 + (i % 3) * 30;
      invaders.push(new Invader(game, {x: x, y: y }));
    }
    return invaders;
  };
/////////////////////  Bullet  ////////////////////////
  var Bullet = function(center, velocity) {
    this.size = { x: 3, y: 3};
    this.center= center;
    this.velocity = velocity;
  };

  Bullet.prototype = {
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    }
  };

  var drawRect = function (screen, body) {
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x, body.size.y)
  };

//////////////////  Keyboard input  //////////////////
var Keyboarder = function() {
  var keyState = {};

  window.onkeydown = function(e) {
    keyState[e.keyCode] = true;
  };

  window.onkeyup = function(e) {
    keyState[e.keyCode] = false;
  };
//function to determine if keycode is down
  this.isDown = function(keyCode) {
    return keyState[keyCode] === true;
  };

  this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32};
};

var colliding = function (b1, b2) {
//if any of these are true, they are NOT colliding. If one is true then they are.
  return !(b1 === b2 ||  //same body, not colliding
      //checking each side- if sides not touching, they are not colliding
          b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
          b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
          b1.center.x - b1.size.x / 2 > b2.center.x - b2.size.x / 2 ||
          b1.center.y - b1.size.y / 2 > b2.center.y - b2.size.y / 2 );
}

var loadSound = function(url, callback) {
  var loaded = function() {
    callback(sound);
    sound.removeEventListener('canplaythrough', loaded);
  };

  var sound = new Audio(url);
  sound.addEventListener('canplaythrough', loaded);
  sound.load();
};

//bind an onload cb that will start the game once loaded
  window.onload = function() {
    new Game("screen");
  };
})();
