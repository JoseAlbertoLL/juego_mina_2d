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
            delay: 2500,
            callback: this.lanzarAve,
            callbackScope: this,
            loop: true
        });

        // --- TEMPORIZADOR PARA GENERAR NUEVO SUELO CONTINUO ---
        this.time.addEvent({
            delay: 1500,
            callback: this.generarBloqueSuelo,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        this.tiempoSobrevivido += delta / 1000;

        // El minero sigue la posición del carrito
        this.minero.setPosition(
            this.carrito.x,
            this.carrito.y - 45
        );

        // Detectar si el carrito está en el suelo
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

        // --- CONDICIÓN DE DERROTA POR CAÍDA EN AGUJERO ---
        if (this.carrito.y > 600) {
            this.terminarJuego();
        }

        // Mover el suelo hacia la izquierda (efecto scroll)
        this.suelosGroup.getChildren().forEach((suelo) => {
            suelo.x -= this.gameSpeed;
            // Actualizamos la posición física estática para que colisione bien mientras se mueve
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
        const sueloInicial = this.add.rectangle(480, 500, 1000, 40, 0x795548);
        this.physics.add.existing(sueloInicial, true);
        this.suelosGroup.add(sueloInicial);
    }

    generarBloqueSuelo() {
        // Obtenemos el último bloque de suelo creado para medir la distancia
        const ultimoSuelo = this.suelosGroup.getChildren()[this.suelosGroup.getChildren().length - 1];
        
        // Si por alguna razón el grupo está vacío, salimos
        if (!ultimoSuelo) return;

        // Longitud aleatoria para el nuevo bloque (ej. entre 350px y 600px de ancho)
        const anchoSuelo = Phaser.Math.Between(350, 600);
        
        // Definimos un espacio (hueco) seguro que el carrito pueda saltar con su fuerza actual (-600)
        // Con una velocidad de scroll de 5 y un salto de 600, un hueco de entre 120px y 220px es perfecto y desafiante pero saltable.
        const espacioAleatorio = Phaser.Math.Between(120, 220);

        // La posición X se calcula sumando la mitad del último suelo, el espacio, y la mitad del nuevo suelo
        const posX = ultimoSuelo.x + (ultimoSuelo.width / 2) + espacioAleatorio + (anchoSuelo / 2);
        
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

    actualizarTextoVidas() {
        this.textoUI.setText(
            `VIDAS: ${this.vidas}  |  PUNTOS AVES: ${this.puntosAves}  |  TIEMPO: ${Math.floor(this.tiempoSobrevivido)}s`
        );
    }

    terminarJuego() {
        const scoreFinal = Math.floor(this.tiempoSobrevivido) * 10 + this.puntosAves + (this.vidas * 200);
        this.scene.start('GameOver', { score: scoreFinal });
    }

}