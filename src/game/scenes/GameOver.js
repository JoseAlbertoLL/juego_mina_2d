import { Scene } from 'phaser';
import { getCurrentPlayer } from '../api/authStore';
import { getRanking } from '../api/playersApi';
import { submitScore } from '../api/scoreApi';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data) {
        this.result = {
            playerName: data.playerName || getCurrentPlayer()?.alias || 'Minero',
            time: Number(data.time) || 0,
            lives: Number(data.lives) || 0,
            birds: Number(data.birds) || 0,
            score: Number(data.score) || 0
        };
        this.resultSaved = false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#171811');
        this.add.rectangle(480, 270, 884, 480, 0x211f19, 0.97)
            .setStrokeStyle(1, 0x89764c, 0.9);
        this.add.text(480, 49, 'DUSTY', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#e5c27d',
            letterSpacing: 3
        }).setOrigin(0.5);
        this.titleText = this.add.text(480, 89, 'FIN DE LA CARRERA', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#f4d28d',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.add.text(480, 133, this.result.playerName.toUpperCase(), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#c4b998',
            letterSpacing: 2
        }).setOrigin(0.5);
        this.add.text(480, 175, `${this.result.score} PTS`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffcb75'
        }).setOrigin(0.5);

        const minutes = Math.floor(this.result.time / 60).toString().padStart(2, '0');
        const seconds = (this.result.time % 60).toString().padStart(2, '0');
        this.add.text(480, 211, `TIEMPO  ${minutes}:${seconds}     AVES  ${this.result.birds}     VIDAS  ${this.result.lives}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#d0d9de'
        }).setOrigin(0.5);

        this.add.rectangle(480, 248, 700, 1, 0x65583d, 0.8);
        this.add.text(480, 270, 'TOP 10 MINEROS', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#e5ad68',
            letterSpacing: 1
        }).setOrigin(0.5);
        this.saveStatus = this.add.text(480, 292, 'Guardando partida…', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#a99b78',
            align: 'center'
        }).setOrigin(0.5);
        this.leaderboardText = this.add.text(480, 313, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#d0d9de',
            align: 'center',
            lineSpacing: 2
        }).setOrigin(0.5, 0);

        this.makeButton(330, 471, 'JUGAR OTRA VEZ', () => {
            const player = getCurrentPlayer();
            this.scene.start('Instructions', { playerName: player?.alias || this.result.playerName });
        }, true, 250);
        this.makeButton(630, 471, 'MENÚ PRINCIPAL', () => this.scene.start('MainMenu'), false, 230);
        this.loadResults();
    }

    async loadResults() {
        try {
            const response = await submitScore(this.result.score);
            this.resultSaved = true;
            if (!this.scene.isActive()) return;
            this.saveStatus.setColor(response?.nuevoRecord ? '#f4d28d' : '#b2c68d');
            this.saveStatus.setText(response?.nuevoRecord ? '¡NUEVO RÉCORD PERSONAL!' : 'Partida guardada.');
            if (response?.nuevoRecord) {
                this.titleText.setText('¡NUEVO RÉCORD!');
                this.tweens.add({
                    targets: this.titleText,
                    scale: { from: 1, to: 1.08 },
                    duration: 450,
                    yoyo: true,
                    repeat: 1
                });
            }
        } catch (error) {
            if (!this.scene.isActive()) return;
            this.saveStatus.setColor('#ff9a82').setText(`No se guardó la partida: ${error.message}`);
        }

        try {
            const ranking = await getRanking(0, 10);
            if (!this.scene.isActive()) return;
            this.leaderboardText.setText(this.formatLeaderboard(ranking.content));
        } catch (error) {
            if (!this.scene.isActive()) return;
            const current = this.saveStatus.text;
            this.saveStatus.setColor('#ff9a82').setText(`${current}  ·  Ranking: ${error.message}`);
        }
    }

    formatLeaderboard(players) {
        if (!players.length) return 'Todavía no hay puntuaciones.';
        return players.map((player, index) => {
            const rank = `${index + 1}`.padStart(2, '0');
            const alias = String(player.alias || 'Minero').slice(0, 18);
            const score = player.record === null || player.record === undefined
                ? '—'
                : `${player.record} pts`;
            return `${rank}   ${alias.padEnd(18, ' ')}   ${score}`;
        }).join('\n');
    }

    makeButton(x, y, label, callback, primary, width) {
        const button = this.add.rectangle(x, y, width, 44, primary ? 0x8e6237 : 0x302d25)
            .setStrokeStyle(1, primary ? 0xe7a261 : 0x857956)
            .setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fff2d6'
        }).setOrigin(0.5);
        button.on('pointerdown', callback);
        button.on('pointerover', () => text.setColor('#ffe09e'));
        button.on('pointerout', () => text.setColor('#fff2d6'));
    }
}
