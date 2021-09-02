const gameDiv = document.querySelector(".game");
const linkPrefix = "/haunted-run";

const Game = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Game() {
    Phaser.Scene.call(this, "game");
  },

  init() {
    this.jumps = 0;
    this.speed = 3.2;
    this.movingRight = false;
    this.movingLeft = false;
    this.score = 0;
    this.health = 100;
    this.ghosts = [];
    this.ghostTime = 0;
    this.ghostSpeed = -1;
  },

  // load game assets
  preload() {
    this.load.image("background", "assets/Background_0.png");
    this.load.image("background2", "assets/Background_1.png");
    this.load.image("tiles", "assets/tiles.png");
    this.load.image("mid-tiles", "assets/mid-bg.png");
    this.load.tilemapTiledJSON("tilemap", "assets/graveyard.json");

    this.load.image("statue", "assets/statue.png");
    this.load.image("left", "assets/leftArrow.png");
    this.load.image("right", "assets/rightArrow.png");

    this.load.spritesheet(
      "witch",
      "assets/witch.png",
      {
        frameWidth: 26,
        frameHeight: 48,
      },
      0
    );
    this.load.spritesheet(
      "potion",
      "assets/potion-orange.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      },
      0
    );

    this.load.spritesheet(
      "ghost",
      "assets/ghost.png",
      {
        frameWidth: 39,
        frameHeight: 47,
      },
      0
    );
  },

  create() {
    const bg = this.add.image(400, 250, "background").setScrollFactor(0);
    const bg2 = this.add.image(400, 250, "background2").setScrollFactor(0.02);
    const bg3 = this.add.image(900, 250, "background2").setScrollFactor(0.02);
    bg.setDisplaySize(800, 500);
    bg2.setDisplaySize(800, 500);
    bg3.setDisplaySize(800, 500);

    const map = this.make.tilemap({ key: "tilemap" });
    const tileset1 = map.addTilesetImage("gravesheet", "tiles");
    const tileset2 = map.addTilesetImage("mid-bg", "mid-tiles");
    const midground = map.createLayer("midground", tileset2, 0, -500);
    const ground = map.createLayer("ground", tileset1);

    midground.setScrollFactor(0.3, 0.4);
    ground.setCollisionByProperty({ collides: true });

    this.cameras.main.setBounds(0, 0, 6400, 640);
    this.matter.world.setBounds(0, 0, 6400, 640);

    // health bar
    this.graphics = this.add.graphics().setScrollFactor(0);
    this.setHealth(this.health);

    // the score
    this.scoreText = this.add
      .text(20, 20, "score: 0", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setScrollFactor(0);

    // player animations for walking and idle
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("witch", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "idle",
      frames: [{ key: "witch", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "ghost",
      frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    const objectLayer = map.getObjectLayer("objects");

    // add objects to game
    objectLayer.objects.forEach((data) => {
      const { x = 0, y = 0, name } = data;

      switch (name) {
        case "start": {
          this.player = this.matter.add
            .sprite(x, y, "witch")
            .setScale(1.7)
            .setFixedRotation();

          this.player.setOnCollide((data) => {
            const gameObj = data.bodyB.gameObject;

            if (gameObj instanceof Phaser.Physics.Matter.TileBody) {
              this.jumps = 0;
            } else {
              const type = gameObj.getData("type");

              switch (type) {
                case "potion": {
                  this.collectPotion(gameObj);
                  break;
                }
                case "ghost": {
                  this.takeDamage();
                  break;
                }
                case "statue": {
                  // statue detects when player reacher finish
                  this.finish();
                  break;
                }
              }
            }
          });

          this.cameras.main.startFollow(this.player);

          break;
        }

        case "potion": {
          const potion = this.matter.add
            .sprite(x, y, "potion", 0, {
              isStatic: true,
              isSensor: true,
            })
            .setScale(1.5);

          potion.setData("type", "potion");

          break;
        }

        case "ghost": {
          const ghost = this.matter.add
            .sprite(x, y, "ghost", 0, {
              isSensor: true,
            })
            .setFixedRotation();

          ghost.setData("type", "ghost");
          ghost.play("ghost");
          ghost.body.ignoreGravity = true;

          this.ghosts.push(ghost);

          break;
        }

        case "statue": {
          const statue = this.matter.add
            .sprite(x, y, "statue", 0, {
              isStatic: true,
              isSensor: true,
            })
            .setFixedRotation();

          statue.setData("type", "statue");

          break;
        }
      }
    });

    this.leftBtn = this.add
      .image(50, 450, "left")
      .setScrollFactor(0)
      .setScale(0.7)
      .setInteractive()
      .on("pointerdown", () => (this.movingLeft = true))
      .on("pointerup", () => (this.movingLeft = false));

    this.rightBtn = this.add
      .image(175, 450, "right")
      .setScrollFactor(0)
      .setScale(0.7)
      .setInteractive()
      .on("pointerdown", () => (this.movingRight = true))
      .on("pointerup", () => (this.movingRight = false));

    this.jumpBtn = this.add
      .image(700, 450, "right")
      .setScrollFactor(0)
      .setScale(0.7)
      .setInteractive()
      .on("pointerdown", () => this.jump());

    this.jumpBtn.angle = -90;

    this.cursors = this.input.keyboard.createCursorKeys();

    this.matter.world.convertTilemapLayer(ground);
  },

  update() {
    // if player is alive allow controls
    if (this.health > 0) {
      if (this.cursors.left.isDown || this.movingLeft === true) {
        this.moveLeft();
      } else if (this.cursors.right.isDown || this.movingRight === true) {
        this.moveRight();
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play("idle");
      }

      const upJustPressed =
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space);

      if (upJustPressed) {
        this.jump();
      }
    }

    if (this.ghostTime > 3000) {
      this.ghostSpeed = -this.ghostSpeed;
      this.ghostTime = 0;
      for (let ghost of this.ghosts) {
        ghost.flipX = !ghost.flipX;
      }
    }

    for (let ghost of this.ghosts) {
      ghost.setVelocityX(this.ghostSpeed);
      this.ghostTime++;
    }
  },

  jump() {
    if (this.jumps < 1) {
      this.player.setVelocityY(-10);
      this.player.anims.play("idle");
      this.jumps++;
    }
  },

  moveRight() {
    this.player.setVelocityX(this.speed);
    this.player.flipX = false;
    this.player.play("run", true);
  },

  moveLeft() {
    this.player.setVelocityX(-this.speed);
    this.player.flipX = true;
    this.player.play("run", true);
  },

  collectPotion(potion) {
    potion.destroy(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText(`score: ${this.score}`);
  },

  takeDamage() {
    this.player.setTint(0xb700e0);
    setTimeout(() => {
      this.player.clearTint();
    }, 100);
    setTimeout(() => {
      this.player.setTint(0xb700e0);
    }, 200);
    setTimeout(() => {
      this.player.clearTint();
    }, 300);
    this.health -= 20;
    this.setHealth(this.health);
  },

  setHealth(value) {
    if (value <= 0) {
      this.die();
    }

    const width = 130;
    let fillPercent = (Phaser.Math.Clamp(value, 0, 100) / 100) * width;
    this.graphics.fillStyle(0x808080);
    this.graphics.fillRoundedRect(20, 60, width, 10, 3);
    this.graphics.fillStyle(0x00ff00);
    this.graphics.fillRoundedRect(20, 60, fillPercent, 10, 3);
  },

  die() {
    this.player.angle = -90;
    this.player.setVelocityY(-8);
    this.player.setOnCollide(() => {});
    this.player.anims.play("idle");

    setTimeout(() => {
      this.addText("Game Over");
    }, 1000);

    this.changeScene(3000);
  },

  finish() {
    this.addText("You Win!", 0, -50);
    this.addText(`Score: ${this.score}`, 0, 50, "48px");
    this.player.setOnCollide(() => {});
    this.changeScene(3000);
  },

  addText(text, xOffset = 0, yOffset = 0, fontSize = "72px") {
    const screenCenterX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY =
      this.cameras.main.worldView.y + this.cameras.main.height / 2;

    this.add
      .text(screenCenterX + xOffset, screenCenterY + yOffset, text, {
        fontSize: fontSize,
        fill: "#fff",
      })
      .setOrigin(0.5);
  },

  changeScene(delay) {
    setTimeout(() => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start("options");
        }
      );
    }, delay);
  },
});

const Options = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Options() {
    Phaser.Scene.call(this, "options");
  },

  preload() {
    this.load.image("background", "assets/Background_0.png");
  },

  create() {
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    const bg = this.add.image(400, 250, "background");
    bg.setDisplaySize(800, 500);

    this.add
      .text(this.cameras.main.centerX, 200, "Haunted Run", {
        fontSize: "72px",
        fill: "#fff",
      })
      .setOrigin(0.5);

    const startButton = this.add.text(this.cameras.main.centerX - 100, 300, 'Play', {
      fontSize: "48px",
      fill: "#fff",
    })
    .setOrigin(0.5)
    .setPadding(10)
    .setStyle({ backgroundColor: '#111' })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', this.start)
    .on('pointerover', () => startButton.setStyle({ fill: '#f39c12' }))
    .on('pointerout', () => startButton.setStyle({ fill: '#FFF' }));

    const quitButton = this.add.text(this.cameras.main.centerX + 100, 300, 'Quit', {
      fontSize: "48px",
      fill: "#fff",
    })
    .setOrigin(0.5)
    .setPadding(10)
    .setStyle({ backgroundColor: '#111' })
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', this.quit)
    .on('pointerover', () => quitButton.setStyle({ fill: '#f39c12' }))
    .on('pointerout', () => quitButton.setStyle({ fill: '#FFF' }));

    
  },

  start() {
    this.scene.start('game')
  },

  quit() {
    window.location.assign(linkPrefix + "/");
  }
});

const config = {
  type: Phaser.AUTO,
  // makes game responsive
  scale: {
    parent: gameDiv,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 500,
  },
  physics: {
    default: "matter",
    matter: {
      // debug: true,
    },
  },
  scene: [Options, Game],
  input :{
		activePointers:3,
	},
};

const game = new Phaser.Game(config);
