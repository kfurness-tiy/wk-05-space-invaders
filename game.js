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
      }; //update property continues down below

      // somehow gets rid of invaders that are hit with laser (or player that is hit)
      this.bodies = this.bodies.filter(notCollidingWithAnything);

      // run to update?
      for (var i = 0; i < this.bodies.length; i++) {
        this.bodies[i].update();
      }
    }, //ends update property
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
      //This deals with movement
      if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
        this.center.x -= 2;
      } else if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
          this.center.x += 2;
        }
      //This deals with shooting bullets
      if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
        // Create bullets for player to use
        var bullet = new Bullet({ x:this.center.x, y: this.center.y - this.size.x * 2 },
          { x: 0, y: -6 });
        // Function listed in Game.prototype. It pushes bullets created to the array of "bodies"
        this.game.addBody(bullet);
        //Makes the sound work. play is a method, but I do not know about load...?
        this.game.shootSound.load();
        this.game.shootSound.play();
      }
    }
  };
//////////////////////  Invaders   /////////////////////
// Function to create invader, called for in createInvaders function
var Invader = function(game, center) {
  this.game = game;
  this.size = { x: 15, y: 15};
  this.center= center;
  this.patrolX = 0;
  this.speedX = 0.3;
};

// With each tick, createInvaders will be called which will link back to the Invader update which will tell us where the invader is for every tick
Invader.prototype = {
    update: function() {
      //movement of invader clump
      if(this.patrolX < 0 || this.patrolX > 40) {
        this.speedX = -this.speedX;
      }
      this.center.x += this.speedX;
      this.patrolX += this.speedX;

      // Invaders shooting bullets
      if ( Math.random() > 0.995 && !this.game.invadersBelow(this) ) {
        var bullet = new Bullet({ x:this.center.x, y: this.center.y + this.size.x * 2 },
          { x: Math.random() - 0.5, y: 2 });
        this.game.addBody(bullet);
      }
    }
  };
  //function to create 24 invaders
  var createInvaders = function(game) {
    var invaders = [];
    for (var i = 0; i < 24; i++) {
      var x = 30 + (i % 8) * 30;
      var y = 30 + (i % 3) * 30;
      // Do not understand how we are pushing a function in an array?
      invaders.push(new Invader(game, {x: x, y: y }));
    }
    return invaders;
  };
/////////////////////  Bullet  ////////////////////////
  // function to make bullets, called in Player & Invader prototypes since bullets are made specifically for them
  var Bullet = function(center, velocity) {
    this.size = { x: 3, y: 3};
    this.center= center;
    //Do not understand what velocity does
    this.velocity = velocity;
  };

  Bullet.prototype = {
    // Will be updated with Player & Invaders with ticks since it will be pushed into AddBody, which pushes the object to the array of objects (this.bodies)
    update: function() {
      this.center.x += this.velocity.x;
      this.center.y += this.velocity.y;
    }
  };

///////////////////// drawRect  ////////////////////////
  //draws a rectangle in canvas of body
  //Called for in Game Prototype draw property
  var drawRect = function (screen, body) {
    screen.fillRect(body.center.x - body.size.x / 2,
                    body.center.y - body.size.y / 2,
                    body.size.x, body.size.y)
  };

//////////////////  Keyboard input  //////////////////
  //Tracks keyboard strokes
  var Keyboarder = function() {
    var keyState = {};
    // I don't understand why we need to track when the key is down or up...? Where is keyCode coming from?
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode I'm seeing keyCode as being depracated?
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

    // Do not undestand what these are for?
    // https://css-tricks.com/snippets/javascript/javascript-keycodes/
    this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32};
  };


//////////////////////  Coliding  ////////////////////
  var colliding = function (b1, b2) {
  //if any of these are true, they are NOT colliding. If one is true then they are. Called for in Game prototype
    return !(b1 === b2 ||  //same body, not colliding
        //checking each side- if sides not touching, they are not colliding
            b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
            b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
            b1.center.x - b1.size.x / 2 > b2.center.x - b2.size.x / 2 ||
            b1.center.y - b1.size.y / 2 > b2.center.y - b2.size.y / 2 );
  }

///////////////////// Load Sound Function ////////////////
  // Create function called loadSound, Called for in Game function, instigates a lot of the game, including updates
  var loadSound = function(url, callback) {
    // Makes it so sound reloads and does not play over and over again
    var loaded = function() {
      callback(sound);
      sound.removeEventListener('canplaythrough', loaded);
    };

  var sound = new Audio(url);
  sound.addEventListener('canplaythrough', loaded);
  sound.load();
};


//// Call Game function and get everything going. "screen" will reverence the canvas in HTML
//bind an onload cb that will start the game once loaded
  window.onload = function() {
    new Game("screen");
  };
})();
