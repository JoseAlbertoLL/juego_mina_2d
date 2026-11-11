import { Scene } from 'phaser';
import * as Phaser from 'phaser';

const WIDTH = 960;
const HEIGHT = 540;
const PLAYER_X = 220;
const INITIAL_GROUND_Y = 450;

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.playerName = (data.playerName || 'Minero').slice(0, 24);
    }

    create() {
        this.cameras.main.setBackgroundColor('#131820');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        this.elapsed = 0;
        this.lives = 3;
        this.birdsDefeated = 0;
        this.ammoMax = 5;
        this.ammo = this.ammoMax;
        this.speed = 210;
        this.invulnerableUntil = 0;
        this.isGameOver = false;
        this.platforms = [];
        this.platformGroup = null;
        this.birds = [];
        this.bullets = [];
        this.reloadTimer = null;
        this.reloadAt = null;
        this.weaponAngle = 0;
        this.muzzleUntil = 0;
        this.birdGroup = this.physics.add.group();
        this.bulletGroup = this.physics.add.group();
        this.wheelRotation = 0;

        this.drawCave();
        this.createPlatform(-120, 1200, INITIAL_GROUND_Y);
        this.createPlayer();
        this.createHud();
        this.createControls();
        this.createInputs();

        this.birdTimer = this.time.addEvent({
            delay: 2500,
            callback: this.spawnBird,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(this.bulletGroup, this.birdGroup, this.hitBird, undefined, this);
        this.physics.add.overlap(this.player, this.birdGroup, this.hitPlayer, undefined, this);
        this.events.once('shutdown', this.shutdownGame, this);
    }

    createPlayer() {
        this.player = this.add.rectangle(PLAYER_X, INITIAL_GROUND_Y - 25, 82, 50, 0xffffff, 0);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setGravityY(1450);
        this.player.body.setMaxVelocity(1000, 950);

        this.cartGraphics = this.add.graphics().setDepth(5);
        this.minerGraphics = this.add.graphics().setDepth(6);
        this.physics.add.collider(this.player, this.platformGroup);
    }

    createPlatform(x, width, topY) {
        if (!this.platformGroup) {
            this.platformGroup = this.physics.add.staticGroup();
        }
        const segmentWidth = 28;
        const segmentCount = Math.ceil(width / segmentWidth);
        const segments = [];
        const startY = this.platforms.length
            ? this.platforms[this.platforms.length - 1].endY
            : topY;
        for (let index = 0; index < segmentCount; index++) {
            const segmentX = x + index * segmentWidth;
            const actualWidth = Math.min(segmentWidth + 2, width - index * segmentWidth);
            const interpolation = segmentCount <= 1 ? 1 : index / (segmentCount - 1);
            const segmentTopY = Phaser.Math.Linear(startY, topY, interpolation);
            const segmentHeight = HEIGHT - segmentTopY + 45;
            const ground = this.add.rectangle(
                segmentX + actualWidth / 2,
                segmentTopY + segmentHeight / 2,
                actualWidth,
                segmentHeight,
                0x44332f
            );
            this.physics.add.existing(ground, true);
            this.platformGroup.add(ground);
            segments.push(ground);
        }
        this.platforms.push({ x, width, topY: startY, endY: topY, segments });
    }

    createHud() {
        this.hudPanel = this.add.graphics().setDepth(20);
        this.hudPanel.fillStyle(0x181711, 0.9);
        this.hudPanel.fillRoundedRect(20, 18, 445, 76, 16);
        this.hudPanel.lineStyle(1, 0xa2844f, 0.75);
        this.hudPanel.strokeRoundedRect(20, 18, 445, 76, 16);

        this.nameText = this.add.text(40, 28, this.playerName.toUpperCase(), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#91a5b2',
            letterSpacing: 2
        }).setDepth(21);
        this.statsText = this.add.text(40, 51, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#fff2d6'
        }).setDepth(21);

        this.add.text(490, 28, 'DUSTY', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#e5c27d',
            letterSpacing: 1
        }).setOrigin(0.5).setDepth(21);
        this.updateHud();
    }

    createControls() {
        this.add.text(76, 477, 'SALTAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#cad2d8'
        }).setOrigin(0.5).setDepth(20);
        this.add.text(882, 477, 'DISPARAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#cad2d8'
        }).setOrigin(0.5).setDepth(20);

        this.jumpButton = this.makeActionButton(76, 435, '↑', () => this.jump());
        this.fireButton = this.makeActionButton(882, 435, '●', () => this.shoot(850, this.player.y));
        this.ammoText = this.add.text(882, 361, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#f1d48b'
        }).setOrigin(0.5).setDepth(21);
        this.ammoGraphics = this.add.graphics().setDepth(21);

        this.pauseButton = this.add.circle(914, 46, 22, 0x202a33, 0.95)
            .setStrokeStyle(1, 0x8795a0, 0.8)
            .setInteractive({ useHandCursor: true })
            .setDepth(22);
        this.add.text(914, 46, 'Ⅱ', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(23);
        this.pauseButton.on('pointerdown', () => this.pauseGame());
    }

    makeActionButton(x, y, label, callback) {
        const button = this.add.circle(x, y, 31, 0x202a33, 0.88)
            .setStrokeStyle(2, 0x91a5b2, 0.8)
            .setInteractive({ useHandCursor: true })
            .setDepth(20);
        this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: label === '↑' ? '26px' : '17px',
            fontStyle: 'bold',
            color: '#fff2d6'
        }).setOrigin(0.5).setDepth(21);
        button.on('pointerdown', callback);
        return button;
    }

    createInputs() {
        this.keys = this.input.keyboard.createCursorKeys();
        this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.pauseKeys = [
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        ];

        this.pointerShootHandler = (pointer) => {
            const pauseControl = pointer.x >= 880 && pointer.y <= 75;
            const jumpControl = pointer.x <= 130 && pointer.y >= 395;
            const fireControl = pointer.x >= 830 && pointer.y >= 395;
            const hud = pointer.y <= 100;
            if (!pauseControl && !jumpControl && !fireControl && !hud) {
                this.shoot(pointer.worldX, pointer.worldY);
            }
        };
        this.input.on('pointerdown', this.pointerShootHandler);
    }

    drawCave() {
        const cave = this.add.graphics().setDepth(-10);
        cave.fillGradientStyle(0x514735, 0x514735, 0x171a17, 0x171a17, 1);
        cave.fillRect(0, 0, WIDTH, HEIGHT);
        cave.fillStyle(0x211f19, 0.72);
        cave.fillPoints([
            { x: 0, y: 0 },
            { x: WIDTH, y: 0 },
            { x: WIDTH, y: 95 },
            { x: 840, y: 126 },
            { x: 730, y: 111 },
            { x: 610, y: 154 },
            { x: 480, y: 113 },
            { x: 350, y: 143 },
            { x: 230, y: 106 },
            { x: 110, y: 150 },
            { x: 0, y: 116 }
        ], true);
        const rockLayer = this.add.graphics().setDepth(-8);
        rockLayer.fillStyle(0x705d40, 0.28);
        for (let i = 0; i < 32; i++) {
            const x = Phaser.Math.Between(-30, WIDTH + 30);
            const y = Phaser.Math.Between(120, 372);
            const radius = Phaser.Math.Between(12, 50);
            rockLayer.fillEllipse(x, y, radius * 2.2, radius);
        }
        rockLayer.fillStyle(0x25231d, 0.5);
        for (let i = 0; i < 18; i++) {
            const x = i * 57 + Phaser.Math.Between(-20, 20);
            const y = Phaser.Math.Between(102, 144);
            const width = Phaser.Math.Between(16, 48);
            const length = Phaser.Math.Between(24, 80);
            rockLayer.fillTriangle(x, y, x + width, y, x + width / 2, y + length);
        }

        this.add.rectangle(480, 538, 960, 12, 0x171711).setDepth(-1);
        this.rocks = [];
        for (let i = 0; i < 6; i++) {
            const rock = this.add.graphics().setDepth(0);
            rock.fillStyle(0x493d2d, 0.85);
            rock.fillRoundedRect(-8, 0, 16, 236, 6);
            rock.fillRoundedRect(-23, -8, 46, 17, 6);
            rock.fillStyle(0x665437, 0.85);
            rock.fillRoundedRect(-5, 3, 5, 223, 2);
            rock.fillStyle(0x493d2d, 0.95);
            rock.fillRoundedRect(-112, -10, 224, 13, 5);
            rock.lineStyle(7, 0x493d2d, 0.9);
            rock.lineBetween(-100, 0, -7, 72);
            rock.lineBetween(100, 0, 7, 72);
            rock.lineStyle(2, 0x756345, 0.8);
            rock.lineBetween(-103, 1, -8, 72);
            rock.lineBetween(97, 1, 8, 72);
            rock.fillStyle(0xf0b657, 0.8);
            rock.fillCircle(48, 23, 4);
            rock.fillStyle(0xffc95f, 0.12);
            rock.fillCircle(48, 23, 24);
            rock.setPosition(i * 220 + 35, 162);
            this.rocks.push(rock);
        }
        this.trackGraphics = this.add.graphics().setDepth(3);
        this.oreGraphics = this.add.graphics().setDepth(2);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        this.elapsed += delta / 1000;
        this.speed = Math.min(210 + this.elapsed * 2.2, 390);
        this.wheelRotation += delta * (this.speed / 130);
        this.updateScenery(delta);

        if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            this.jump();
        }
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.shoot(WIDTH, this.player.y - 20);
        }
        if (this.pauseKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
            this.pauseGame();
            return;
        }

        this.updatePlatforms(delta);
        this.updateBirds(delta);
        this.updateBullets();
        this.updateCart();
        this.updateHud();

        if (this.player.y > HEIGHT + 45) {
            this.endGame();
        }
    }

    updatePlatforms(delta) {
        const movement = this.speed * (delta / 1000);
        this.platforms.forEach((platform) => {
            platform.x -= movement;
            platform.segments.forEach((ground, index) => {
                ground.x = platform.x + index * 28 + ground.width / 2;
                ground.body.updateFromGameObject();
            });
        });
        this.platforms = this.platforms.filter((platform) => {
            if (platform.x + platform.width < -40) {
                platform.segments.forEach((ground) => ground.destroy());
                return false;
            }
            return true;
        });

        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform && lastPlatform.x + lastPlatform.width < WIDTH + 280) {
            const nextWidth = Phaser.Math.Between(520, 670) - Math.min(65, this.elapsed * 0.8);
            const gap = Phaser.Math.Between(105, 132);
            const nextX = lastPlatform.x + lastPlatform.width + gap;
            const nextTopY = Phaser.Math.Clamp(
                lastPlatform.endY + Phaser.Math.Between(-28, 28),
                402,
                462
            );
            this.createPlatform(nextX, nextWidth, nextTopY);
        }
        this.drawTrack();
    }

    drawTrack() {
        const graphics = this.trackGraphics;
        graphics.clear();
        this.oreGraphics.clear();
        this.platforms.forEach(({ x, width, topY, endY }) => {
            const left = x;
            const right = x + width;
            const topAt = (position) => Phaser.Math.Linear(topY, endY, (position - left) / width);
            graphics.fillStyle(0x72583a, 1);
            graphics.beginPath();
            graphics.moveTo(left, topAt(left));
            graphics.lineTo(right, topAt(right));
            graphics.lineTo(right, HEIGHT + 45);
            graphics.lineTo(left, HEIGHT + 45);
            graphics.closePath();
            graphics.fillPath();
            graphics.lineStyle(4, 0x99805a, 0.85);
            graphics.lineBetween(left, topAt(left), right, topAt(right));
            graphics.lineStyle(5, 0x6e7470, 1);
            graphics.lineBetween(left, topAt(left) - 5, right, topAt(right) - 5);
            graphics.lineStyle(2, 0xc2b895, 0.8);
            graphics.lineBetween(left, topAt(left) + 3, right, topAt(right) + 3);
            graphics.lineStyle(4, 0x443d32, 1);
            graphics.lineBetween(left, topAt(left) + 13, right, topAt(right) + 13);
            for (let position = left + 12; position < right - 3; position += 34) {
                const y = topAt(position);
                graphics.fillStyle(0x665744, 1);
                graphics.fillRoundedRect(position, y + 13, 6, 20, 2);
            }
            this.oreGraphics.fillStyle(0x9a7848, 0.72);
            for (let position = left + 22; position < right - 16; position += 52) {
                const y = topAt(position) + 32 + ((Math.floor(position / 52) % 3) * 13);
                this.oreGraphics.fillTriangle(position, y, position + 13, y - 5, position + 21, y + 3);
                this.oreGraphics.fillStyle(0x55452f, 0.8);
                this.oreGraphics.fillCircle(position + 32, y + 10, 3);
                this.oreGraphics.fillStyle(0x9a7848, 0.72);
            }
        });
    }

    updateScenery(delta) {
        const movement = this.speed * (delta / 1000) * 0.58;
        this.rocks.forEach((rock) => {
            rock.x -= movement;
            if (rock.x < -40) rock.x = WIDTH + Phaser.Math.Between(80, 260);
            rock.setX(rock.x);
        });
    }

    updateCart() {
        const graphics = this.cartGraphics;
        graphics.clear();
        graphics.setPosition(this.player.x, this.player.y);
        graphics.setAlpha(this.elapsed * 1000 < this.invulnerableUntil
            ? (Math.floor(this.elapsed * 16) % 2 ? 0.35 : 1)
            : 1);

        graphics.fillStyle(0x171614, 0.42);
        graphics.fillEllipse(0, 31, 112, 14);
        graphics.fillStyle(0x211d18, 1);
        graphics.fillCircle(-31, 18, 14);
        graphics.fillCircle(31, 18, 14);
        graphics.fillStyle(0x8c8170, 1);
        graphics.fillCircle(-31, 18, 8);
        graphics.fillCircle(31, 18, 8);
        graphics.lineStyle(2, 0x403d37, 1);
        for (const x of [-31, 31]) {
            const spokeX = Math.cos(this.wheelRotation) * 5;
            const spokeY = Math.sin(this.wheelRotation) * 5;
            graphics.lineBetween(x - spokeX, 17 - spokeY, x + spokeX, 17 + spokeY);
            graphics.lineBetween(x + spokeY, 17 - spokeX, x - spokeY, 17 + spokeX);
        }
        graphics.fillStyle(0x51483a, 1);
        graphics.fillRoundedRect(-48, -12, 96, 29, 4);
        graphics.fillStyle(0x9a8b70, 1);
        graphics.fillRoundedRect(-48, -12, 5, 29, 2);
        graphics.fillRoundedRect(43, -12, 5, 29, 2);
        graphics.fillStyle(0x82755f, 1);
        graphics.fillRoundedRect(-44, -15, 88, 8, 3);
        graphics.fillStyle(0x302a22, 1);
        graphics.fillRoundedRect(-38, -7, 76, 18, 2);
        graphics.fillStyle(0x88754e, 1);
        graphics.fillTriangle(-33, -8, -16, -24, 0, -8);
        graphics.fillStyle(0xb59a65, 1);
        graphics.fillTriangle(-13, -8, 5, -20, 23, -8);
        graphics.fillStyle(0x786344, 1);
        graphics.fillTriangle(10, -8, 25, -19, 36, -8);
        graphics.lineStyle(3, 0xc0ad83, 1);
        graphics.lineBetween(-41, -11, 41, -11);
        graphics.lineStyle(2, 0x332c22, 1);
        graphics.lineBetween(-39, 3, 39, 3);
        graphics.fillStyle(0xd0bd91, 1);
        for (const x of [-39, 39]) {
            for (const y of [-7, 9]) graphics.fillCircle(x, y, 1.5);
        }

        const miner = this.minerGraphics;
        miner.clear();
        miner.setPosition(this.player.x, this.player.y);
        miner.setAlpha(graphics.alpha);
        miner.fillStyle(0x283b32, 1);
        miner.fillRoundedRect(-15, -40, 26, 24, 6);
        miner.fillStyle(0xa9824f, 1);
        miner.fillCircle(-2, -48, 10);
        miner.fillStyle(0xead08a, 1);
        miner.fillRoundedRect(-14, -58, 24, 7, 3);
        miner.fillStyle(0xf0bf50, 1);
        miner.fillRoundedRect(-5, -63, 6, 5, 2);
        miner.fillStyle(0xe4c38d, 1);
        miner.fillCircle(5, -49, 1.5);
        miner.fillStyle(0x80563c, 1);
        miner.fillRoundedRect(-11, -22, 13, 13, 3);
        miner.fillRoundedRect(1, -24, 13, 7, 3);
        miner.lineStyle(5, 0xa9824f, 1);
        miner.lineBetween(8, -23, 18, -28);
        const gunAngle = this.weaponAngle ?? 0;
        const gunStartX = 15;
        const gunStartY = -30;
        const gunEndX = gunStartX + Math.cos(gunAngle) * 27;
        const gunEndY = gunStartY + Math.sin(gunAngle) * 27;
        miner.lineStyle(7, 0x3c3931, 1);
        miner.lineBetween(gunStartX, gunStartY, gunEndX, gunEndY);
        miner.lineStyle(3, 0x9a8d70, 1);
        miner.lineBetween(gunStartX, gunStartY - 2, gunEndX, gunEndY - 2);
        miner.fillStyle(0x5b4632, 1);
        miner.fillRect(gunStartX - 6, gunStartY - 3, 8, 7);
        if (this.muzzleUntil > this.time.now) {
            miner.fillStyle(0xffd06f, 0.9);
            miner.fillCircle(gunEndX, gunEndY - 2, 5);
        }
    }

    updateBirds(delta) {
        const difficulty = Math.min(this.elapsed / 95, 1);
        this.birdTimer.delay = Math.max(1050, 2500 - this.elapsed * 18);
        this.birds.forEach((bird) => {
            bird.body.x -= (this.speed + 60 + difficulty * 40) * (delta / 1000);
            bird.body.body.updateFromGameObject();
            bird.phase += delta * 0.012;
            bird.visual.clear();
            bird.visual.setPosition(bird.body.x, bird.body.y);
            const wing = Math.sin(bird.phase) * 8;
            bird.visual.fillStyle(0x242d32, 1);
            bird.visual.fillEllipse(0, 0, 31, 19);
            bird.visual.fillStyle(0x39464b, 1);
            bird.visual.fillTriangle(-5, 0, -21, -wing - 4, -15, 11);
            bird.visual.fillStyle(0x39464b, 1);
            bird.visual.fillTriangle(-2, 0, 12, wing - 5, 9, 9);
            bird.visual.fillStyle(0xe4ae5e, 1);
            bird.visual.fillTriangle(13, -2, 24, 1, 13, 4);
            bird.visual.fillStyle(0xf4d785, 1);
            bird.visual.fillCircle(8, -4, 2);
        });
        this.birds = this.birds.filter((bird) => {
            if (bird.body.x < -60) {
                bird.body.destroy();
                bird.visual.destroy();
                return false;
            }
            return true;
        });
    }

    updateBullets() {
        this.bullets = this.bullets.filter((bullet) => {
            if (!bullet.active || bullet.x < -20 || bullet.x > WIDTH + 20 || bullet.y < -20 || bullet.y > HEIGHT + 20) {
                if (bullet.active) bullet.destroy();
                return false;
            }
            return true;
        });
    }

    spawnBird() {
        if (this.isGameOver) return;
        const y = Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-65, 20), 210, 470);
        const body = this.add.rectangle(WIDTH + 40, y, 39, 27, 0xffffff, 0);
        this.physics.add.existing(body);
        body.body.setAllowGravity(false);
        body.body.setImmovable(true);
        this.birdGroup.add(body);
        const visual = this.add.graphics().setDepth(6);
        this.birds.push({ body, visual, phase: Math.random() * Math.PI * 2 });
    }

    jump() {
        if (!this.player?.body || !this.player.body.blocked.down) return;
        this.player.body.setVelocityY(-650);
    }

    shoot(targetX, targetY) {
        if (this.isGameOver || this.ammo <= 0) return;
        this.weaponAngle = Phaser.Math.Clamp(
            Phaser.Math.Angle.Between(this.player.x, this.player.y - 30, targetX, targetY),
            -Math.PI * 0.68,
            Math.PI * 0.12
        );
        this.muzzleUntil = this.time.now + 90;
        const muzzleX = 15 + Math.cos(this.weaponAngle) * 27;
        const muzzleY = -30 + Math.sin(this.weaponAngle) * 27;
        const bullet = this.add.circle(this.player.x + muzzleX, this.player.y + muzzleY, 5, 0xffd064);
        this.physics.add.existing(bullet);
        this.bulletGroup.add(bullet);
        bullet.body.setAllowGravity(false);
        bullet.body.setVelocity(
            Math.cos(this.weaponAngle) * 680,
            Math.sin(this.weaponAngle) * 680
        );
        this.bullets.push(bullet);
        this.ammo--;
        if (!this.reloadTimer) {
            this.reloadAt = this.time.now + 950;
            this.reloadTimer = this.time.addEvent({
                delay: 950,
                loop: true,
                callback: () => {
                    this.ammo = Math.min(this.ammoMax, this.ammo + 1);
                    this.reloadAt = this.ammo < this.ammoMax ? this.time.now + 950 : null;
                    this.updateHud();
                    if (this.ammo === this.ammoMax) {
                        this.reloadTimer.remove();
                        this.reloadTimer = null;
                    }
                }
            });
        }
        this.updateHud();
    }

    hitBird(bullet, birdBody) {
        const birdIndex = this.birds.findIndex((bird) => bird.body === birdBody);
        if (birdIndex === -1) return;
        const bird = this.birds[birdIndex];
        const hitX = birdBody.x;
        const hitY = birdBody.y;
        this.birds.splice(birdIndex, 1);
        bullet.destroy();
        bird.body.destroy();
        bird.visual.destroy();
        this.birdsDefeated++;
        this.updateHud();

        const burst = this.add.circle(hitX, hitY, 5, 0xffbd59, 0.8).setDepth(8);
        this.tweens.add({
            targets: burst,
            scale: 4,
            alpha: 0,
            duration: 250,
            onComplete: () => burst.destroy()
        });
    }

    hitPlayer(player, birdBody) {
        const birdIndex = this.birds.findIndex((bird) => bird.body === birdBody);
        if (birdIndex === -1 || this.elapsed * 1000 < this.invulnerableUntil) return;
        const bird = this.birds[birdIndex];
        this.birds.splice(birdIndex, 1);
        bird.body.destroy();
        bird.visual.destroy();

        this.lives = Math.max(0, this.lives - 1);
        this.invulnerableUntil = this.elapsed * 1000 + 1300;
        this.cameras.main.shake(180, 0.008);
        this.updateHud();
        if (this.lives === 0) this.endGame();
    }

    updateHud() {
        if (!this.statsText) return;
        const seconds = Math.floor(this.elapsed);
        const currentScore = seconds * 10 + this.lives * 100 + this.birdsDefeated * 25;
        const hearts = '♥'.repeat(this.lives) + '♡'.repeat(3 - this.lives);
        this.statsText.setText(`${hearts}   ${this.formatTime(seconds)}   ${currentScore} PTS`);
        if (this.ammoText) {
            this.ammoText.setText(`BALAS ${this.ammo}/${this.ammoMax}`);
            const meter = this.ammoGraphics;
            meter.clear();
            const startX = 852;
            const y = 380;
            for (let index = 0; index < this.ammoMax; index++) {
                meter.fillStyle(index < this.ammo ? 0xf0c66f : 0x38352e, 1);
                meter.fillRoundedRect(startX + index * 13, y, 9, 17, 3);
                meter.lineStyle(1, 0x9e8957, 0.9);
                meter.strokeRoundedRect(startX + index * 13, y, 9, 17, 3);
            }
            if (this.ammo < this.ammoMax && this.reloadAt) {
                const progress = Phaser.Math.Clamp(1 - (this.reloadAt - this.time.now) / 950, 0, 1);
                meter.fillStyle(0x80683e, 0.7);
                meter.fillRoundedRect(startX, y + 22, this.ammoMax * 13 - 4, 4, 2);
                meter.fillStyle(0xf0c66f, 1);
                meter.fillRoundedRect(startX, y + 22, (this.ammoMax * 13 - 4) * progress, 4, 2);
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const remainder = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${remainder}`;
    }

    pauseGame() {
        this.scene.pause();
        this.scene.launch('Pause');
    }

    endGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        const time = Math.floor(this.elapsed);
        const score = 10 * time + 100 * this.lives + 25 * this.birdsDefeated;
        this.scene.start('GameOver', {
            playerName: this.playerName,
            time,
            lives: this.lives,
            birds: this.birdsDefeated,
            score
        });
    }

    shutdownGame() {
        if (this.pointerShootHandler) {
            this.input.off('pointerdown', this.pointerShootHandler);
            this.pointerShootHandler = null;
        }
        this.birdTimer?.remove();
        this.reloadTimer?.remove();
        this.reloadTimer = null;
        this.reloadAt = null;
    }
}
