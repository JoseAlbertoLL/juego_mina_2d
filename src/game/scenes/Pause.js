import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Pause extends Scene {
    constructor() {
        super('Pause');
    }

    create() {
        // Fondo semitransparente oscuro
        const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000);
        overlay.setAlpha(0.7);

        // Título de Pausa
        this.add.text(480, 180, 'JUEGO PAUSADO', {
            fontFamily: 'Arial Black',
            fontSize: 42,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Texto de instrucciones
        this.add.text(480, 280, 'Presiona [ P ] para Reanudar', {
            fontSize: '22px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(480, 330, 'Presiona [ M ] para ir al Menú Principal', {
            fontSize: '22px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // ESCUCHADOR PARA REANUDAR CON LA TECLA 'P'
        this.input.keyboard.once('keydown-P', () => {
            this.scene.resume('Game'); // Reanudamos el juego
            this.scene.stop();         // Cerramos la pausa
        });

        // ESCUCHADOR PARA IR AL MENÚ CON LA TECLA 'M'
        this.input.keyboard.once('keydown-M', () => {
            this.scene.stop('Game');   // Detenemos el juego de fondo
            this.scene.start('MainMenu'); // Vamos al menú
        });
    }
}