function makeMove(player, gameState, persist) {
    console.log("Making move");
    var i = Math.floor((Math.random()*4));
    console.log(i);
    return [[ 0, -1],
            [ 0,  1],
            [-1,  0],
            [ 1,  0]][i];
}
