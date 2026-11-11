import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    const game = StartGame('game-container');
    window.addEventListener('dusty:session-expired', () => {
        for (const sceneKey of ['Pause', 'Game', 'Instructions', 'Profile', 'GameOver']) {
            if (game.scene.isActive(sceneKey)) game.scene.stop(sceneKey);
        }
        if (game.scene.isActive('MainMenu')) {
            game.scene.restart('MainMenu');
        } else {
            game.scene.start('MainMenu');
        }
    });

});