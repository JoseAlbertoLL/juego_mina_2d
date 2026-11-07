import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export class Game extends Scene {

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x211c1a);

        this.teclaPausa = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

        // --- VARIABLES DE ESTADO Y JUEGO ---
        this.vidas = 3;
        this.puntosAves = 0;
        this.tiempoSobrevivido = 0;
        this.gameSpeed = 5; // Velocidad del desplazamiento lateral

        this.alturaMaxima = 0;
        this.sueloY = 500 - 20;

        // --- SISTEMA DE MUNICIÓN ---
        this.municionMax = 4;
        this.municion = 4;
        this.reloadTimer = null; // Referencia para controlar y reiniciar el tiempo de recarga

        // --- GRUPOS ---
        this.suelosGroup = this.physics.add.staticGroup();
        this.balasGroup = this.physics.add.group();
        this.avesGroup = this.physics.add.group();

        // --- CREAR SUELO INICIAL ---
        this.crearPlataformaInicial();

        // --- CARRITO (JUGADOR) ---
        this.carrito = this.add.rectangle(200, 350, 100, 50, 0x8d6e63);
        this.physics.add.existing(this.carrito);
        this.carrito.body.setGravityY(1200);
        this.carrito.body.setCollideWorldBounds(false);

        // --- MINERO (VISUAL) ---
        this.minero = this.add.rectangle(200, 305, 30, 40, 0xf5c542);

        // --- COLISIONES ---
        this.physics.add.collider(this.carrito, this.suelosGroup);

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
            this.actualizarTextoUI();
            
            if (this.vidas <= 0) {
                this.terminarJuego();
            }
        });

        // --- CONTROLES DE TECLADO ---
        this.teclas = this.input.keyboard.createCursorKeys();
        this.espacio = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // --- CONTROL DE RATÓN PARA DISPARAR ---
        this.input.on('pointerdown', (pointer) => {
            this.dispararRifle(pointer);
        });

        // --- INTERFAZ (UI) ---
        this.textoUI = this.add.text(20, 20, '', {
            fontSize: '18px',
            color: '#ffffff'
        });
        this.actualizarTextoUI();

        // --- TEMPORIZADOR PARA SPAWN DE AVES ---
        this.time.addEvent({
            delay: 2400,
            callback: this.lanzarAve,
            callbackScope: this,
            loop: true
        });

        // --- TEMPORIZADOR PARA GENERAR NUEVO SUELO ---
        this.time.addEvent({
            delay: 1100,
            callback: this.generarBloqueSuelo,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        const enSuelo = this.carrito.body.blocked.down;

        if (!enSuelo) {
            const alturaActual = Math.floor(this.sueloY - this.carrito.y);
            if (alturaActual > this.alturaMaxima) {
                this.alturaMaxima = alturaActual;
            }
        } else {
            this.alturaMaxima = 0; 
        }

        this.tiempoSobrevivido += delta / 1000;

        // El minero sigue la posición del carrito
        this.minero.setPosition(
            this.carrito.x,
            this.carrito.y - 45
        );

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

        // Pausar el juego
        if (Phaser.Input.Keyboard.JustDown(this.teclaPausa)) {
            // Pausamos la ejecución física y lógica de esta escena
            this.scene.pause('Game');
            // Lanzamos la escena de pausa por encima
            this.scene.launch('Pause');
        }

        // --- CONDICIÓN DE DERROTA POR CAÍDA EN AGUJERO ---
        if (this.carrito.y > 600) {
            this.terminarJuego();
        }

        // Mover el suelo hacia la izquierda (efecto scroll)
        this.suelosGroup.getChildren().forEach((suelo) => {
            suelo.x -= this.gameSpeed;
            suelo.body.updateFromGameObject();

            if (suelo.x < -300) {
                suelo.destroy();
            }
        });

        // Mover las aves hacia la izquierda
        this.avesGroup.getChildren().forEach((ave) => {
            ave.x -= this.gameSpeed + 2;
            if (ave.x < -50) {
                ave.destroy();
            }
        });

        // Limpiar balas fuera de pantalla
        this.balasGroup.getChildren().forEach((bala) => {
            if (bala.x > 1000 || bala.x < 0 || bala.y > 600 || bala.y < 0) {
                bala.destroy();
            }
        });

        this.actualizarTextoUI();
    }

    crearPlataformaInicial() {
        const sueloInicial = this.add.rectangle(900, 500, 1000, 40, 0x795548);
        this.physics.add.existing(sueloInicial, true);
        this.suelosGroup.add(sueloInicial);
    }

    generarBloqueSuelo() {
        const suelos = this.suelosGroup.getChildren();
        const ultimoSuelo = suelos[suelos.length - 1];
        
        if (!ultimoSuelo) return;

        const anchoSuelo = Phaser.Math.Between(350, 600);
        const espacioAleatorio = Phaser.Math.Between(130, 220);

        let posX = ultimoSuelo.x + (ultimoSuelo.width / 2) + espacioAleatorio + (anchoSuelo / 2);

        const anchoPantalla = 960;
        if (posX < anchoPantalla + 300) {
            posX = anchoPantalla + 300 + (anchoSuelo / 2);
        }

        const nuevoSuelo = this.add.rectangle(posX, 500, anchoSuelo, 40, 0x795548);
        this.physics.add.existing(nuevoSuelo, true);
        this.suelosGroup.add(nuevoSuelo);
    }

    dispararRifle(pointer) {
        // Si no quedan balas, no se puede disparar
        if (this.municion <= 0) return;

        const startX = this.carrito.x;
        const startY = this.carrito.y;

        const bala = this.add.rectangle(startX, startY, 15, 6, 0xffff00);
        this.physics.add.existing(bala);
        this.balasGroup.add(bala);

        const angle = Phaser.Math.Angle.Between(startX, startY, pointer.worldX, pointer.worldY);
        const speed = 900;
        bala.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        bala.rotation = angle;

        // Gastamos una bala
        this.municion--;

        // SI YA HABÍA UN TEMPORIZADOR DE RECARGA ACTIVO, LO CANCELAMOS (Reinicia el tiempo)
        if (this.reloadTimer) {
            this.reloadTimer.remove();
            this.reloadTimer = null;
        }

        // INICIAMOS / REINICIAMOS EL TEMPORIZADOR DE RECARGA (1.5 segundos)
        this.reloadTimer = this.time.delayedCall(1500, () => {
            this.municion = this.municionMax;
            this.reloadTimer = null; // Limpiamos la referencia al terminar
        });
    }

    lanzarAve() {
        const alturaAleatoria = Phaser.Math.Between(250, 400);
        const ave = this.add.rectangle(1000, alturaAleatoria, 40, 25, 0xe74c3c);
        this.physics.add.existing(ave);
        this.avesGroup.add(ave);
    }

    actualizarTextoUI() {
        // Mostramos siempre cuántas balas quedan
        let estadoMun = `BALAS: ${this.municion}/${this.municionMax}`;
        
        // Si el temporizador está activo, agregamos el aviso de recarga al lado sin ocultar las balas
        if (this.reloadTimer) {
            estadoMun += ` [RECARGANDO...]`;
        }

        this.textoUI.setText(
            `VIDAS: ${this.vidas} | PUNTOS: ${this.puntosAves} | ${estadoMun}`
        );
    }

    terminarJuego() {
        const scoreFinal = Math.floor(this.tiempoSobrevivido) * 10 + this.puntosAves + (this.vidas * 200);
        this.scene.start('GameOver', { score: scoreFinal });
    }

}