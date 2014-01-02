function makeMove(grid) {
    /* Always move toward the other player */
    var otherPlayerPos = grid.position(grid.OP);
    var myPos = grid.position(grid.CP);
    if (myPos[0] < otherPlayerPos[0]) // Their row is higher
        return [1, 0];
    else if (myPos[0] > otherPlayerPos[0])
        return [-1, 0];
    else if (myPos[1] < otherPlayerPos[1]) // Their col is higher
        return [0, 1];
    else return [0, -1];
}

