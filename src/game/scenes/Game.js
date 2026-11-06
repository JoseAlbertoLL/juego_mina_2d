import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Game extends Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x211c1a);

        // --- VARIABLES DE ESTADO Y JUEGO ---
        this.vidas = 3;
        this.puntosAves = 0;
        this.tiempoSobrevivido = 0;
        this.gameSpeed = 5; // Velocidad del desplazamiento lateral

        // --- SUELO ---
        this.suelo = this.add.rectangle(480, 500, 960, 40, 0x795548);
        this.physics.add.existing(this.suelo, true);

        // --- CARRITO (JUGADOR) ---
        this.carrito = this.add.rectangle(200, 440, 100, 50, 0x8d6e63);
        this.physics.add.existing(this.carrito);
        this.carrito.body.setGravityY(1200);
        this.carrito.body.setCollideWorldBounds(true);

        // --- MINERO (VISUAL) ---
        this.minero = this.add.rectangle(200, 395, 30, 40, 0xf5c542);

        // --- GRUPOS DE OBJETOS ---
        this.balasGroup = this.physics.add.group();
        this.avesGroup = this.physics.add.group();

        // --- COLISIONES ---
        this.physics.add.collider(this.carrito, this.suelo);

        // Colisión entre balas y aves
        this.physics.add.overlap(this.balasGroup, this.avesGroup, (bala, ave) => {
            bala.destroy();
            ave.destroy();
            this.puntosAves += 100;
        });

        // Colisión entre aves y carrito (quita vida)
        this.physics.add.overlap(this.carrito, this.avesGroup, (carrito, ave) => {
            ave.destroy();
            this.vidas--;
            this.actualizarTextoVidas();
            
            if (this.vidas <= 0) {
                // Calcular puntuación final y pasar a GameOver
                const scoreFinal = Math.floor(this.tiempoSobrevivido) + this.puntosAves + (this.vidas * 200);
                this.scene.start('GameOver', { score: scoreFinal });
            }
        });

        // --- CONTROLES ---
        this.teclas = this.input.keyboard.createCursorKeys();
        
        this.espacio = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Tecla 'X' o 'F' para disparar el rifle
        this.teclaDisparo = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.X
        );

        // --- INTERFAZ (UI) ---
        this.textoUI = this.add.text(20, 20, '', {
            fontSize: '18px',
            color: '#ffffff'
        });
        this.actualizarTextoVidas();

        // --- TEMPORIZADOR PARA SPAWN DE AVES ---
        this.time.addEvent({
            delay: 2500, // Cada 2.5 segundos aparece un ave
            callback: this.lanzarAve,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        // Aumentar tiempo de supervivencia
        this.tiempoSobrevivido += delta / 1000;

        // El minero sigue la posición del carrito
        this.minero.setPosition(
            this.carrito.x,
            this.carrito.y - 45
        );

        // Detectar si el carrito está en el suelo
        const enSuelo = this.carrito.body.blocked.down;

        // Salto con ESPACIO o FLECHA ARRIBA
        if (
            enSuelo &&
            (
                Phaser.Input.Keyboard.JustDown(this.espacio) ||
                Phaser.Input.Keyboard.JustDown(this.teclas.up)
            )
        ) {
            this.carrito.body.setVelocityY(-600);
        }

        // Disparar con la tecla X
        if (Phaser.Input.Keyboard.JustDown(this.teclaDisparo)) {
            this.dispararRifle();
        }

        // Mover las aves hacia la izquierda (simulando que el jugador avanza)
        this.avesGroup.getChildren().forEach((ave) => {
            ave.x -= this.gameSpeed + 2;
            if (ave.x < -50) {
                ave.destroy(); // Limpiar aves que salen de pantalla
            }
        });

        // Actualizar UI en tiempo real
        this.actualizarTextoVidas();
    }

    dispararRifle() {
        // Creamos un rectángulo pequeño que simula la bala
        const bala = this.add.rectangle(this.carrito.x + 60, this.carrito.y, 15, 6, 0xffff00);
        this.physics.add.existing(bala);
        bala.body.setVelocityX(800); // Velocidad rápida hacia la derecha
        this.balasGroup.add(bala);
    }

    lanzarAve() {
        // Creamos un rectángulo rojo que simula un ave enemiga volando a media altura
        const alturaAleatoria = Phaser.Math.Between(250, 400);
        const ave = this.add.rectangle(1000, alturaAleatoria, 40, 25, 0xe74c3c);
        this.physics.add.existing(ave);
        this.avesGroup.add(ave);
    }

    actualizarTextoVidas() {
        this.textoUI.setText(
            `VIDAS: ${this.vidas}  |  PUNTOS AVES: ${this.puntosAves}  |  TIEMPO: ${Math.floor(this.tiempoSobrevivido)}s`
        );
    }

}