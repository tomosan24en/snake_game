"use strict";

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const TILE_SIZE = 20;
const FIELD_SIZE = 20;

class Position {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    shift(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    move(direction) {
        this.x += direction.x;
        this.y += direction.y;
        return this;
    }

    copy() {
        return new Position(this.x, this.y);
    }

    equals(position) {
        return (position.x == this.x) && (position.y == this.y);
    }
}

function drawTile(position, color) {
    context.fillStyle = color;
    context.fillRect(10 + position.x * TILE_SIZE, 10 + position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawApple(position) {
    context.fillStyle = "red";
    context.fillRect(12 + position.x * TILE_SIZE, 14 + position.y * TILE_SIZE, TILE_SIZE - 4, TILE_SIZE - 6);
    context.fillStyle = "brown";
    context.fillRect(19 + position.x * TILE_SIZE, 10 + position.y * TILE_SIZE, 2, 6);
}

const directions = Object.freeze({
    right: {x: 1, y: 0, keyCode: "ArrowRight", order: 0},
    up: {x: 0, y: -1, keyCode: "ArrowUp", order: 1},
    left: {x: -1, y: 0, keyCode: "ArrowLeft", order: 2},
    down: {x: 0, y: 1, keyCode: "ArrowDown", order: 3},
});

const keyCodeToDirection = Object.freeze({
    "ArrowUp": directions.up,
    "ArrowDown": directions.down,
    "ArrowLeft": directions.left,
    "ArrowRight": directions.right,
});

class Snake {
    #headPosition;
    #bodyPositions;
    #tailPosition;

    constructor(headPosition, tailPosition) {
        this.#headPosition = headPosition;
        this.#tailPosition = tailPosition;
        this.#bodyPositions = [];
    }

    draw() {
        drawTile(this.#headPosition, "lime");
        for (const bodyPosition of this.#bodyPositions) {
            drawTile(bodyPosition, "green");
        }
        drawTile(this.#tailPosition, "green");
    }

    move(direction) {
        this.#bodyPositions.unshift(this.#headPosition.copy());
        this.#tailPosition = this.#bodyPositions[this.#bodyPositions.length - 1];
        this.#bodyPositions.splice(this.#bodyPositions.length - 1, 1);
        this.#headPosition = this.#headPosition.move(direction);
    }

    moveExtend(direction) {
        this.#bodyPositions.unshift(this.#headPosition.copy());
        this.#headPosition = this.#headPosition.move(direction);
    }

    getLength() {
        return this.#bodyPositions.length + 2;
    }

    contains(position) {
        if (position.equals(this.#headPosition) || position.equals(this.#tailPosition)) {
            return true;
        }
        return this.containsBody(position);
    }

    containsBody(position) {
        for (const bodyPosition of this.#bodyPositions) {
            if (position.equals(bodyPosition)) {
                return true;
            }
        }
        return false;
    }

    getHeadPosition() {
        return this.#headPosition;
    }

    getTailPosition() {
        return this.#tailPosition;
    }
}

function resetScreen() {
    context.fillStyle = "white";
    context.fillRect(0, 0, 400, 400);
    context.fillStyle = "black";
    context.fillRect(10, 10, 380, 380);
}

class Game {
    #width;
    #height;
    #snake;
    #apples;
    #direction;
    #intervalId;
    #boundKeyListener;
    #score;

    constructor() {
        this.#width = 19;
        this.#height = 19;
    }

    start() {
        this.#snake = new Snake(new Position(9, 9), new Position(9, 10));
        this.#apples = [];
        this.#direction = directions.up;
        this.#boundKeyListener = this.keyListener.bind(this);
        document.body.addEventListener("keydown", this.#boundKeyListener);
        this.#intervalId = setInterval(this.update.bind(this), 200);
        this.spawnApple();
        this.#score = 0;
        this.draw();
    }

    spawnApple() {
        while (true) {
            const x = Math.floor(Math.random() * this.#width);
            const y = Math.floor(Math.random() * this.#height);
            const position = new Position(x, y);
            if (this.#snake.contains(position)) {
                continue;
            }
            if (this.#apples.some(apple => apple.equals(position))) {
                continue;
            }
            this.#apples.push(position);
            break;
        }
    }

    draw() {
        resetScreen();
        this.#snake.draw();
        for (const apple of this.#apples) {
            drawApple(apple, "red");
        }
    }

    isOutOfBorder(position) {
        return (position.x < 0) || (position.x >= this.#width)
            || (position.y < 0) || (position.y >= this.#height);
    }

    update() {
        const nextHeadPosition = this.#snake.getHeadPosition().copy().move(this.#direction);
        if (this.#snake.containsBody(nextHeadPosition)) {
            this.gameOver();
            return;
        }
        if (this.isOutOfBorder(nextHeadPosition)) {
            this.gameOver();
            return;
        }
        let eatAplle = false;
        for (let i = 0; i < this.#apples.length; i++) {
            if (this.#apples[i].equals(nextHeadPosition)) {
                eatAplle = true;
                this.#apples.splice(i, 1);
                break;
            }
        }
        if (eatAplle) {
            this.#snake.moveExtend(this.#direction);
            this.spawnApple();
            this.#score++;
        } else {
            this.#snake.move(this.#direction);
        }
        this.draw();
    }

    keyListener(e) {
        const keyCode = e.code;
        if (!(keyCode in keyCodeToDirection)) {
            return;
        }
        const direction = keyCodeToDirection[keyCode];
        if (Math.abs(direction.order - this.#direction.order) % 4 == 2) {
            return;
        }
        this.#direction = direction;
    }

    gameOver() {
        document.body.removeEventListener("keydown", this.#boundKeyListener);
        clearInterval(this.#intervalId);
        context.fillStyle = "white";
        context.fillText("GAME OVER", 100, 180);
        context.fillText(`Score : ${this.#score}`, 100, 220);
    }
}

const game = new Game();
game.start();