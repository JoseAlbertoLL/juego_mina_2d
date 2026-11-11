import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { Preloader } from './scenes/Preloader';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Instructions } from './scenes/Instructions';
import { Profile } from './scenes/Profile';
import { Pause } from './scenes/Pause';
import { AUTO, Game, Scale } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 960,
    height: 540,
    parent: 'game-container',
    backgroundColor: '#131820',
    dom: {
        createContainer: true
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0
            }
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Instructions,
        Profile,
        MainGame,
        Pause,
        GameOver
    ]
    
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;
