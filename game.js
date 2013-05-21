(function (window, $, undefined) {

	var canvasElement, canvas, CANVAS_WIDTH, CANVAS_HEIGHT;

	window.Game = {
		init: function (id) {
			canvasElement = document.getElementById(id);
			canvas = canvasElement.getContext('2d');
			CANVAS_WIDTH = canvasElement.width = $(window).width();
			CANVAS_HEIGHT = canvasElement.height = $(window).height();

			$(document).bind("mousedown", function() {
				player.shoot();
			});

			$(window).resize(function() {
				CANVAS_WIDTH = canvasElement.width = $(window).width();
				CANVAS_HEIGHT = canvasElement.height = $(window).height();			
			});
		}
	}


	var playerBullets = [];
	var enemies = [];
	var score = 0;

	var background = new Image(), 
		bgX = 0,
		bgY = 0,
		bgY2 = -CANVAS_WIDTH;

	background.src = 'images/starfield.jpg';
	var pattern;
	background.onload = function () {
		pattern = canvas.createPattern(background, 'repeat');
	}

	function Player(args) {
		this.config = $.extend({}, Player.defaults, args);
		this.x = this.config.x;
		this.y = this.config.y;
		this.sprite = Sprite(this.config.sprite);
		this.speed = 4;
		this.active = true;
	}
	Player.prototype = {
		draw: function () {
			this.sprite.draw(canvas, this.x, this.y);
		},
		explode: function () {
			this.active = false;
		},
		shoot: function () {
			playerBullets.push(
				new Bullet({
					speed: 6,
					radian: angleToTarget(),
					x: this.x,
					y: this.y
				})
			);
		},
		midpoint: function () {
			return {
				x: this.x + this.config.width / 2,
				y: this.y + this.config.height / 2
			};
		}
	}
	Player.defaults = {
		width: 32,
		height: 32,
		x: 220,
		y: 270,
		sprite: 'player'
	}

	var player = new Player();


	function Enemy(args) {
		this.config = $.extend({}, Enemy.defaults, args);

		this.active = true;
		this.age = Math.floor(Math.random() * 128);
		this.sprite = Sprite(this.config.sprite);
		this.x = CANVAS_WIDTH / 4 + Math.random() * CANVAS_WIDTH / 2;
		this.y = 0;
	}
	Enemy.prototype = {
		explode: function () {
			this.active = false;
		},
		inBounds: function () {
			return this.x >= 0 && this.x <= CANVAS_WIDTH && this.y >= 0 && this.y <= CANVAS_HEIGHT;
		},
		draw: function () {
			this.sprite.draw(canvas, this.x, this.y);
		},
		update: function () {
			this.x += this.config.xV;
			this.y += this.config.yV;
			this.config.xV = 3 * Math.sin(this.age * Math.PI / 64);
			this.age++;
			this.active = this.active && this.inBounds();
		}
	}
	Enemy.defaults = {
		width: 32,
		height: 32,
		xV: 0,
		yV: 2,
		sprite: 'enemy'
	}

	
	function Bullet(args) {
		this.config = $.extend({}, Bullet.defaults, args);

		this.active = true;
		this.xVelocity = this.config.speed * Math.cos(this.config.radian);
		this.yVelocity = this.config.speed * Math.sin(this.config.radian);
		this.x = this.config.x;
		this.y = this.config.y;
	}

	Bullet.prototype = {
		inBounds: function() {
			return this.x >= 0 && this.x <= CANVAS_WIDTH && this.y >= 0 && this.y <= CANVAS_HEIGHT;
		},
		draw: function() {
			canvas.fillStyle = this.config.color;
			canvas.fillRect(this.x, this.y, this.config.width, this.config.height);
		},
		update: function () {
			this.x += this.xVelocity;
			this.y += this.yVelocity;
			this.active = this.active && this.inBounds();
		}
	}

	Bullet.defaults = {
		speed: 6,
		width: 3,
		height: 3,
		color: '#FFFFFF'
	};


	/*===== Other Functions =====*/

	function handleCollisions() {
		playerBullets.forEach(function (bullet) {
			enemies.forEach(function (enemy) {
				if (collides(bullet, enemy)) {
					enemy.explode();
					bullet.active = false;
					score += 1;
				}
			});
		});

		enemies.forEach(function (enemy) {
			if (collides(enemy, player)) {
				enemy.explode();
				player.explode();
			}
		});
	}


	function drawBackground() {
		(function (c) {
			c.fillStyle = pattern;
			c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			c.fillStyle = 'white';
			c.font = '80pt Arial';
			c.textAlign = 'right';
			c.fillText(score, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 30);
		})(canvas);
	}


	/*===== Physics =====*/

	function collides(a, b) {
		return a.x < b.x + b.config.width && a.x + a.config.width > b.x && a.y < b.y + b.config.height && a.y + a.config.height > b.y;
	}

	function angleToTarget() {
		var origin = player.midpoint();
		var mouseX = event.clientX;
		var mouseY = event.clientY;

		return Math.atan2(mouseY - origin.y, mouseX - origin.x);
	}


	/*===== Game Loop =====*/
	var FPS = 30;
	var gameOver = setInterval(function() {
		update();
		draw();
	}, 1000 / FPS);


	function update() {
		var _player = player;
		if (!_player.active) {
			clearInterval(gameOver);
		} else {
			var _key = keydown;
			var diagHandicap = 1.55;

	        if (_key.left  &&  _key.up)                  _player.x -= _player.speed / diagHandicap; 
			if (_key.left  &&  _key.down)                _player.x -= _player.speed / diagHandicap; 
			if (_key.left  && !_key.up   && !_key.down)  _player.x -= _player.speed; 
			if (_key.up    &&  _key.left)                _player.y -= _player.speed / diagHandicap; 
			if (_key.up    &&  _key.right)               _player.y -= _player.speed / diagHandicap; 
			if (_key.up    && !_key.left && !_key.right) _player.y -= _player.speed; 
			if (_key.right &&  _key.up)                  _player.x += _player.speed / diagHandicap; 
			if (_key.right &&  _key.down)                _player.x += _player.speed / diagHandicap; 
			if (_key.right && !_key.up   && !_key.down)  _player.x += _player.speed; 
			if (_key.down  &&  _key.left)                _player.y += _player.speed / diagHandicap; 
			if (_key.down  &&  _key.right)               _player.y += _player.speed / diagHandicap; 
			if (_key.down  && !_key.left && !_key.right) _player.y += _player.speed; 

			_player.x = _player.x.clamp(0, CANVAS_WIDTH - _player.config.width);
			_player.y = _player.y.clamp(0, CANVAS_HEIGHT - _player.config.height);

			playerBullets.forEach(function(bullet) {
				bullet.update();
			});

			playerBullets = playerBullets.filter(function(bullet) {
				return bullet.active;
			});

			enemies.forEach(function(enemy) {
				enemy.update();
			});

			enemies = enemies.filter(function(enemy) {
				return enemy.active;
			});

			if (Math.random() < 0.05) {
				enemies.push(new Enemy());
			}

			handleCollisions();
		}
	}

	function draw() {
		canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		drawBackground();
		playerBullets.forEach(function (bullet) {
			bullet.draw();
		});
		player.draw();
		enemies.forEach(function (enemy) {
			enemy.draw();
		});

		if (!player.active) {
			canvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			drawBackground();
			canvas.fillStyle = 'white';
			canvas.textAlign = 'center';
			canvas.fillText("dead", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
		}
	}

})(window, jQuery);