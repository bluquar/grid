var aiResources = {
    terr_yield: function(grid, row, col, sl) {
        var t_score = 0;
        for (var drow=0; drow < sl; drow++) {
            for (var dcol=0; dcol < sl; dcol++) {
                var t = grid.territory(row+drow, col+dcol);
                if (t==grid.CP)
                    t_score += 0;
                else if (t==grid.OP)
                    t_score += 2;
                else
                    t_score += 1;
            }
        }
        return t_score;
    },

    closest_point: function(sq_row, sq_col, prow, pcol, sl) {
        var closest_row = 0;
        var row_eq = false;
        var col_eq = false;
        if (prow == sq_row) {
            closest_row = prow;
            row_eq = true;
        }
        else if (prow == sq_row+sl) {
            closest_row = prow;
            row_eq = true;
        }
        else if (prow < sq_row)
            closest_row = sq_row;
        else if (prow > sq_row + sl)
            closest_row = sq_row + sl;
        else if (prow < sq_row + sl/2) {
            row_eq = true;
            closest_row = sq_row;
        } else {
            row_eq = true;
            closest_row = sq_row + sl;
        }
        var closest_col = 0;
        if (pcol == sq_col) {
            col_eq = true;
            closest_col = pcol;
        }
        else if (pcol == sq_col+sl) {
            closest_col = pcol;
            col_eq = true;
        }
        else if (pcol < sq_col)
            closest_col = sq_col;
        else if (pcol > sq_col + sl)
            closest_col = sq_col + sl;
        else if (pcol < sq_col + sl/2) {
            col_eq = true;
            closest_col = sq_col;
        } else {
            col_eq = true;
            closest_col = sq_col + sl;
        }
        if (col_eq && !row_eq)
            return [closest_row, pcol];
        else if (row_eq && !col_eq)
            return [prow, closest_col];
        else if (!row_eq && !col_eq)
            return [closest_row, closest_col];
        else {
            if (Math.abs(prow-closest_row) > Math.abs(pcol-closest_col))
                return [prow, closest_col];
            else
                return [closest_row, pcol];
        }
    },

    min_dist_to_sq: function(grid, sq_row, sq_col, prow, pcol, sl) {
        var closest_pt = grid.resources.closest_point(sq_row, sq_col,
                                                 prow, pcol, sl);
        return (Math.abs(prow - closest_pt[0]) +
                Math.abs(pcol - closest_pt[1]));
    },

    score: function (grid, row, col, sl) {
        var CPpos = grid.position(grid.CP);
        var OPpos = grid.position(grid.OP);
        var CProw = CPpos[0];
        var CPcol = CPpos[1];
        var OProw = OPpos[0];
        var OPcol = OPpos[1];
        var yield = 0;
        var cost = 0;
        /* Distance to square */
        cost += grid.resources.min_dist_to_sq(grid, row, col, CProw, CPcol, sl);
        /* Number of moves to finish enclosing square */
        var closest_point = grid.resources.closest_point(row, col,
                                                         CProw, CPcol, sl);
        var cprow = closest_point[0];
        var cpcol = closest_point[1];
        var clock_cost = grid.resources.clockwise_dist(grid, row, col,
                                                  sl, cprow, cpcol);
        var counter_cost = grid.resources.counter_dist(grid, row, col,
                                                  sl, cprow, cpcol);
        cost += clock_cost > counter_cost ? counter_cost : clock_cost;
        yield += grid.resources.terr_yield(grid, row, col, sl);
        return yield / cost;
    },

    routeToEnclose: function(grid, row, col, sl) {
        var cpos = grid.position(grid.CP);
        var crow = cpos[0];
        var ccol = cpos[1];
        /* Outside Square */
        if (crow > row + sl)
            return [-1, 0];
        if (crow < row)
            return [1, 0];
        if (ccol > col + sl)
            return [0, -1];
        if (ccol < col)
            return [0, 1];
        /* Inside Square */
        if (!((crow == row) || (crow == row+sl) ||
              (ccol == col) || (ccol == col+sl))) {
            var leftdist = ccol - col;
            var rightdist = (col+sl) - ccol;
            var updist = crow - row;
            var downdist = (col+sl) - crow;
            if (updist < downdist &&
                updist < leftdist &&
                updist < rightdist) {
                return [-1, 0];
            }
            if (downdist < leftdist &&
                downdist < rightdist)
                return [1, 0];
            if (leftdist < rightdist)
                return [0, -1];
            return [0, 1];
        }
        /* On the perimeter */
        var clockwise_dist = grid.resources.clockwise_dist(grid, row, col,
                                                           sl, crow, ccol);
        var counter_dist = grid.resources.counter_dist(grid, row, col,
                                                       sl, crow, ccol);
        if (clockwise_dist < counter_dist)
            return grid.resources.go_clockwise(crow, ccol, row, col, sl);
        else
            return grid.resources.go_counter(crow, ccol, row, col, sl);
    },

    clockwise_dist: function(grid, row, col, sl, start_row, start_col) {
        var temp_row = start_row;
        var temp_col = start_col;
        var temp_rowp = 0;
        var temp_colp = 0;
        var num_needed = 0;
        var erases_needed = 0;
        for (var temp_time = 0; temp_time < sl * 4; temp_time++) {
            if ((temp_row==row) && (temp_col-col < sl)) {
                temp_rowp = temp_row;
                temp_colp = temp_col + 1;
            }
            else if ((temp_col==col+sl) &&
                     (temp_row-row < sl)) {
                temp_rowp = temp_row + 1;
                temp_colp = temp_col;
            }
            else if ((temp_row==row+sl) &&
                     (temp_col > col)) {
                temp_rowp = temp_row;
                temp_colp = temp_col - 1;
            }
            else {
                temp_rowp = temp_row - 1;
                temp_colp = temp_col;
            }
            var edg = grid.edge(temp_row, temp_col, temp_rowp, temp_colp);
            if (edg != grid.CP) {
                num_needed = temp_time;
                if (edg != -1)
                    erases_needed++;
            }
            temp_row = temp_rowp;
            temp_col = temp_colp;
        }
        return num_needed + erases_needed*2;
    },

    counter_dist: function(grid, row, col, sl, start_row, start_col) {
        var temp_row = start_row;
        var temp_col = start_col;
        var temp_rowp = 0;
        var temp_colp = 0;
        var num_needed = 0;
        var erases_needed = 0;
        for (var temp_time = 0; temp_time < sl * 4; temp_time++) {
            if ((temp_row==row) && (temp_col > col)) {
                temp_rowp = temp_row;
                temp_colp = temp_col - 1;
            }
            else if ((temp_col==col+sl) &&
                     (temp_row> row)) {
                temp_rowp = temp_row - 1;
                temp_colp = temp_col;
            }
            else if ((temp_row==row+sl) &&
                     (temp_col < col+sl)) {
                temp_rowp = temp_row;
                temp_colp = temp_col + 1;
            }
            else {
                temp_rowp = temp_row + 1;
                temp_colp = temp_col;
            }
            var edg = grid.edge(temp_row, temp_col, temp_rowp, temp_colp);
            if (edg != grid.CP) {
                num_needed = temp_time;
                if (edg != -1)
                    erases_needed++;
            }
            temp_row = temp_rowp;
            temp_col = temp_colp;
        }
        return num_needed + erases_needed*2;
    },

    go_clockwise: function(crow, ccol, row, col, sl) {
        if ((crow==row) && (ccol-col < sl))
            return [0, 1];
        else if ((ccol==col+sl) && (crow-row < sl))
            return [1, 0];
        else if ((crow==row+sl) && (ccol > col))
            return [0, -1];
        else
            return [-1, 0];
    },

    go_counter: function(crow, ccol, row, col, sl) {
        if ((crow==row) && (ccol > col))
            return [0, -1];
        if ((ccol==col+sl) && (crow > row))
            return [-1, 0];
        if ((crow==row+sl) &&
            (ccol-col < sl))
            return [0, 1];
        if ((ccol==col) && (crow < (row+sl)))
            return [1, 0];
    }
};

function makeMove(grid) {
    /* Rate squares by moves needed for completion. */
    var max_sidelength = (grid.rows > grid.cols) ? grid.cols+1 : grid.rows+1;
    var CPpos = grid.position(grid.CP);
    var crow = CPpos[0];
    var ccol = CPpos[1];
    var brow = 0;
    var bcol = 0;
    var bsl = 0;
    var bscore = 0;
    var found = false;
    for (var sl = 1; sl <= max_sidelength; sl++)  {
        for (var row = 0; row < grid.rows-sl+1; row++) {
            for (var col = 0; col < grid.cols-sl+1; col++) {
                /* Score for this (row,col,sl) tuple. higher is better. */
                var score = grid.resources.score(grid, row, col, sl);
                /* Is this the best score? */
                if ((score > bscore) || (!found)) {
                    brow = row;
                    bcol = col;
                    bsl = sl;
                    bscore = score;
                    found = true;
                }
            }
        }
    }
    return grid.resources.routeToEnclose(grid, brow, bcol, bsl);
}
