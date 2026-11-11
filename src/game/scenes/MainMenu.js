import { Scene } from 'phaser';
import { login, logout, registerPlayer, restoreLogin } from '../api/authApi';
import { getCurrentPlayer } from '../api/authStore';

const INPUT_STYLE = {
    width: '300px',
    height: '46px',
    padding: '0 14px',
    border: '1px solid #857956',
    'border-radius': '9px',
    outline: 'none',
    background: '#25251e',
    color: '#f5ead1',
    'font-family': 'Arial, sans-serif',
    'font-size': '16px',
    'text-align': 'center',
    'box-sizing': 'border-box'
};

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.isBusy = false;
        this.player = getCurrentPlayer();
        this.drawBackdrop();
        this.add.text(480, 92, 'DUSTY', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#f4d28d',
            stroke: '#1b2024',
            strokeThickness: 8,
            letterSpacing: 4
        }).setOrigin(0.5);
        this.add.text(480, 143, 'EL ÚLTIMO TREN DE LA MINA', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#c4b998',
            letterSpacing: 4
        }).setOrigin(0.5);

        this.aliasInput = this.add.dom(480, 227).createElement('input', INPUT_STYLE);
        this.aliasInput.node.type = 'text';
        this.aliasInput.node.name = 'player-alias';
        this.aliasInput.node.maxLength = 80;
        this.aliasInput.node.autocomplete = 'username';
        this.aliasInput.node.placeholder = 'Alias';
        this.aliasInput.node.setAttribute('aria-label', 'Alias');
        this.passwordInput = this.add.dom(480, 285).createElement('input', INPUT_STYLE);
        this.passwordInput.node.type = 'password';
        this.passwordInput.node.autocomplete = 'current-password';
        this.passwordInput.node.placeholder = 'Contraseña';
        this.passwordInput.node.setAttribute('aria-label', 'Contraseña');

        this.add.text(480, 187, 'INICIA SESIÓN O CREA TU CUENTA', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f5ead1',
            letterSpacing: 1
        }).setOrigin(0.5);

        this.authButtons = [
            this.makeButton(328, 353, 'INICIAR SESIÓN', () => this.authenticate(false), true, 250),
            this.makeButton(632, 353, 'CREAR CUENTA', () => this.authenticate(true), false, 250)
        ];
        this.authStatus = this.add.text(480, 397, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#d0d9de',
            align: 'center',
            wordWrap: { width: 660 }
        }).setOrigin(0.5);

        this.welcomeText = this.add.text(480, 220, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#f5ead1'
        }).setOrigin(0.5);
        this.playButton = this.makeButton(480, 306, 'JUGAR', () => {
            const player = getCurrentPlayer();
            this.scene.start('Instructions', { playerName: player.alias });
        }, true, 290);
        this.profileButton = this.makeButton(390, 376, 'MI PERFIL', () => {
            this.scene.start('Profile');
        }, false, 210);
        this.logoutButton = this.makeButton(620, 376, 'CERRAR SESIÓN', () => this.endSession(), false, 210);
        this.loggedButtons = [this.playButton, this.profileButton, this.logoutButton];

        this.add.text(480, 476, 'Salta los huecos · protege la mina · vuelve a intentarlo', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#a99b78'
        }).setOrigin(0.5);
        this.setLoggedIn(Boolean(this.player));
        this.events.once('shutdown', this.onShutdown, this);

        if (!this.player) this.restoreSession();
    }

    async restoreSession() {
        try {
            const player = await restoreLogin();
            if (player && this.scene.isActive()) {
                this.player = player;
                this.setLoggedIn(true);
            }
        } catch (error) {
            this.setStatus(`No se pudo verificar la sesión: ${error.message}`, true);
        }
    }

    async authenticate(createAccount) {
        if (this.isBusy) return;
        const alias = this.aliasInput.node.value.trim();
        const password = this.passwordInput.node.value;
        if (!alias || !password) {
            this.setStatus('Escribe tu alias y contraseña.', true);
            return;
        }

        this.isBusy = true;
        this.passwordInput.node.autocomplete = createAccount ? 'new-password' : 'current-password';
        this.setStatus(createAccount ? 'Creando cuenta…' : 'Iniciando sesión…');
        try {
            if (createAccount) await registerPlayer(alias, password);
            const player = await login(alias, password);
            this.player = player;
            this.passwordInput.node.value = '';
            this.setLoggedIn(true);
        } catch (error) {
            this.setStatus(error.message, true);
        } finally {
            this.isBusy = false;
        }
    }

    async endSession() {
        if (this.isBusy) return;
        this.isBusy = true;
        this.setStatus('Cerrando sesión…');
        try {
            await logout();
            this.player = null;
            this.setLoggedIn(false);
            this.aliasInput.node.value = '';
            this.passwordInput.node.value = '';
            this.setStatus('Sesión cerrada.');
        } catch (error) {
            this.player = null;
            this.setLoggedIn(false);
            this.setStatus(error.message, true);
        } finally {
            this.isBusy = false;
        }
    }

    setLoggedIn(loggedIn) {
        this.aliasInput.setVisible(!loggedIn);
        this.passwordInput.setVisible(!loggedIn);
        [...this.authButtons, ...this.loggedButtons].forEach((button) => {
            button.setVisible(this.authButtons.includes(button) ? !loggedIn : loggedIn);
            button.getData('label')?.setVisible(button.visible);
        });
        this.welcomeText.setVisible(loggedIn);
        if (loggedIn) {
            this.welcomeText.setText(`Bienvenido, ${this.player.alias.slice(0, 24)}`);
            this.setStatus('');
        }
    }

    setStatus(message, isError = false) {
        if (!this.authStatus?.active) return;
        this.authStatus.setColor(isError ? '#ff9a82' : '#d0d9de').setText(message);
    }

    onShutdown() {
        this.aliasInput?.destroy();
        this.passwordInput?.destroy();
    }

    drawBackdrop() {
        this.cameras.main.setBackgroundColor('#15130f');
        const art = this.add.graphics();
        art.fillGradientStyle(0x28251c, 0x28251c, 0x12130f, 0x12130f, 1);
        art.fillRect(0, 0, 960, 540);
        art.fillStyle(0x393126, 1);
        art.fillTriangle(0, 394, 220, 218, 470, 394);
        art.fillTriangle(340, 394, 645, 196, 960, 394);
        art.fillStyle(0x514330, 1);
        art.fillTriangle(0, 422, 260, 282, 495, 422);
        art.fillTriangle(390, 416, 690, 254, 960, 416);
        art.fillStyle(0x493923, 1);
        art.fillRect(0, 420, 960, 120);
        art.fillStyle(0xb3945c, 1);
        art.fillRect(0, 419, 960, 4);
        for (let x = -20; x < 1000; x += 54) {
            art.fillStyle(0x342d25, 1);
            art.fillRoundedRect(x, 426, 8, 24, 2);
        }
    }

    makeButton(x, y, label, callback, primary = false, width = 250) {
        const button = this.add.rectangle(x, y, width, 48, primary ? 0x8e6237 : 0x302d25)
            .setStrokeStyle(1, primary ? 0xe7a261 : 0x857956)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f5ead1',
            letterSpacing: 1
        }).setOrigin(0.5);
        button.on('pointerdown', callback);
        button.on('pointerover', () => text.setColor('#ffdf9a'));
        button.on('pointerout', () => text.setColor('#f5ead1'));
        button.setData('label', text);
        button.setVisible(false);
        return button;
    }
}
