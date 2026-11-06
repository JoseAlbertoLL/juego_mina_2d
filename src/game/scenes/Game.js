
import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Game extends Scene {

    constructor() {
        super('Game');
    }

    create() {

        this.cameras.main.setBackgroundColor(0x211c1a);

        // Suelo de prueba
        this.suelo = this.add.rectangle(
            480, 500, 960, 40, 0x795548
        );

        this.physics.add.existing(this.suelo, true);

        // Carrito provisional
        this.carrito = this.add.rectangle(
            200, 440, 130, 55, 0x8d6e63
        );

        // Incorporamos el cuerpo físico
        this.physics.add.existing(this.carrito);

        // Configuramos el cuerpo físico
        this.carrito.body.setGravityY(1200);

        this.carrito.body.setCollideWorldBounds(true);

        // Minero provisional: elemento visual
        this.minero = this.add.rectangle(
            200, 405, 30, 65, 0xf5c542
        );

        // Colisión con el suelo
        this.physics.add.collider(
            this.carrito,
            this.suelo
        );

        // Controles
        this.teclas = this.input.keyboard.createCursorKeys();

        this.espacio = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Indicaciones
        this.add.text(20, 20, 'PROTOTIPO DE FISICAS', {
            fontSize: '22px',
            color: '#ffffff'
        });

    }

    update() {

        // El minero sigue la posición del carrito
        this.minero.setPosition(
            this.carrito.x,
            this.carrito.y - 35
        );

        // Detectamos si el carrito está en el suelo
        const enSuelo = this.carrito.body.blocked.down;

        // Salto
        if (
            enSuelo &&
            (
                Phaser.Input.Keyboard.JustDown(this.espacio) ||
                Phaser.Input.Keyboard.JustDown(this.teclas.up)
            )
        ) {

            this.carrito.body.setVelocityY(-600);

        }

    }

}
