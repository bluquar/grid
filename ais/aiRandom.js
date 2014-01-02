function makeMove(grid) {
    var i = Math.floor((Math.random()*4));
    if (Math.random() > 0.7) {
        return [[ 0, -1],
                [ 0,  1],
                [-1,  0],
                [ 1,  0]][i];
    }
}
