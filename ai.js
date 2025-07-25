// A more efficient function to copy the board state for the AI to analyze
function fastDeepCopy(board) {
    const newBoard = Array(3).fill(null).map(() => Array(3));
    for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
            const sb = board[br][bc];
            newBoard[br][bc] = {
                grid: [
                    [sb.grid[0][0], sb.grid[0][1], sb.grid[0][2]],
                    [sb.grid[1][0], sb.grid[1][1], sb.grid[1][2]],
                    [sb.grid[2][0], sb.grid[2][1], sb.grid[2][2]]
                ],
                winner: sb.winner,
                isFull: sb.isFull,
            };
        }
    }
    return newBoard;
}

// Function to find the best move for the AI
function findBestMove(board, nextBr, nextBc, player, depth) {
    // Depth 4 is a good balance of strength and speed for web.
    return minimax(board, nextBr, nextBc, depth, -Infinity, Infinity, true, player);
}

// Minimax algorithm with Alpha-Beta Pruning
function minimax(board, nextBr, nextBc, depth, alpha, beta, isMaximizingPlayer, player) {
    const boardWinner = checkOverallWinner(board);
    if (boardWinner === 'O') return { score: Number.MAX_VALUE }; // AI 'O' wins
    if (boardWinner === 'X') return { score: -Number.MAX_VALUE }; // Player 'X' wins
    if (boardWinner === 'D') return { score: -10}; // Draw
    if (depth === 0) return { score: evaluateBoard(board) };

    const availableMoves = window.getAvailableMoves(board, nextBr, nextBc);
    if (availableMoves.length === 0) return { score: evaluateBoard(board) };

    // --- MOVE ORDERING ---
    const scoredMoves = availableMoves.map(move => {
        const [br, bc, r, c] = move;
        let heuristicScore = 0;
        
        const tempSmallGrid = board[br][bc].grid.map(row => [...row]);
        tempSmallGrid[r][c] = player;
        if (checkSmallBoardWinner({grid: tempSmallGrid}) === player) {
            heuristicScore = 100; // Prioritize winning moves
        }
        
        if (r === 1 && c === 1) heuristicScore += 5;
        
        return { move, heuristicScore };
    });

    if (isMaximizingPlayer) {
        scoredMoves.sort((a, b) => b.heuristicScore - a.heuristicScore);
    } else {
        scoredMoves.sort((a, b) => b.heuristicScore - a.heuristicScore);
    }

    const sortedMoves = scoredMoves.map(item => item.move);
    // --- END OF MOVE ORDERING ---
    
    let bestMove = sortedMoves[0];

    if (isMaximizingPlayer) { // AI 'O' is maximizing
        let maxEval = -Infinity;
        for (const move of sortedMoves) {
            const newBoard = fastDeepCopy(board);
            const newState = makeMoveOnCopy(newBoard, move, 'O'); 
            const { score } = minimax(newState.board, newState.nextBr, newState.nextBc, depth - 1, alpha, beta, false, 'X');
            
            if (score > maxEval) {
                maxEval = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break; // Pruning
        }
        return { score: maxEval, move: bestMove };
    } else { // Player 'X' is minimizing
        let minEval = Infinity;
        for (const move of sortedMoves) {
            const newBoard = fastDeepCopy(board);
            const newState = makeMoveOnCopy(newBoard, move, 'X');
            const { score } = minimax(newState.board, newState.nextBr, newState.nextBc, depth - 1, alpha, beta, true, 'O');
            if (score < minEval) {
                minEval = score;
                bestMove = move;
            }
            beta = Math.min(beta, score);
            if (beta <= alpha) break; // Pruning
        }
        return { score: minEval, move: bestMove };
    }
}

// Converts a small board grid to its integer key for the transposition table
function smallBoardToInt(grid) {
    let result = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = grid[i][j];
            const value = cell === 'X' ? 0 : cell === 'O' ? 1 : 2;
            result = result * 3 + value;
        }
    }
    return result;
}

// Evaluate the entire big board based on small board states
function evaluateBoard(board) {
    let score = 0;
    const smallBoardScores = board.map(row => row.map(sb => {
        const winner = checkSmallBoardWinner(sb);
        if (winner === 'O') return 100;
        if (winner === 'X') return -100;
        if (winner === 'D') return 0;
        
        const key = smallBoardToInt(sb.grid);
        return transpositionTable[key] || 0;
    }));

    for (let i = 0; i < 3; i++) {
        score += evaluateLine(smallBoardScores[i][0], smallBoardScores[i][1], smallBoardScores[i][2]); // Row
        score += evaluateLine(smallBoardScores[0][i], smallBoardScores[1][i], smallBoardScores[2][i]); // Col
    }
    score += evaluateLine(smallBoardScores[0][0], smallBoardScores[1][1], smallBoardScores[2][2]); // Diagonal
    score += evaluateLine(smallBoardScores[0][2], smallBoardScores[1][1], smallBoardScores[2][0]); // Anti-diagonal

    return score;
}

// Helper to score a line of 3 values
function evaluateLine(a, b, c) {
    let score = 0;
    const line = [a, b, c];

    const oCount = line.filter(s => s > 0).length;
    const xCount = line.filter(s => s < 0).length;

    if (oCount === 3) score += 1000;
    else if (oCount === 2 && xCount === 0) score += 15;
    else if (oCount === 1 && xCount === 0) score += 2;

    if (xCount === 3) score -= 1000;
    else if (xCount === 2 && oCount === 0) score -= 15;
    else if (xCount === 1 && oCount === 0) score -= 2;

    score += (a + b + c) / 10;
    return score;
}

// Helper function to check for an overall winner on a board copy
function checkOverallWinner(board) {
    const metaBoard = board.map(row => row.map(sb => checkSmallBoardWinner(sb)));
     for (let i = 0; i < 3; i++) {
        if (metaBoard[i][0] !== ' ' && metaBoard[i][0] !== 'D' && metaBoard[i][0] === metaBoard[i][1] && metaBoard[i][1] === metaBoard[i][2]) return metaBoard[i][0];
        if (metaBoard[0][i] !== ' ' && metaBoard[0][i] !== 'D' && metaBoard[0][i] === metaBoard[1][i] && metaBoard[1][i] === metaBoard[2][i]) return metaBoard[0][i];
    }
    if (metaBoard[0][0] !== ' ' && metaBoard[0][0] !== 'D' && metaBoard[0][0] === metaBoard[1][1] && metaBoard[1][1] === metaBoard[2][2]) return metaBoard[0][0];
    if (metaBoard[0][2] !== ' ' && metaBoard[0][2] !== 'D' && metaBoard[0][2] === metaBoard[1][1] && metaBoard[1][1] === metaBoard[2][0]) return metaBoard[0][2];
    if (!metaBoard.flat().some(w => w === ' ')) return 'D';
    return ' ';
}

// Helper function to check for a winner on a small board copy
function checkSmallBoardWinner(board) {
    for (let i = 0; i < 3; i++) {
        if (board.grid[i][0] !== ' ' && board.grid[i][0] === board.grid[i][1] && board.grid[i][1] === board.grid[i][2]) return board.grid[i][0];
        if (board.grid[0][i] !== ' ' && board.grid[0][i] === board.grid[1][i] && board.grid[1][i] === board.grid[2][i]) return board.grid[0][i];
    }
    if (board.grid[0][0] !== ' ' && board.grid[0][0] === board.grid[1][1] && board.grid[1][1] === board.grid[2][2]) return board.grid[0][0];
    if (board.grid[0][2] !== ' ' && board.grid[0][2] === board.grid[1][1] && board.grid[1][1] === board.grid[2][0]) return board.grid[0][2];
    if (!board.grid.flat().includes(' ')) return 'D';
    return ' ';
}

// Makes a move on a copied board state and returns the new `nextBoard` coordinates
function makeMoveOnCopy(board, move, player) {
    const [br, bc, r, c] = move;
    board[br][bc].grid[r][c] = player;
    
    let nextBr = r;
    let nextBc = c;
    
    if (checkSmallBoardWinner(board[nextBr][nextBc]) !== ' ') {
        nextBr = -1;
        nextBc = -1;
    }
    return { board, nextBr, nextBc };
}t