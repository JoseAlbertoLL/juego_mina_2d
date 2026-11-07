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

        this.alturaMaxima = 0;
        this.sueloY = 500 - 20; // Posición Y del suelo menos la mitad del alto del carrito (40/2 = 20)

        // --- GRUPOS ---
        this.suelosGroup = this.physics.add.staticGroup();
        this.balasGroup = this.physics.add.group();
        this.avesGroup = this.physics.add.group();

        // --- CREAR SUELO INICIAL (Bloques con huecos) ---
        this.crearPlataformaInicial();

        // --- CARRITO (JUGADOR) ---
        this.carrito = this.add.rectangle(200, 350, 100, 50, 0x8d6e63);
        this.physics.add.existing(this.carrito);
        this.carrito.body.setGravityY(1200);
        this.carrito.body.setCollideWorldBounds(false); // Desactivamos límites para permitir caer al vacío

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
            this.actualizarTextoVidas();
            
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
        this.actualizarTextoVidas();

        // --- TEMPORIZADOR PARA SPAWN DE AVES ---
        this.time.addEvent({
            delay: 2400,
            callback: this.lanzarAve,
            callbackScope: this,
            loop: true
        });

        // --- TEMPORIZADOR PARA GENERAR NUEVO SUELO CONTINUO ---
        this.time.addEvent({
            delay: 1100,
            callback: this.generarBloqueSuelo,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        // 1. PRIMERO declaramos la variable antes de usarla
        const enSuelo = this.carrito.body.blocked.down;

        // 2. AHORA ya podemos evaluar si está en el suelo o no
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

        this.actualizarTextoVidas();
    }

    crearPlataformaInicial() {
        // Creamos una plataforma sólida inicial larga para que el jugador empiece seguro
        const sueloInicial = this.add.rectangle(950, 500, 1000, 40, 0x795548);
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

        // GARANTÍA: Si el último suelo está muy cerca del borde visible, 
        // forzamos a que el nuevo suelo aparezca fuera de la pantalla (más allá de X = 1100)
        const anchoPantalla = 960;
        if (posX < anchoPantalla + 300) {
            posX = anchoPantalla + 300 + (anchoSuelo / 2);
        }

        const nuevoSuelo = this.add.rectangle(posX, 500, anchoSuelo, 40, 0x795548);
        this.physics.add.existing(nuevoSuelo, true);
        this.suelosGroup.add(nuevoSuelo);
    }

    dispararRifle(pointer) {
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
    }

    lanzarAve() {
        const alturaAleatoria = Phaser.Math.Between(250, 400);
        const ave = this.add.rectangle(1000, alturaAleatoria, 40, 25, 0xe74c3c);
        this.physics.add.existing(ave);
        this.avesGroup.add(ave);
    }

    /*actualizarTextoVidas() {
        this.textoUI.setText(
            `VIDAS: ${this.vidas}  |  PUNTOS AVES: ${this.puntosAves}  |  TIEMPO: ${Math.floor(this.tiempoSobrevivido)}s`
        );
    }*/

    actualizarTextoVidas() {
        this.textoUI.setText(
            `VIDAS: ${this.vidas} | PUNTOS: ${this.puntosAves} | SALTO MÁX: ${this.alturaMaxima}px`
        );
    }   


    terminarJuego() {
        const scoreFinal = Math.floor(this.tiempoSobrevivido) * 10 + this.puntosAves + (this.vidas * 200);
        this.scene.start('GameOver', { score: scoreFinal });
    }

}