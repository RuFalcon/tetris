document.addEventListener('DOMContentLoaded', () => {
    // Константы и настройки
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 25;
    const EMPTY = 'empty';
    
    // Скорость игры (мс)
    let dropInterval = 1000;
    const levelThreshold = 10; // Линий для перехода на следующий уровень
    
    // Фигуры (тетромино)
    const PIECES = [
        // I
        {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 0
        },
        // J
        {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 1
        },
        // L
        {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 2
        },
        // O
        {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 3
        },
        // S
        {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 4
        },
        // T
        {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 5
        },
        // Z
        {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 6
        }
    ];
    
    // Состояние игры
    let board = [];
    let score = 0;
    let level = 1;
    let lines = 0;
    let currentPiece = null;
    let nextPiece = null;
    let gameTimerId = null;
    let isGameOver = false;
    let isPaused = false;
    let ghostPiece = null;
    
    // Элементы DOM
    const boardElement = document.getElementById('tetris-board');
    const nextPieceDisplay = document.getElementById('next-piece-display');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const pausedOverlay = document.getElementById('paused-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreElement = document.getElementById('final-score');
    
    // Создание игрового поля
    function createBoard() {
        boardElement.style.width = `${COLS * BLOCK_SIZE}px`;
        boardElement.style.height = `${ROWS * BLOCK_SIZE}px`;
        boardElement.style.position = 'relative';
        
        nextPieceDisplay.style.position = 'relative';
        
        // Инициализация пустой доски
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    }
    
    // Создание новой фигуры
    function createNewPiece() {
        if (!nextPiece) {
            nextPiece = getRandomPiece();
        }
        
        currentPiece = nextPiece;
        nextPiece = getRandomPiece();
        
        // Начальная позиция фигуры
        currentPiece.x = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
        currentPiece.y = 0;
        
        // Если новая фигура сразу сталкивается, игра окончена
        if (checkCollision()) {
            gameOver();
            return false;
        }
        
        updateGhostPiece();
        drawNextPiece();
        return true;
    }
    
    // Получение случайной фигуры
    function getRandomPiece() {
        const pieceIndex = Math.floor(Math.random() * PIECES.length);
        const piece = JSON.parse(JSON.stringify(PIECES[pieceIndex]));
        piece.x = 0;
        piece.y = 0;
        return piece;
    }
    
    // Обновление позиции призрачной фигуры
    function updateGhostPiece() {
        if (!currentPiece) return;
        
        ghostPiece = JSON.parse(JSON.stringify(currentPiece));
        
        // Двигаем призрачную фигуру вниз до столкновения
        while (!checkCollision(ghostPiece, 0, 1)) {
            ghostPiece.y += 1;
        }
    }
    
    // Отрисовка призрачной фигуры
    function drawGhostPiece() {
        if (!ghostPiece) return;
        
        // Удаляем старые блоки призрачной фигуры
        document.querySelectorAll('.ghost').forEach(cell => cell.remove());
        
        // Рисуем новую призрачную фигуру
        ghostPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const ghostX = ghostPiece.x + x;
                    const ghostY = ghostPiece.y + y;
                    
                    if (ghostY >= 0) {
                        const cell = document.createElement('div');
                        cell.classList.add('tetromino', `color-${ghostPiece.color}`, 'ghost');
                        cell.style.left = `${ghostX * BLOCK_SIZE}px`;
                        cell.style.top = `${ghostY * BLOCK_SIZE}px`;
                        boardElement.appendChild(cell);
                    }
                }
            });
        });
    }
    
    // Отрисовка следующей фигуры
    function drawNextPiece() {
        // Очищаем предыдущее отображение
        while (nextPieceDisplay.firstChild) {
            nextPieceDisplay.removeChild(nextPieceDisplay.firstChild);
        }
        
        if (!nextPiece) return;
        
        // Рассчитываем смещение для центрирования
        const pieceHeight = nextPiece.shape.length;
        const pieceWidth = nextPiece.shape[0].length;
        const offsetX = (120 - pieceWidth * BLOCK_SIZE) / 2;
        const offsetY = (120 - pieceHeight * BLOCK_SIZE) / 2;
        
        // Рисуем фигуру
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const cell = document.createElement('div');
                    cell.classList.add('tetromino', `color-${nextPiece.color}`);
                    cell.style.left = `${offsetX + x * BLOCK_SIZE}px`;
                    cell.style.top = `${offsetY + y * BLOCK_SIZE}px`;
                    nextPieceDisplay.appendChild(cell);
                }
            });
        });
    }
    
    // Отрисовка текущей фигуры
    function drawPiece() {
        // Удаляем старые блоки текущей фигуры
        document.querySelectorAll('.tetromino:not(.ghost)').forEach(cell => {
            if (!cell.classList.contains('placed')) {
                cell.remove();
            }
        });
        
        if (!currentPiece) return;
        
        // Рисуем новую текущую фигуру
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const pieceX = currentPiece.x + x;
                    const pieceY = currentPiece.y + y;
                    
                    if (pieceY >= 0) {
                        const cell = document.createElement('div');
                        cell.classList.add('tetromino', `color-${currentPiece.color}`);
                        cell.style.left = `${pieceX * BLOCK_SIZE}px`;
                        cell.style.top = `${pieceY * BLOCK_SIZE}px`;
                        boardElement.appendChild(cell);
                    }
                }
            });
        });
        
        // Рисуем призрачную фигуру
        drawGhostPiece();
    }
    
    // Проверка столкновений
    function checkCollision(piece = currentPiece, offsetX = 0, offsetY = 0) {
        if (!piece) return false;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    
                    // Проверка на выход за границы поля
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    // Проверка на столкновение с уже размещенными блоками
                    if (newY >= 0 && board[newY][newX] !== EMPTY) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Размещение фигуры на доске
    function placePiece() {
        if (!currentPiece) return;
        
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = currentPiece.y + y;
                    const boardX = currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        board[boardY][boardX] = currentPiece.color;
                        
                        // Добавляем размещенные блоки на доску
                        const cell = document.createElement('div');
                        cell.classList.add('tetromino', `color-${currentPiece.color}`, 'placed');
                        cell.style.left = `${boardX * BLOCK_SIZE}px`;
                        cell.style.top = `${boardY * BLOCK_SIZE}px`;
                        boardElement.appendChild(cell);
                    }
                }
            });
        });
        
        // Очищаем заполненные линии
        clearLines();
        
        // Создаем новую фигуру
        return createNewPiece();
    }
    
    // Очистка заполненных линий
    function clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            // Проверяем, заполнена ли линия
            const isLineComplete = board[y].every(cell => cell !== EMPTY);
            
            if (isLineComplete) {
                linesCleared++;
                
                // Сдвигаем все линии выше текущей вниз
                for (let yy = y; yy > 0; yy--) {
                    for (let x = 0; x < COLS; x++) {
                        board[yy][x] = board[yy - 1][x];
                    }
                }
                
                // Очищаем верхнюю линию
                board[0].fill(EMPTY);
                
                // Сдвигаем линию обратно для повторной проверки
                y++;
                
                // Перерисовываем доску
                redrawBoard();
            }
        }
        
        // Обновляем счет и уровень
        if (linesCleared > 0) {
            // Разные награды за разное количество линий
            const points = [0, 40, 100, 300, 1200][linesCleared] * level;
            score += points;
            lines += linesCleared;
            
            // Обновляем уровень
            level = Math.floor(lines / levelThreshold) + 1;
            
            // Обновляем скорость
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            
            // Обновляем интерфейс
            updateUI();
        }
    }
    
    // Перерисовка всего игрового поля
    function redrawBoard() {
        // Удаляем все размещенные блоки
        document.querySelectorAll('.placed').forEach(cell => cell.remove());
        
        // Перерисовываем доску на основе массива board
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] !== EMPTY) {
                    const cell = document.createElement('div');
                    cell.classList.add('tetromino', `color-${board[y][x]}`, 'placed');
                    cell.style.left = `${x * BLOCK_SIZE}px`;
                    cell.style.top = `${y * BLOCK_SIZE}px`;
                    boardElement.appendChild(cell);
                }
            }
        }
    }
    
    // Обновление интерфейса
    function updateUI() {
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        finalScoreElement.textContent = score;
    }
    
    // Движение фигуры вниз
    function moveDown() {
        if (!currentPiece) return false;
        
        if (!checkCollision(currentPiece, 0, 1)) {
            currentPiece.y++;
            updateGhostPiece();
            drawPiece();
            return true;
        } else {
            // Размещаем фигуру, если дальше двигаться нельзя
            return placePiece();
        }
    }
    
    // Движение фигуры влево
    function moveLeft() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        if (!checkCollision(currentPiece, -1, 0)) {
            currentPiece.x--;
            updateGhostPiece();
            drawPiece();
        }
    }
    
    // Движение фигуры вправо
    function moveRight() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        if (!checkCollision(currentPiece, 1, 0)) {
            currentPiece.x++;
            updateGhostPiece();
            drawPiece();
        }
    }
    
    // Вращение фигуры
    function rotatePiece() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        // Создаем копию текущей фигуры
        const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
        
        // Вращаем фигуру (транспонируем и переворачиваем строки)
        const rows = currentPiece.shape.length;
        const cols = currentPiece.shape[0].length;
        
        // Транспонирование
        currentPiece.shape = currentPiece.shape[0].map((_, colIndex) => 
            currentPiece.shape.map(row => row[colIndex])
        );
        
        // Переворот каждой строки
        currentPiece.shape = currentPiece.shape.map(row => [...row].reverse());
        
        // Если вращение приводит к столкновению, откатываем изменения
        if (checkCollision()) {
            // Поиск возможных позиций (wall kick)
            const kicks = [
                [0, 0], [-1, 0], [1, 0], [0, -1], // Базовые смещения
                [-1, -1], [1, -1], // Дополнительные смещения
                [-2, 0], [2, 0] // Расширенные смещения для I-фигуры
            ];
            
            let validKickFound = false;
            
            for (const [kickX, kickY] of kicks) {
                currentPiece.x += kickX;
                currentPiece.y += kickY;
                
                if (!checkCollision()) {
                    validKickFound = true;
                    break;
                }
                
                // Возвращаем исходную позицию для следующей проверки
                currentPiece.x -= kickX;
                currentPiece.y -= kickY;
            }
            
            // Если не найдено подходящее смещение, отменяем вращение
            if (!validKickFound) {
                currentPiece.shape = originalShape;
            }
        }
        
        updateGhostPiece();
        drawPiece();
    }
    
    // Моментальное падение фигуры
    function hardDrop() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        while (!checkCollision(currentPiece, 0, 1)) {
            currentPiece.y++;
        }
        
        placePiece();
        drawPiece();
    }
    
    // Игровой цикл
    function gameLoop() {
        if (isPaused || isGameOver) return;
        
        if (!moveDown()) {
            // Если фигура не может двигаться вниз и новая не может быть создана
            if (!currentPiece) {
                gameOver();
            }
        }
        
        // Перезапускаем таймер
        clearTimeout(gameTimerId);
        gameTimerId = setTimeout(gameLoop, dropInterval);
    }
    
    // Функция паузы
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
        pausedOverlay.style.display = isPaused ? 'flex' : 'none';
        
        if (!isPaused) {
            gameTimerId = setTimeout(gameLoop, dropInterval);
        } else {
            clearTimeout(gameTimerId);
        }
    }
    
    // Функция окончания игры
    function gameOver() {
        isGameOver = true;
        clearTimeout(gameTimerId);
        gameOverOverlay.style.display = 'flex';
    }
    
    // Функция начала игры
    function startGame() {
        // Сбрасываем состояние игры
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        isGameOver = false;
        isPaused = false;
        
        // Очищаем доску
        while (boardElement.firstChild) {
            boardElement.removeChild(boardElement.firstChild);
        }
        
        // Скрываем оверлеи
        pausedOverlay.style.display = 'none';
        gameOverOverlay.style.display = 'none';
        
        // Обновляем интерфейс
        updateUI();
        
        // Создаем новые фигуры
        nextPiece = null;
        createNewPiece();
        
        // Запускаем игровой цикл
        clearTimeout(gameTimerId);
        gameTimerId = setTimeout(gameLoop, dropInterval);
    }
    
    // Обработчики событий
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft':
                moveLeft();
                break;
            case 'ArrowRight':
                moveRight();
                break;
            case 'ArrowDown':
                if (!isPaused && !isGameOver) moveDown();
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case 'Space':
                hardDrop();
                break;
            case 'KeyP':
                togglePause();
                break;
        }
    });
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Инициализация игры
    createBoard();
});