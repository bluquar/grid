/* grid.js
 * by Chris Barker
 * http://cbarker.net/grid
 * chris@cbarker.net
 */

var game = function() {

var gameData = {};

var settings = {
 "timerInterval": 35,
 "maxWidth": 800,
 "maxHeight": 600,
 "colors":
   {"territory": {"-1": "#999999",
                   "0": "#EE7777",
                   "1": "#7777EE"},
    "edge":      {"-1": "#EEEEEE",
                   "0": "#FF0000",
                   "1": "#0000FF"},
    "vertex":    {"-1": "#FFFFFF",
                   "0": "#FF0000",
                   "1": "#0000FF"}},

};

var initialize = function(source) {
    /* body onLoad */
    /* Loads settings */
    /* Binds event listeners, schedules timer event */
    gameData.source = source || "";
    gameData.canvas = document.getElementById("gameCanvas");
    gameData.context = gameData.canvas.getContext("2d");
    gameData.timerInterval = settings.timerInterval;
    gameData.maxWidth = settings.maxWidth;
    gameData.maxHeight = settings.maxHeight;
    gameData.colors = settings.colors;
    initProgramData();
    // Event listeners
    document.addEventListener("keydown", onKeyDown, false);
    document.getElementById("files")
        .addEventListener("change", submitFiles, false);
    // Timer:
    setInterval(handleTimer, gameData.timerInterval);
};

/* Event handlers */

var onKeyDown = function(event) {
    var key = event.which;
    if (33 <= key && key <= 40) {
        // Pressed an arrow key -- don't want to scroll
        event.preventDefault();
    }
    var identifier = event.keyIdentifier;
    switch (identifier) {
    case "Left":
        gameData.inputVelocities[1][0] = 0;
        gameData.inputVelocities[1][1] = -1;
        break;
    case "Right":
        gameData.inputVelocities[1][0] = 0;
        gameData.inputVelocities[1][1] = 1;
        break;
    case "Down":
        gameData.inputVelocities[1][0] = 1;
        gameData.inputVelocities[1][1] = 0;
        break;
    case "Up":
        gameData.inputVelocities[1][0] = -1;
        gameData.inputVelocities[1][1] = 0;
        break;
    case "U+0041": // A
        gameData.inputVelocities[0][0] = 0;
        gameData.inputVelocities[0][1] = -1;
        break;
    case "U+0044": // D
        gameData.inputVelocities[0][0] = 0;
        gameData.inputVelocities[0][1] = 1;
        break;
    case "U+0053": // S
        gameData.inputVelocities[0][0] = 1;
        gameData.inputVelocities[0][1] = 0;
        break;
    case "U+0057": // W
        gameData.inputVelocities[0][0] = -1;
        gameData.inputVelocities[0][1] = 0;
        break;
    default:
        //console.log("You pressed " + identifier);
        break;
    }
};

var submitFiles = function(event) {
    /* event handler for file selection object */
    var files = event.target.files;
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
                return function(e) {
                    addNewAI(e.target.result, theFile.name);
                }
            })(f);
        reader.readAsDataURL(f);
    }
};

var handleTimer = function() {
    if (gameData.loading==0) {
        if (!gameData.gameOver) {
            gameData.smoothCount++;
            if (gameData.smoothCount >= gameData.smooth) {
                doPhysics();
                gameData.smoothCount = 0;
            }
        }
        redrawAll();
    }
};

/* --- Utility functions --- */

var hash = function(args) {
    /* Return a unique hash value for an array
       of values representing rows or columns.
       Useful for edges, which are represented
       as [startRow, startCol, endRow, endCol].
     */
    var h = 0;
    for (var i = 0; i < args.length; i++) {
        h *= gameData.hasher;
        h += args[i];
    }
    return h;
};

var getColor = function(location, player) {
    return gameData.colors[location][player.toString()];
};

var getEdgeFrom = function(r1, c1, r2, c2, edges) {
    if (r1+c1 < r2+c2)
        return edges[hash([r1, c1, r2, c2])];
    else
        return edges[hash([r2, c2, r1, c1])];
};

var getEdge = function(r1, c1, r2, c2) {
    return getEdgeFrom(r1, c1, r2, c2, gameData.edges);
};

var setEdge = function(r1, c1, r2, c2, val) {
    /* Set ownership for ((r1,c1), (r2,c2)).
     * Requires: r1+c1 <= r2+c2 and the edge is valid.
     */
    if (r1+c1 < r2+c2)
        gameData.edges[hash([r1, c1, r2, c2])] = val;
    else
        gameData.edges[hash([r2, c2, r1, c1])] = val;
    gameData.vertices[r1][c1] = val;
    gameData.vertices[r2][c2] = val;
};

/* --- AI Interface --- */

var acceptInput = function(grid) {
    return copyArray(gameData.inputVelocities[grid.CP]);
};

var validVelocity = function(vel) {
    var type = Object.prototype.toString.call(vel);
    if (!(type==="[object Array]")) return false;
    return ((vel[0] ==  1 && vel[1] ==  0) || /* Down  */
            (vel[0] == -1 && vel[1] ==  0) || /* Up    */
            (vel[0] ==  0 && vel[1] ==  1) || /* Right */
            (vel[0] ==  0 && vel[1] == -1))   /* Left  */
};

var snapshot = function(player) {
    var get_territory = function(row, col) {
        if (0 <= row && row < gameState.rows &&
            0 <= col && col < gameState.cols)
            return gameData.territories[row][col];
        else
            return -2;
    };
    var position = function(player) {
        if (player == 0 || player == 1)
            return copyArray(gameData.positions[player]);
        else
            return [0, 0];
    };
    var score = function(player) { return gameData.scores[player]; };
    var gameState = {territory: get_territory,
                     edge: getEdge,
                     position: position,
                     score: score,
                     persist: gameData.persists[player],
                     resources: gameData.resources[player],
                     CP: player,
                     OP: 1-player,
                     NP: -1,
                     rows: gameData.rows,
                     cols: gameData.cols};
    return gameState;
};

var loadNewVelocity = function(player) {
    var gameState = snapshot(player);
    var mover = gameData.movers[player];
    var newVel = mover(gameState);
    if (validVelocity(newVel)) {
        gameData.velocities[player][0] = newVel[0];
        gameData.velocities[player][1] = newVel[1];
    }
};

var getPlayerByName = function(name) {
    for (var i = 0; i < gameData.ais.length; i++) {
        var ai = gameData.ais[i];
        if (ai.name == name)
            return ai;
    }
    alert("Unable to find " + name);
};

var loadPlayers = function() {
    var p1 = document.getElementById("playerone");
    var p2 = document.getElementById("playertwo");

    var p1src = p1.options[p1.selectedIndex].value;
    var p2src = p2.options[p2.selectedIndex].value;

    gameData.movers = [getPlayerByName(p1src).mover,
                       getPlayerByName(p2src).mover];
    gameData.resources = [getPlayerByName(p1src).resources,
                          getPlayerByName(p2src).resources];
    gameData.persists = [{}, {}];
};

var changeSpeed = function(b) {
    if (b.value =="Speed Up") {
        gameData.smooth = 1;
        b.value = "Slow Down";
    } else {
        gameData.smooth = 5;
        b.value = "Speed Up";
    }
};

var decodeBase64 = function(s) {
    // http://stackoverflow.com/questions/2820249
    var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
    var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}
    for(x=0;x<L;x++){
        c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
        while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
    }
    return r;
};

var realIntelligence = function() {
    /* Create an AI object that accepts user input.
     *
     */
    var ai = {};
    ai.mover = acceptInput;
    ai.resources = {};
    ai.name = "Human";
    return ai;
};

var addServerAI = function(source, name) {
    gameData.loading++;
    delete makeMove;
    delete aiResources;
    $.getScript(source, function() {
            if (typeof makeMove === "undefined") {
                alert("Unable to load " + source);
            } else {
                if (typeof aiResources === "undefined") {
                    aiResources = {};
                }
                gameData.ais.push({name: name,
                            mover: makeMove,
                            resources: aiResources});
                updateSelectionBoxes();
                gameData.loading--;
            }
    });

}

var newAI = function(code, name) {
    /* Create an AI from a user-uploaded file. This is called by submitFiles.
     *
     */
    delete makeMove;
    delete aiResources;
    eval(code);
    var ai = {};
    if (typeof makeMove === "undefined") {
        return false;
    } else {
        ai.mover = makeMove;
        if (typeof aiResources === "undefined") {
            aiResources = {};
        }
        ai.name = name.substring(0, name.indexOf("."));
        ai.resources = aiResources;
        return ai;
    }
};

var addNewAI = function(data, name) {
    var encoded = data.substring("data:application/x-javascript;base64,".length,
                               data.length);
    var code = decodeBase64(encoded);
    var ai = newAI(code, name);
    if (ai === false) {
        alert("Unable to load " + name);
    } else {
        gameData.ais.push(newAI(code, name));
        updateSelectionBoxes();
    }
};

var updateSelectionBoxes = function() {
    /* This handles `select` tags' options when a new AI is added.
     */
    var names = [];
    for (var i = 0; i < gameData.ais.length; i++) {
        names.push(gameData.ais[i].name);
    }

    boxes = ["playerone", "playertwo"];
    for (var i = 0; i < boxes.length; i++) {
        var box = document.getElementById(boxes[i]);
        for (var k = box.length-1; k >= 0; k--) {
            box.remove(k);
        }
        for (var j = 0; j < names.length; j++) {
            var option=document.createElement("option");
            option.text=names[j];
            box.add(option,null);
        }
    }
};

/* --- Model functions --- */

var resetVertices = function() {
    gameData.vertices = [];
    for (var i = 0; i <= gameData.rows; i++) {
        /* There are (rows+1) by (cols+1) vertices. */
        var this_row = [];
        for (var j = 0; j <= gameData.cols; j++) {
            this_row.push(-1);
        }
        gameData.vertices.push(this_row);
    }
};

var resetTerritories = function() {
    gameData.territories = [];
    for (var i = 0; i < gameData.rows; i++) {
        /* There are rows by cols territories. */
        var this_row = [];
        for (var j = 0; j < gameData.cols; j++) {
            this_row.push(-1);
        }
        gameData.territories.push(this_row);
    }
};

var resetEdges = function() {
    gameData.edges = {};
    /* Edges are stored as an object.
     * Each edge has a unique key.
     */
    for (var i = 0; i <= gameData.rows; i++) {
        for (var j = 0; j <= gameData.cols; j++) {
            if (i < gameData.rows) {
                setEdge(i, j, i+1, j, -1);
            }
            if (j < gameData.cols) {
                setEdge(i, j, i, j+1, -1);
            }
        }
    }
};

var resetGame = function() {
    /* Reset the board and players' positions.
     * TODO: make configurable:
     *  -rows and columns
     *  -starting positions
     *  -whether each player is a human or ai
     *  -speed?
     */
    gameData.gameOver = false;
    gameData.scores = [0, 0];
    gameData.result = "";
    gameData.players = 2;
    resetVertices();
    resetTerritories();
    resetEdges();
    /* Starting positions */
    gameData.positions = [[0,0], [gameData.rows, gameData.cols]];
    gameData.vertices[0][0] = 0;
    gameData.vertices[gameData.rows][gameData.cols] = 1;
    /* Starting velocities */
    gameData.velocities = [[1, 0], [-1, 0]];
    gameData.inputVelocities = [[1, 0], [-1, 0]];
    /* Starting speed */
    gameData.smooth = 5;
    gameData.smoothCount = 0;
    document.getElementById("speed").value="Speed Up";
    loadPlayers();
};

var loadDefaultAIs = function() {
    gameData.ais.push(realIntelligence());
    updateSelectionBoxes();
    addServerAI(gameData.source + "ais/aiRandom.js", "Easy");
    addServerAI(gameData.source + "ais/mediumAI.js", "Moderate");
    addServerAI(gameData.source + "ais/follow.js", "Hard");
};

var initProgramData = function() {
    /* gameData.loading represents the number of threads
     * that are loading data. Init to `1` for the primary init thread.
     */
    gameData.loading = 1;
    setupDOM(); // setupDOM initializes non-canvas HTML objects, such as SVGs.
    gameData.margin = 6; // Width of grid edges on canvas.
    gameData.ais = [];
    loadDefaultAIs()
    gameData.rows = 12;
    gameData.cols = 10;
    gameData.hasher = max(gameData.rows, gameData.cols);
    resetGame();
    gameData.loading--;
};

var doPhysics = function() {
    for (var i = 0; i < gameData.players; i++) {
        movePlayer(i);
    }
    for (var i = 0; i < gameData.players; i++) {
        loadNewVelocity(i);
    }
    evaluateScore();
};

var otherPlayer = function(player) {
    /* otherPlayer(0) is 1, otherPlayer(1) is 0. */
    return 1-player;
};

var movePlayer = function(player) {
    var row = gameData.positions[player][0];
    var col = gameData.positions[player][1];
    var drow = gameData.velocities[player][0];
    var dcol = gameData.velocities[player][1];
    var nrow = max(0, min(gameData.rows, row + drow));
    var ncol = max(0, min(gameData.cols, col + dcol));
    var erase = getEdge(nrow, ncol, row, col) == otherPlayer(player);
    var newValue = erase ? -1 : player;
    setEdge(row, col, nrow, ncol, newValue);
    gameData.positions[player][0] = nrow;
    gameData.positions[player][1] = ncol;
    checkCapture(player, row, col, nrow, ncol);
    if (!erase)
        gameData.vertices[nrow][ncol] = player;
};

var checkCapture = function(player, r1, c1, r2, c2) {
    /* Called when player `player` moves from (r1, c1) to (r2, c2).
     * Updates the board appropriately if territory is captured.
     */
    if (r1==r2 && c1==c2) return; /* Didn't move */
    var captured = [];
    var toRemove = [];
    var res = {};
    if (r1==r2) { /* Moved horizontally */
        /* Up */
        res = searchFrom(player, r1-1, min(c1, c2));
        captured.push.apply(captured, res.captured);
        toRemove.push.apply(toRemove, res.boundaries);
        /* Down */
        res = searchFrom(player, r1, min(c1, c2));
        captured.push.apply(captured, res.captured);
        toRemove.push.apply(toRemove, res.boundaries);
    } else { /* Moved vertically */
        /* Left */
        res = searchFrom(player, min(r1,r2), c1-1);
        captured.push.apply(captured, res.captured);
        toRemove.push.apply(toRemove, res.boundaries);
        /* Right */
        res = searchFrom(player, min(r1,r2), c1);
        captured.push.apply(captured, res.captured);
        toRemove.push.apply(toRemove, res.boundaries);
    }
    for (var t = 0; t < captured.length; t++) {
        var row = captured[t][0];
        var col = captured[t][1];
        gameData.territories[row][col] = player;
    }
    for (var e = 0; e < toRemove.length; e++) {
        var r1 = toRemove[e][0];
        var c1 = toRemove[e][1];
        var r2 = toRemove[e][2];
        var c2 = toRemove[e][3];
        setEdge(r1, c1, r2, c2, -1);
    }
};

var distanceFromEdge = function(row, col) {
    return (min(row, gameData.rows-1-row) +
            min(col, gameData.cols-1-col));
};

var searchFrom = function(player, row, col) {
    /* Called by checkCapture, to investigate if a specific territory
     * is part of a captured area.
     * Returns: {captured: [<list of [row,col] territory arrays>]
     *           boundaries: [<list of [r1,c1,r2,c2] edge arrays>]}
     */
    var fail = {captured: [], boundaries: []}; // Nothing to capture.
    if (!(0 <= row && row < gameData.rows &&
          0 <= col && col < gameData.cols))
        return fail; // Out of bounds!

    /* Object to keep track of which territories we have explored.
     * {hash([row,col]): [row,col], ...}
     */
    var seen = {};
    var startKey = hash([row, col]);
    seen[startKey] = [row, col];
    /* Stack of territories whose adjacencies need to be explored.
     * Using a stack makes this depth-first. To change to breadth-first,
     * Change `oldKey = stack.pop()` to `oldKey = stack.shift()`.
     * (This would make it behave as a queue.)
     */
    //var stack = [startKey];
    var queue = new PriorityQueue();
    queue.insert(startKey, distanceFromEdge(row, col));
    var boundaries = [];
    //while (stack.length > 0) {
    while (!queue.isEmpty()) {
        //var oldKey = stack.pop();
        var oldKey = queue.pop();
        var row = seen[oldKey][0];
        var col = seen[oldKey][1];
        var edges = [[[row+1,col,row+1,col+1], row+1, col],  // Down
                     [[row,col+1,row+1,col+1], row, col+1],  // Right
                     [[row,col,row,col+1], row-1, col],      // Up
                     [[row,col,row+1,col], row, col-1]];     // Left
        for (var i = 0; i < edges.length; i++) {
            var r1 = edges[i][0][0];
            var c1 = edges[i][0][1];
            var r2 = edges[i][0][2];
            var c2 = edges[i][0][3];
            var edge = getEdge(r1, c1, r2, c2);
            if (edge == player) { /* Found a boundary of our capture area */
                boundaries.push(edges[i][0]);
            } else { /* Need to keep exploring in this direction */
                var nrow = edges[i][1];
                var ncol = edges[i][2];
                var key = hash([nrow, ncol]);
                if (!(key in seen)) { // Not searched yet
                    if (0 <= nrow && nrow < gameData.rows &&
                        0 <= ncol && ncol < gameData.cols) {
                        // In-bounds
                        seen[key] = [nrow, ncol];
                        //stack.push(key);
                        queue.insert(key, distanceFromEdge(nrow, ncol));
                    } else {
                        return fail; // Not in bounds
                    }
                }
            }
        }
    }
    /* If we haven't returned `fail` by now, we have found an area enclosed
     * by `player`'s edges. This means we have successfully captured this area.
     * We return an object with the territories and edges that need to change,
     * and checkCapture makes the necessary changes.
     */
    var captured = [];
    for (key in seen) {
        captured.push(seen[key]);
    }
    var result = {};
    result.captured = captured;
    result.boundaries = boundaries;
    return result;
};

var evaluateScore = function() {
    var total = gameData.rows * gameData.cols;
    var playerCounts = [0, 0]; // Assume two-player
    for (var row = 0; row < gameData.rows; row++) {
        for (var col = 0; col < gameData.cols; col++) {
            var terr = gameData.territories[row][col];
            if (terr > -1) {
                playerCounts[terr] = playerCounts[terr] + 1;
            }
        }
    }
    gameData.scores[0] = playerCounts[0];
    gameData.scores[1] = playerCounts[1];
    if (playerCounts[0] >= total/2) {
        gameData.gameOver = true;
        if (playerCounts[1] >= total/2) {
            gameData.result = "A tie!";
        } else {
            gameData.result = "Red wins!";
        }
    } else if (playerCounts[1] >= total/2) {
        gameData.gameOver = true;
        gameData.result = "Blue wins!";
    } else {
        gameData.gameOver = false;
    }
};

/* --- View --- */

var tColor = function(row, col) {
    /* Return the appropriate color for the territory at (row, col) */
    return getColor("territory", gameData.territories[row][col]);
};

var drawTerritories = function(size, context) {
    var dy = (size.height - gameData.margin) / gameData.rows;
    var dx = (size.width - gameData.margin) / gameData.cols;
    var m = gameData.margin;
    for (var row = 0; row < gameData.rows; row++) {
        for (var col = 0; col < gameData.cols; col++) {
            var x = m/2 + col*dx;
            var y = m/2 + row*dy;
            context.fillStyle = tColor(row, col);
            context.fillRect(x, y, dx, dy);
        }
    }
};

var eColor = function(r1, c1, r2, c2) {
    /* Return the appropriate color for the edge at ((r1,c1),(r2,c2)) */
    return getColor("edge", getEdge(r1,c1,r2,c2));
};

var drawEdges = function(size, context) {
    context.shadowColor = "black";
    var dy = (size.height - gameData.margin) / gameData.rows;
    var dx = (size.width - gameData.margin) / gameData.cols;
    var m = gameData.margin;
    for (var row = 0; row <= gameData.rows; row++) {
        for (var col = 0; col <= gameData.cols; col++) {
            var y = m/2 + dy*row;
            var x = m/2 + dx*col;
            if (col != gameData.cols) {
                context.fillStyle = eColor(row, col, row, col+1);
                context.fillRect(x+m/2, y-m/2, dx-m, m);
            }
            if (row != gameData.rows) {
                context.fillStyle = eColor(row,col,row+1,col);
                context.fillRect(x-m/2, y+m/2, m, dy-m);
            }
        }
    }
    drawEdgeHeads(size, context);
    context.shadowColor = "transparent";
};

var drawEdgeHeads = function(size, context) {
    for (var i = 0; i < gameData.players; i++) {
        drawPlayerHead(size, context, i);
    }
};

var drawPlayerHead = function(size, context, player) {
    var dy = (size.height - gameData.margin) / gameData.rows;
    var dx = (size.width - gameData.margin) / gameData.cols;
    var m = gameData.margin;
    var row = gameData.positions[player][0];
    var col = gameData.positions[player][1];
    var drow = gameData.velocities[player][0];
    var dcol = gameData.velocities[player][1];
    var nrow = max(0, min(gameData.rows, row+drow));
    var ncol = max(0, min(gameData.cols, col+dcol));
    if (getEdge(row, col, nrow, ncol) == otherPlayer(player))
        context.fillStyle = getColor("edge", -1);
    else
        context.fillStyle = getColor("edge", player);
    var x = dx*col;
    var y = dy*row;
    var xn = dx*ncol;
    var yn = dy*nrow;
    var w = m + ((xn-x)*gameData.smoothCount) / gameData.smooth;
    var h = m + ((yn-y)*gameData.smoothCount) / gameData.smooth;
    context.fillRect(x, y, w, h);
    drawCircle(context, x+w-m/2, y+h-m/2, m, getColor("territory", player));
};

var drawCircle = function(context, cx, cy, r, fill) {
    context.beginPath();
    context.fillStyle = fill;
    context.arc(cx, cy, r, 0, 2*Math.PI);
    context.fill();
    context.stroke();
};

var drawVertices = function(size, context) {
    var dy = (size.height - gameData.margin) / gameData.rows;
    var dx = (size.width - gameData.margin) / gameData.cols;
    var m = gameData.margin;
    for (var row = 0; row <= gameData.rows; row++) {
        for (var col = 0; col <= gameData.cols; col++) {
            var y = m/2 + dy*row;
            var x = m/2 + dx*col;
            context.fillStyle = getColor("vertex", gameData.vertices[row][col]);
            context.fillRect(x-m/2, y-m/2, m, m);
        }
    }
};

var setupDOM = function() {
    setupScore();
};

var setupScore = function() {
    var data = [[0, 0, "#ececec"],
                [0, 0, "#ececec"],
                [0, 100, "#ececec"]];
    var cScale = d3.scale.linear().domain([0, 100]).range([0, 2 * Math.PI]);
    var vis = d3.select("#score");

    var arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(40)
        .startAngle(function(d){return cScale(d[0]);})
        .endAngle(function(d){return cScale(d[1]);});

    vis.selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", arc)
        .style("fill", function(d){return d[2];})
        .attr("transform", "translate(50,50)");
};

var drawScore = function() {
    var total = gameData.rows * gameData.cols;
    var cScale = d3.scale.linear().domain([0, total]).range([0, 2 * Math.PI]);
    var scores = copyArray(gameData.scores);
    var data = [[0, scores[1], getColor("territory", 1)],
                [total-scores[0], total, getColor("territory", 0)],
                [scores[1], total-scores[0], getColor("territory", -1)]];

    var vis = d3.select("#score");

    var arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(40)
        .startAngle(function(d){return cScale(d[0]);})
        .endAngle(function(d){return cScale(d[1]);});

    vis.selectAll("path")
        .data(data)
        .attr("d", arc)
        .style("fill", function(d){return d[2];})
        .attr("transform", "translate(50,50)");
};


var drawGameOver = function(context, size) {
    context.fillStyle = "#BCECFC";
    context.shadowColor = "black";
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.shadowBlur = 5;
    context.fillRect(size.width/2 - 100, size.height/2 - 50, 200, 100);
    context.shadowColor = "transparent";
    context.fillStyle = "black";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    context.fillText("Game over! " + gameData.result,
                     size.width/2, size.height/2);

};

var redrawAll = function() {
    var context = gameData.context;
    var size = getCanvasSize();
    context.shadowColor = "transparent";
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.shadowBlur = 5;
    // Resize Canvas if necessary
    if (context.canvas.width != size.width ||
        context.canvas.height != size.height) {
        context.canvas.width = size.width;
        context.canvas.height = size.height;
    }
    context.clearRect (0, 0, size.width, size.height);
    drawTerritories(size, context);
    drawEdges(size, context);
    drawVertices(size, context);
    if (gameData.gameOver) {
        drawGameOver(context, size);
    }
    drawScore();
};

var getCanvasSize = function() {
   var size = getWindowSize();
   size.width = min(size.width, gameData.maxWidth);
   size.height = min(size.height, gameData.maxHeight);
   cellSize = min(size.width / gameData.cols,
                  size.height / gameData.rows);
   size.width = cellSize * gameData.cols;
   size.height = cellSize * gameData.rows;
   return size;
};

var getWindowSize = function() {
    return {"width": window.innerWidth,
            "height": window.innerHeight};
};
return {
    initialize: initialize,
    reset: resetGame,
    changeSpeed: changeSpeed,
};
}();
