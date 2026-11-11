import { Scene } from 'phaser';

export class Pause extends Scene {
    constructor() {
        super('Pause');
    }

    create() {
        this.add.rectangle(480, 270, 960, 540, 0x090d11, 0.78);
        this.add.text(480, 152, 'DUSTY', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#f4d28d',
            letterSpacing: 3
        }).setOrigin(0.5);
        this.add.text(480, 207, 'PAUSA', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#f4d28d',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.add.text(480, 254, 'La mina espera. Toma aire.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '17px',
            color: '#d0d9de'
        }).setOrigin(0.5);

        this.makeButton(480, 310, 'CONTINUAR', () => this.resumeGame(), true);
        this.makeButton(480, 378, 'SALIR AL MENÚ', () => {
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        }, false);

        this.input.keyboard.on('keydown-P', this.resumeGame, this);
        this.input.keyboard.on('keydown-ESC', this.resumeGame, this);
    }

    resumeGame() {
        this.scene.resume('Game');
        this.scene.stop();
    }

    makeButton(x, y, label, callback, primary) {
        const button = this.add.rectangle(x, y, 280, 50, primary ? 0xb66b3d : 0x29343b)
            .setStrokeStyle(1, 0x859198)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#fff2d6',
            letterSpacing: 1
        }).setOrigin(0.5);
        button.on('pointerdown', callback);
        button.on('pointerover', () => text.setColor('#ffe09e'));
        button.on('pointerout', () => text.setColor('#fff2d6'));
    }
}
