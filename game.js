document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const statusText = document.getElementById('status-text');
    const newGameBtn = document.getElementById('new-game-btn');

    let bigBoard = createBigBoard();
    let currentPlayer = 'X';
    let overallWinner = ' ';
    let nextBoardRow = -1;
    let nextBoardCol = -1;
    let isAITurn = false;
    let moveCount = 0;
    const depth = 7; // AI difficulty depth

    function createSmallBoard() {
        return {
            grid: Array(3).fill(null).map(() => Array(3).fill(' ')),
            winner: ' ',
            isFull: false,
        };
    }

    function createBigBoard() {
        return Array(3).fill(null).map(() => Array(3).fill(null).map(() => createSmallBoard()));
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const smallBoardElement = document.createElement('div');
                smallBoardElement.classList.add('small-board');

                if ((br === nextBoardRow && bc === nextBoardCol) || (nextBoardRow === -1 && nextBoardCol === -1)) {
                    if (bigBoard[br][bc].winner === ' ') {
                       smallBoardElement.classList.add('active');
                    }
                }
                
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const cellElement = document.createElement('div');
                        cellElement.classList.add('cell');
                        cellElement.dataset.br = br;
                        cellElement.dataset.bc = bc;
                        cellElement.dataset.r = r;
                        cellElement.dataset.c = c;
                        cellElement.textContent = bigBoard[br][bc].grid[r][c];
                         if (bigBoard[br][bc].grid[r][c] !== ' ') {
                            cellElement.classList.add(bigBoard[br][bc].grid[r][c]);
                        }
                        smallBoardElement.appendChild(cellElement);
                    }
                }
                
                if (bigBoard[br][bc].winner !== ' ') {
                    const winnerOverlay = document.createElement('div');
                    winnerOverlay.classList.add('winner-overlay');
                    winnerOverlay.textContent = bigBoard[br][bc].winner;
                    winnerOverlay.classList.add(bigBoard[br][bc].winner);
                    smallBoardElement.appendChild(winnerOverlay);
                }
                boardElement.appendChild(smallBoardElement);
            }
        }
    }
    
    function checkSmallBoardWinner(board) {
        if (board.winner !== ' ') return board.winner;

        for (let i = 0; i < 3; i++) {
            if (board.grid[i][0] !== ' ' && board.grid[i][0] === board.grid[i][1] && board.grid[i][1] === board.grid[i][2]) return board.grid[i][0];
            if (board.grid[0][i] !== ' ' && board.grid[0][i] === board.grid[1][i] && board.grid[1][i] === board.grid[2][i]) return board.grid[0][i];
        }
        if (board.grid[0][0] !== ' ' && board.grid[0][0] === board.grid[1][1] && board.grid[1][1] === board.grid[2][2]) return board.grid[0][0];
        if (board.grid[0][2] !== ' ' && board.grid[0][2] === board.grid[1][1] && board.grid[1][1] === board.grid[2][0]) return board.grid[0][2];
        
        board.isFull = !board.grid.flat().includes(' ');
        if (board.isFull) return 'D';
        return ' ';
    }

    function checkOverallWinner() {
        if (overallWinner !== ' ') return;
        const metaBoard = bigBoard.map(row => row.map(sb => sb.winner));
        for (let i = 0; i < 3; i++) {
            if (metaBoard[i][0] !== ' ' && metaBoard[i][0] !== 'D' && metaBoard[i][0] === metaBoard[i][1] && metaBoard[i][1] === metaBoard[i][2]) overallWinner = metaBoard[i][0];
            if (metaBoard[0][i] !== ' ' && metaBoard[0][i] !== 'D' && metaBoard[0][i] === metaBoard[1][i] && metaBoard[1][i] === metaBoard[2][i]) overallWinner = metaBoard[0][i];
        }
        if (metaBoard[0][0] !== ' ' && metaBoard[0][0] !== 'D' && metaBoard[0][0] === metaBoard[1][1] && metaBoard[1][1] === metaBoard[2][2]) overallWinner = metaBoard[0][0];
        if (metaBoard[0][2] !== ' ' && metaBoard[0][2] !== 'D' && metaBoard[0][2] === metaBoard[1][1] && metaBoard[1][1] === metaBoard[2][0]) overallWinner = metaBoard[0][2];
        
        if (overallWinner === ' ' && !bigBoard.flat().some(sb => sb.winner === ' ')) {
            overallWinner = 'D';
        }
    }

    function handleCellClick(e) {
        if (isAITurn || overallWinner !== ' ') return;
        const cell = e.target;
        const { br, bc, r, c } = cell.dataset;
        const [brInt, bcInt, rInt, cInt] = [parseInt(br), parseInt(bc), parseInt(r), parseInt(c)];
        
        if (makeMove(brInt, bcInt, rInt, cInt, currentPlayer)) {
            renderBoard();
            if (overallWinner !== ' ') {
                endGame();
            } else {
                currentPlayer = 'O';
                statusText.textContent = `X's Turn (AI is thinking...)`;
                isAITurn = true;
                setTimeout(aiMove, 500);
            }
        }
    }
    
    function makeMove(br, bc, r, c, player) {
        if (overallWinner !== ' ' || bigBoard[br][bc].winner !== ' ' || bigBoard[br][bc].grid[r][c] !== ' ') {
            return false;
        }
        if (nextBoardRow !== -1 && (br !== nextBoardRow || bc !== nextBoardCol)) {
            return false;
        }

        bigBoard[br][bc].grid[r][c] = player;
        const smallWinner = checkSmallBoardWinner(bigBoard[br][bc]);
        if (smallWinner !== ' ') {
            bigBoard[br][bc].winner = smallWinner;
        }

        checkOverallWinner();

        nextBoardRow = r;
        nextBoardCol = c;
        if (bigBoard[nextBoardRow][nextBoardCol].winner !== ' ') {
            nextBoardRow = -1;
            nextBoardCol = -1;
        }
        return true;
    }
    
    function aiMove() {
        statusText.textContent = `X's Turn (AI is thinking...)`;
        
        // Use the advanced AI for all moves
        const { move } = findBestMove(bigBoard, nextBoardRow, nextBoardCol, 'X', depth);

        if (move) {
            makeMove(move[0], move[1], move[2], move[3], 'X');
            moveCount++;
        }
        
        renderBoard();
        
        if (overallWinner !== ' ') {
            endGame();
        } else {
            currentPlayer = 'O';
            statusText.textContent = `O's Turn`;
            isAITurn = false;
        }
    }
    
    function endGame() {
        if (overallWinner === 'D') {
            statusText.textContent = "It's a Draw!";
        } else {
            statusText.textContent = `${overallWinner} Wins!`;
        }
        document.querySelectorAll('.small-board.active').forEach(b => b.classList.remove('active'));
    }

    function startNewGame() {
        bigBoard = createBigBoard();
        currentPlayer = 'O'; // Set AI ('O') as the current player
        overallWinner = ' ';
        nextBoardRow = -1;
        nextBoardCol = -1;
        isAITurn = true; // It is the AI's turn
        moveCount = 0; 
        statusText.textContent = "X's Turn (AI is thinking...)";
        renderBoard();
        setTimeout(aiMove, 500); // Trigger the AI's first move
    }
    
    boardElement.addEventListener('click', handleCellClick);
    newGameBtn.addEventListener('click', startNewGame);
    
    startNewGame();
});

window.getAvailableMoves = (board, nextBr, nextBc) => {
    const moves = [];
    if (nextBr !== -1) {
        const smallBoard = board[nextBr][nextBc];
        if (smallBoard.winner === ' ') {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (smallBoard.grid[r][c] === ' ') {
                        moves.push([nextBr, nextBc, r, c]);
                    }
                }
            }
        }
    } 
    
    if (moves.length === 0) {
         for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                if (board[br][bc].winner === ' ') {
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                           if (board[br][bc].grid[r][c] === ' ') {
                                moves.push([br, bc, r, c]);
                           }
                        }
                    }
                }
            }
        }
    }
    return moves;
};