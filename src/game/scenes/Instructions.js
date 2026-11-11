import { Scene } from 'phaser';

export class Instructions extends Scene {
    constructor() {
        super('Instructions');
    }

    init(data) {
        this.playerName = data.playerName || this.registry.get('playerName') || 'Minero';
    }

    create() {
        this.cameras.main.setBackgroundColor('#151b22');
        this.add.rectangle(480, 270, 760, 420, 0x202a33, 0.96)
            .setStrokeStyle(2, 0x65727b, 0.8);
        this.add.text(480, 96, 'DUSTY · ANTES DE BAJAR', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#f4d28d',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.add.text(480, 140, `Listo, ${this.playerName.slice(0, 24)}. Súbete a la vagoneta y protege la mina.`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#d0d9de'
        }).setOrigin(0.5);

        const instructions = [
            ['↑  /  ESPACIO  /  TOQUE', 'Salta los huecos de los rieles.'],
            ['X  /  CLIC  /  TOQUE EN LA MINA', 'Tienes 5 balas; se recargan una por una.'],
            ['P  /  ESC  /  Ⅱ', 'Pausa sin perder tiempo ni progreso.'],
            ['3 VIDAS', 'Las aves quitan una vida; un hueco termina la carrera.']
        ];
        instructions.forEach(([title, detail], index) => {
            const y = 206 + index * 54;
            this.add.text(180, y, title, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#e5ad68',
                letterSpacing: 1
            }).setOrigin(0, 0.5);
            this.add.text(180, y + 22, detail, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#d0d9de'
            }).setOrigin(0, 0.5);
        });

        this.makeButton(480, 432, '¡A LA MINA!', () => {
            this.scene.start('Game', { playerName: this.playerName });
        }, true);
        this.makeButton(480, 487, 'VOLVER', () => this.scene.start('MainMenu'), false);
    }

    makeButton(x, y, label, callback, primary) {
        const button = this.add.rectangle(x, y, 250, 42, primary ? 0xb66b3d : 0x29343b)
            .setStrokeStyle(1, 0x859198)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#fff2d6'
        }).setOrigin(0.5);
        button.on('pointerdown', callback);
        button.on('pointerover', () => text.setColor('#ffe09e'));
        button.on('pointerout', () => text.setColor('#fff2d6'));
    }
}
