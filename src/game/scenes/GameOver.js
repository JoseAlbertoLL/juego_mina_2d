import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    // El método init recibe los datos pasados desde la escena anterior
    init (data)
    {
        // Guardamos la puntuación (si por alguna razón se abre directo, por defecto será 0)
        this.scoreFinal = data.score || 0;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x211c1a);

        this.add.image(512, 384, 'background').setAlpha(0.3);

        // Título de Game Over
        this.add.text(512, 220, 'GAME OVER', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ff4444',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Texto que muestra la Puntuación Final calculada
        this.add.text(512, 330, `PUNTUACIÓN FINAL: ${this.scoreFinal}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Instrucciones para continuar
        this.add.text(512, 440, 'Haz clic para volver al Menú Principal', {
            fontSize: '20px', color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        // Al hacer clic, regresamos al menú principal
        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}