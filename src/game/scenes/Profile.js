import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { logout } from '../api/authApi';
import { getCurrentPlayer, updateCurrentPlayer } from '../api/authStore';
import { getPlayerGames, getPlayerProfile, updatePlayerAlias, updatePlayerPassword } from '../api/playersApi';

const INPUT_STYLE = {
    width: '290px',
    height: '42px',
    padding: '0 12px',
    border: '1px solid #857956',
    'border-radius': '8px',
    outline: 'none',
    background: '#25251e',
    color: '#f5ead1',
    'font-family': 'Arial, sans-serif',
    'font-size': '15px',
    'box-sizing': 'border-box'
};

export class Profile extends Scene {
    constructor() {
        super('Profile');
    }

    create() {
        this.player = getCurrentPlayer();
        if (!this.player) {
            this.scene.start('MainMenu');
            return;
        }

        this.cameras.main.setBackgroundColor('#171811');
        this.drawBackground();
        this.add.rectangle(480, 270, 730, 430, 0x211f19, 0.96)
            .setStrokeStyle(1, 0x89764c, 0.95);
        this.add.text(480, 84, 'PERFIL DEL MINERO', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#e8ca85',
            letterSpacing: 2
        }).setOrigin(0.5);

        this.avatar = this.add.circle(220, 166, 35, 0x473b28).setStrokeStyle(2, 0xa5864f);
        this.avatarLetter = this.add.text(220, 166, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#e8ca85'
        }).setOrigin(0.5);
        this.add.text(282, 139, 'USUARIO', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#a99b78',
            letterSpacing: 2
        });
        this.aliasText = this.add.text(282, 162, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '23px',
            fontStyle: 'bold',
            color: '#f5ead1'
        });
        this.createdText = this.add.text(282, 193, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#c4b998'
        });
        this.recordText = this.add.text(282, 215, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#e8ca85'
        });

        this.add.rectangle(480, 247, 590, 1, 0x65583d, 0.8);
        this.statusText = this.add.text(480, 267, 'Cargando perfil e historial…', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#c4b998',
            align: 'center',
            wordWrap: { width: 610 }
        }).setOrigin(0.5);
        this.historyText = this.add.text(480, 286, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#d8d0bc',
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5, 0);

        this.makeButton(280, 399, 'CAMBIAR ALIAS', () => this.showAliasForm(), false, 210);
        this.makeButton(510, 399, 'CAMBIAR CONTRASEÑA', () => this.showPasswordForm(), false, 240);
        this.makeButton(745, 399, 'CERRAR SESIÓN', () => this.endSession(), false, 180);
        this.makeButton(480, 467, 'VOLVER', () => this.scene.start('MainMenu'), true, 180);
        this.loadProfile();
    }

    async loadProfile() {
        try {
            const [profile, games] = await Promise.all([
                getPlayerProfile(this.player.id),
                getPlayerGames(this.player.id)
            ]);
            if (!this.scene.isActive()) return;
            this.player = updateCurrentPlayer(profile);
            this.updateProfileDisplay();
            this.historyText.setText(this.formatGames(games));
            this.statusText.setText(`ÚLTIMAS ${games.length} PARTIDAS`);
        } catch (error) {
            if (this.scene.isActive()) {
                this.statusText.setColor('#ff9a82').setText(error.message);
            }
        }
    }

    updateProfileDisplay() {
        this.avatarLetter.setText(this.player.alias.slice(0, 1).toUpperCase());
        this.aliasText.setText(this.player.alias.slice(0, 24));
        this.createdText.setText(`MIEMBRO DESDE  ${this.formatDate(this.player.fechaRegistro)}`);
        const record = this.player.record === null || this.player.record === undefined
            ? 'Sin récord todavía'
            : `RÉCORD PERSONAL  ${this.player.record} PTS`;
        this.recordText.setText(record);
    }

    formatGames(games) {
        if (!games.length) return 'Todavía no tienes partidas registradas.';
        return games.slice(0, 10).map((game) => {
            const date = this.formatDate(game.fecha);
            return `${date}   ·   ${Number(game.puntuacion) || 0} pts`;
        }).join('\n');
    }

    showAliasForm() {
        if (this.formOverlay) return;
        this.openForm('CAMBIAR ALIAS', 'Elige un alias para tu cuenta.', 'Nuevo alias');
        this.formInput.node.type = 'text';
        this.formInput.node.maxLength = 80;
        this.formInput.node.autocomplete = 'username';
        this.formInput.node.value = this.player.alias;
        this.makeButton(385, 340, 'GUARDAR', () => this.saveAlias(), true, 150, this.formOverlay);
        this.makeButton(575, 340, 'CANCELAR', () => this.closeForm(), false, 150, this.formOverlay);
    }

    async saveAlias() {
        const alias = this.formInput.node.value.trim();
        if (!alias) {
            this.formError.setText('Escribe un alias.');
            return;
        }
        this.formError.setText('Guardando…');
        try {
            const response = await updatePlayerAlias(this.player.id, alias);
            if (!this.scene.isActive()) return;
            const updated = { ...this.player, ...response, alias: response?.alias || alias };
            this.player = updateCurrentPlayer(updated);
            this.closeForm();
            this.updateProfileDisplay();
            this.statusText.setColor('#b2c68d').setText('Alias actualizado.');
        } catch (error) {
            if (this.scene.isActive()) this.formError.setText(error.message);
        }
    }

    showPasswordForm() {
        if (this.formOverlay) return;
        this.openForm(
            'CAMBIAR CONTRASEÑA',
            'La nueva contraseña debe ser diferente a la actual.',
            'Nueva contraseña (mín. 8 caracteres)'
        );
        this.formInput.node.type = 'password';
        this.formInput.node.autocomplete = 'new-password';
        this.confirmInput = this.add.dom(480, 293).createElement('input', INPUT_STYLE);
        this.confirmInput.node.type = 'password';
        this.confirmInput.node.placeholder = 'Repite la contraseña';
        this.confirmInput.node.autocomplete = 'new-password';
        this.makeButton(385, 350, 'GUARDAR', () => this.savePassword(), true, 150, this.formOverlay);
        this.makeButton(575, 350, 'CANCELAR', () => this.closeForm(), false, 150, this.formOverlay);
    }

    async savePassword() {
        const password = this.formInput.node.value;
        if (password.length < 8) {
            this.formError.setText('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== this.confirmInput.node.value) {
            this.formError.setText('Las contraseñas no coinciden.');
            return;
        }

        this.formError.setText('Guardando…');
        try {
            await updatePlayerPassword(this.player.id, password);
            if (!this.scene.isActive()) return;
            this.closeForm();
            this.statusText.setColor('#b2c68d').setText(
                'Contraseña actualizada. Si tu sesión vence, inicia sesión con la nueva contraseña.'
            );
        } catch (error) {
            if (this.scene.isActive()) this.formError.setText(error.message);
        }
    }

    openForm(title, description, placeholder) {
        this.formOverlay = this.add.container(0, 0).setDepth(10);
        this.formOverlay.add(this.add.rectangle(480, 270, 960, 540, 0x080a08, 0.82));
        this.formOverlay.add(
            this.add.rectangle(480, 270, 500, 300, 0x25231c, 1).setStrokeStyle(1, 0xa5864f)
        );
        this.formOverlay.add(this.add.text(480, 174, title, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#e8ca85'
        }).setOrigin(0.5));
        this.formOverlay.add(this.add.text(480, 211, description, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#c4b998',
            align: 'center',
            wordWrap: { width: 430 }
        }).setOrigin(0.5));

        this.formInput = this.add.dom(480, 250).createElement('input', INPUT_STYLE);
        this.formInput.node.placeholder = placeholder;
        this.formError = this.add.text(480, 387, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#ff9a82',
            align: 'center',
            wordWrap: { width: 440 }
        }).setOrigin(0.5).setDepth(12);
        this.formOverlay.add(this.formError);
    }

    closeForm() {
        this.formInput?.destroy();
        this.confirmInput?.destroy();
        this.formOverlay?.destroy(true);
        this.formOverlay = null;
        this.formInput = null;
        this.confirmInput = null;
    }

    async endSession() {
        this.statusText.setColor('#c4b998').setText('Cerrando sesión…');
        try {
            await logout();
            if (this.scene.isActive()) this.scene.start('MainMenu');
        } catch (error) {
            if (this.scene.isActive()) this.statusText.setColor('#ff9a82').setText(error.message);
        }
    }

    drawBackground() {
        const art = this.add.graphics().setDepth(-1);
        art.fillGradientStyle(0x302a1e, 0x302a1e, 0x11130f, 0x11130f, 1);
        art.fillRect(0, 0, 960, 540);
        art.fillStyle(0x51412b, 0.3);
        for (let i = 0; i < 38; i++) {
            const x = Phaser.Math.Between(0, 960);
            const y = Phaser.Math.Between(30, 520);
            const radius = Phaser.Math.Between(8, 36);
            art.fillEllipse(x, y, radius * 2, radius);
        }
    }

    formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'fecha no disponible';
        return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date);
    }

    makeButton(x, y, label, callback, primary, width = 250, container = null) {
        const button = this.add.rectangle(x, y, width, 44, primary ? 0x8e6237 : 0x302d25)
            .setStrokeStyle(1, 0x9e8957)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#f5ead1',
            letterSpacing: 1
        }).setOrigin(0.5);
        if (container) {
            container.add([button, text]);
            button.setDepth(11);
            text.setDepth(12);
        }
        button.on('pointerdown', callback);
        button.on('pointerover', () => text.setColor('#ffdf9a'));
        button.on('pointerout', () => text.setColor('#f5ead1'));
        return button;
    }
}
