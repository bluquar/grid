/* Utility library by Chris Barker
 * originally written for Grid
 * http://cbarker.net/grid
 */

/* Miscellaneous */
function toInt(num) {
    // http://stackoverflow.com/questions/596467
    return ~~num;
}

function half(num) {
    return toInt(num/2);
}

function zfill(number, size) {
    /* convert int to string with leading zeros
     * python equivalent: (("%%0%dd" % size) % number)
     * https://gist.github.com/superjoe30/4382935
     */
    number = number.toString();
    while (number.length < size) number = "0" + number;
    return number;
}

function max(a, b) {
    /* Return the larger of two values. */
    return (a > b) ? a : b;
}

function min(a, b) {
    /* Return the smaller of two values. */
    return (a > b) ? b : a;
}

/* Copy */
function copyArray(A) {
    var arr = [];
    for (var i = 0; i < A.length; i++) {
        arr.push(A[i]);
    }
    return arr;
}

function copy2DArray(B) {
    var arr = [];
    for (var i = 0; i < B.length; i++) {
        arr.push(copyArray(B[i]));
    }
    return arr;
}

function copyObject(D) {
    var res = {};
    for (var key in D) {
        res[key] = D[key];
    }
    return res;
}

/* Arrays */
function all_array(A) {
    for (var i = 0; i < A.length; i++) {
        if (!(A[i]))
            return false;
    }
    return true;
}

function any_array(A) {
    for (var i = 0; i < A.length; i++) {
        if (A[i])
            return true;
    }
    return false;
}

/* Priority Queue */
function PriorityQueue() {
    this.Q = [0];
    this.size = 0;
    this.isEmpty = PQ_isEmpty;
    this.insert = PQ_insert;
    this.pop = PQ_pop;
}

function PQ_isEmpty() {
    return this.size == 0;
}

function PQ_insert(elem, priority) {
    this.Q.push([elem, priority]);
    this.size++;
    var idx = this.size; // Starting index of new element.
    while (idx > 1 && this.Q[half(idx)][1] > this.Q[idx][1]) {
        // The parent node is "higher" priority. Swap them
        var parent = this.Q[half(idx)];
        this.Q[half(idx)] = this.Q[idx];
        this.Q[idx] = parent;
        idx = half(idx);
    }
}

function PQ_pop() {
    if (this.isEmpty()) return;
    this.size--;
    return this.Q.splice(1, 1)[0][0];
}

