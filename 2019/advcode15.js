(function() {

function assert(condition) {
  if (condition) return;
  console.assert.apply(console, arguments);
  debugger;
  throw new Error('Assertion failed');
}

class Program {
  constructor(bytecodes, initialInput = [], outputBuffer = undefined) {
    this.executor_ = this.makeExecutor_(bytecodes, initialInput, outputBuffer);
    this.lastResult_ = this.executor_.next();
  }

  isDone() {
    return this.lastResult_.done;
  }

  awaitsInput() {
    return !this.lastResult_.done && this.lastResult_.value === undefined;
  }

  awaitsOutput() {
    return !this.lastResult_.done && this.lastResult_.value !== undefined;
  }

  provideInput(value) {
    assert(this.awaitsInput(), this);
    this.lastResult_ = this.executor_.next(value);
  }

  consumeOutput() {
    assert(this.awaitsOutput(), this);
    const value = this.lastResult_.value;
    this.lastResult_ = this.executor_.next();
    return value;
  }

  * makeExecutor_(prog, input = [], output = undefined) {
    const modesCache = {};
    let i = 0;
    let relative_base = 0;
    let opcode = 99;
    let modes = [];

    function getArgument(argIndex) {
      const mode = modes[argIndex - 1] || 0;
      const index = i + argIndex;
      assert(0 <= index && index < prog.length, index, prog.length);
      if (mode == 0) {
        assert(0 <= prog[index], prog[index]);
        return prog[prog[index]] || 0;
      } else if (mode == 1) {
        return prog[index];
      } else if (mode == 2) {
        let relative_index = relative_base + prog[index];
        assert(0 <= relative_index, relative_base, prog[index]);
        return prog[relative_index] || 0;
      } else {
        assert(0, 'Wrong mode for getArgument: ', mode, index);
      }
    }

    function setArgument(argIndex, value) {
      const mode = modes[argIndex - 1] || 0;
      const index = i + argIndex;
      assert(0 <= index && index < prog.length, index, prog.length);
      if (mode == 0) {
        assert(0 <= prog[index], prog[index]);
        prog[prog[index]] = value;
      } else if (mode == 2) {
        let relative_index = relative_base + prog[index];
        assert(0 <= relative_index, relative_base, prog[index]);
        prog[relative_index] = value;
      } else {
        assert(0, 'Wrong mode for setArgument: ', mode, index);
      }
    }

    function calcDecimals(x) {
      let result = [];
      while (x) {
        result.push(x % 10);
        x = Math.floor(x / 10);
      }
      return result;
    }

    while (i < prog.length) {
      opcode = prog[i] % 100;
      const modesCode = Math.floor(prog[i] / 100);
      modes = (modesCode in modesCache) ?
          modesCache[modesCode] :
          (modesCache[modesCode] = calcDecimals(modesCode));
      if (opcode == 1) {
        setArgument(3, getArgument(1) + getArgument(2));
        i += 4;
      } else if (opcode == 2) {
        setArgument(3, getArgument(1) * getArgument(2));
        i += 4;
      } else if (opcode == 3) {
        const value = input.length ? input.shift() : yield;
        assert(value != undefined, value);
        setArgument(1, value);
        i += 2;
      } else if (opcode == 4) {
        const value = getArgument(1);
        if (output) {
          output.push(value);
        } else {
          yield value;
        }
        i += 2;
      } else if (opcode == 5) {
        if (getArgument(1)) {
          i = getArgument(2);
        } else {
          i += 3;
        }
      } else if (opcode == 6) {
        if (!getArgument(1)) {
          i = getArgument(2);
        } else {
          i += 3;
        }
      } else if (opcode == 7) {
        if (getArgument(1) < getArgument(2)) {
          setArgument(3, 1);
        } else {
          setArgument(3, 0);
        }
        i += 4;
      } else if (opcode == 8) {
        if (getArgument(1) == getArgument(2)) {
          setArgument(3, 1);
        } else {
          setArgument(3, 0);
        }
        i += 4;
      } else if (opcode == 9) {
        relative_base += getArgument(1);
        i += 2;
      } else if (opcode == 99) {
        break;
      } else {
        assert(0, 'Wrong opcode: ', prog[i], i);
        break;
      }
    }
    assert(!input.length, 'Unconsumed input: ', input);
  }
}

function test(prog) {
  const MOVES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  let program = new Program(prog);
  let map = [['.']];
  let [robox, roboy] = [0, 0];

  function moveRoboTo(dx, dy) {
    for (let i = 0; i < MOVES.length; ++i) {
      let [mx, my] = MOVES[i];
      if (mx == dx && my == dy) {
        console.assert(program.awaitsInput());
        program.provideInput(i + 1);
        console.assert(program.awaitsOutput());
        let result = program.consumeOutput();
        if (result != 0) {
          robox += dx;
          roboy += dy;
        }
        return result;
      }
    }
    console.assert(0, 'Failed to move the robo: ', dx, dy);
    return -1;
  }

  function moveToOnExploredMap(tx, ty) {
    let queue = [[robox, roboy]];
    let prev = [];
    while (queue.length) {
      let [x, y] = queue.shift();
      if (x == tx && y == ty) {
        let path = [];
        while (x != robox || y != roboy) {
          console.assert(prev[y][x] !== undefined);
          path.push(prev[y][x]);
          let [dx, dy] = prev[y][x];
          x -= dx;
          y -= dy;
        }
        path.reverse();
        for (let [dx, dy] of path) {
          let result = moveRoboTo(dx, dy);
          console.assert(result != 0);
        }
        console.assert(robox == tx && roboy == ty);
        return;
      }
      for (let [dx, dy] of MOVES) {
        let [nx, ny] = [x + dx, y + dy];
        map[ny] = map[ny] || [];
        if (map[ny][nx] !== '.') continue;
        prev[ny] = prev[ny] || [];
        if (prev[ny][nx] !== undefined) continue;
        prev[ny][nx] = [dx, dy];
        queue.push([nx, ny]);
      }
    }
    console.assert(0, 'Failed to reach robo position!', tx, ty);
  }

  let [oxygenx, oxygeny, oxygenTime] = [0, 0, -1];
  function explore() {
    let queue = [[robox, roboy]];
    let nextQueue = [];
    let wave = 0;
    while (queue.length) {
      let [x, y] = queue.shift();
      for (let [dx, dy] of MOVES) {
        moveToOnExploredMap(x, y);
        let [nx, ny] = [x + dx, y + dy];
        map[ny] = map[ny] || [];
        if (map[ny][nx]) continue;
        let result = moveRoboTo(dx, dy);
        if (result == 0)
          map[ny][nx] = '#';
        else if (result == 1) {
          map[ny][nx] = '.';
          nextQueue.push([nx, ny]);
        } else if (result == 2) {
          map[ny][nx] = 'O';
          [oxygenx, oxygeny] = [nx, ny];
          oxygenTime = wave + 1;
        } else {
          console.assert(0, 'Wrong move result:', result);
        }
      }
      if (!queue.length && nextQueue.length) {
        queue = nextQueue;
        nextQueue = [];
        ++wave;
      }
    }
    console.log('Finished exploring at wave:', wave);
  }

  function fillOxygen() {
    let queue = [[oxygenx, oxygeny]];
    let nextQueue = [];
    let wave = 0;
    while (queue.length) {
      let [x, y] = queue.shift();
      for (let [dx, dy] of MOVES) {
        let [nx, ny] = [x + dx, y + dy];
        map[ny] = map[ny] || [];
        if (map[ny][nx] !== '.') continue;
        map[ny][nx] = 'O';
        nextQueue.push([nx, ny]);
      }
      if (!queue.length && nextQueue.length) {
        queue = nextQueue;
        nextQueue = [];
        ++wave;
      }
    }
    return wave;
  }

  function printMap() {
    let [minx, maxx] = [Infinity, -Infinity];
    let [miny, maxy] = [Infinity, -Infinity];
    for (let y in map) {
      miny = Math.min(miny, y);
      maxy = Math.max(maxy, y);
      for (let x in map[y]) {
        minx = Math.min(minx, x);
        maxx = Math.max(maxx, x);
      }
    }
    for (let y = miny; y <= maxy; ++y) {
      let row = [];
      for (let x = minx; x <= maxx; ++x) {
        row.push(map[y][x] || '#');
      }
      console.log(500 + y, row.join(''));
    }
  }

  explore();
  console.log('Time:', oxygenTime);
  printMap();
  let fillTime = fillOxygen();
  printMap();
  console.log('Time to fill:', fillTime);
}

test([3,1033,1008,1033,1,1032,1005,1032,31,1008,1033,2,1032,1005,1032,58,1008,1033,3,1032,1005,1032,81,1008,1033,4,1032,1005,1032,104,99,101,0,1034,1039,101,0,1036,1041,1001,1035,-1,1040,1008,1038,0,1043,102,-1,1043,1032,1,1037,1032,1042,1106,0,124,1002,1034,1,1039,1001,1036,0,1041,1001,1035,1,1040,1008,1038,0,1043,1,1037,1038,1042,1105,1,124,1001,1034,-1,1039,1008,1036,0,1041,1002,1035,1,1040,1001,1038,0,1043,101,0,1037,1042,1105,1,124,1001,1034,1,1039,1008,1036,0,1041,101,0,1035,1040,102,1,1038,1043,1001,1037,0,1042,1006,1039,217,1006,1040,217,1008,1039,40,1032,1005,1032,217,1008,1040,40,1032,1005,1032,217,1008,1039,1,1032,1006,1032,165,1008,1040,7,1032,1006,1032,165,1101,2,0,1044,1105,1,224,2,1041,1043,1032,1006,1032,179,1102,1,1,1044,1106,0,224,1,1041,1043,1032,1006,1032,217,1,1042,1043,1032,1001,1032,-1,1032,1002,1032,39,1032,1,1032,1039,1032,101,-1,1032,1032,101,252,1032,211,1007,0,45,1044,1106,0,224,1102,1,0,1044,1105,1,224,1006,1044,247,101,0,1039,1034,1001,1040,0,1035,102,1,1041,1036,1002,1043,1,1038,1001,1042,0,1037,4,1044,1105,1,0,20,12,24,92,28,41,2,48,89,3,20,28,54,25,52,5,1,6,33,88,74,9,9,37,88,28,76,41,47,37,36,57,47,29,66,5,85,31,41,36,91,73,35,57,47,84,35,24,73,58,46,6,12,33,71,36,91,84,10,11,63,23,54,49,36,43,17,37,67,92,8,90,27,35,73,21,43,93,43,23,73,13,21,92,17,93,9,82,29,43,75,91,64,28,78,83,6,5,87,81,44,44,25,64,36,90,89,39,50,1,99,8,46,61,82,44,30,92,83,27,9,58,96,4,48,22,98,22,14,58,11,36,98,14,71,29,63,95,23,70,74,20,97,35,96,18,29,68,20,69,39,56,2,37,82,15,34,29,88,86,11,13,75,1,73,48,59,71,44,42,83,89,17,53,82,1,70,35,79,28,82,62,2,62,8,79,11,20,27,50,6,77,47,27,4,24,64,37,22,84,27,49,40,13,98,25,28,98,94,18,10,40,95,6,27,11,54,43,30,53,5,72,73,92,44,30,61,9,97,84,18,30,65,17,34,75,86,47,1,32,14,70,32,27,84,65,63,37,57,90,25,64,7,54,76,29,94,33,53,29,58,21,3,81,88,50,16,53,24,28,96,64,12,36,67,13,33,67,78,43,90,20,46,31,44,87,30,35,85,94,22,86,12,63,92,6,43,24,47,26,64,77,39,21,76,9,63,79,17,34,61,4,1,19,63,89,30,85,19,95,58,91,16,97,35,50,81,3,59,37,96,17,79,12,46,81,9,64,47,10,48,25,64,2,62,69,23,32,71,77,41,28,65,98,7,39,76,31,61,41,18,56,39,80,95,24,41,38,97,29,32,65,42,97,10,91,68,5,27,55,35,94,4,10,69,22,40,2,81,5,88,1,99,3,99,75,7,87,60,39,26,53,14,20,80,94,2,49,19,79,41,46,42,9,82,13,51,76,19,75,18,28,89,56,21,92,86,17,58,17,30,50,19,34,47,71,1,93,21,36,90,77,40,20,80,63,17,7,52,79,10,53,64,24,40,4,64,24,39,77,55,31,29,91,77,46,36,15,44,96,22,19,98,76,2,20,9,99,76,2,87,84,31,47,3,16,95,84,4,32,13,56,34,79,93,18,89,92,12,92,80,33,78,42,76,33,14,42,64,81,5,54,15,92,97,56,29,5,63,21,6,76,58,65,28,29,58,18,73,49,25,95,59,40,59,5,15,72,36,62,43,77,1,20,48,31,90,22,63,21,79,31,75,24,21,64,84,16,65,91,38,35,29,57,72,61,73,5,35,94,36,16,66,17,88,56,6,41,75,6,25,87,27,68,42,23,66,19,21,76,2,33,92,21,76,44,30,79,42,46,63,59,41,94,20,66,3,71,60,54,82,2,17,98,38,90,95,3,15,65,53,39,92,6,20,62,53,33,12,52,92,39,60,72,41,86,16,40,25,63,14,21,32,24,10,68,97,38,33,40,97,93,43,40,1,94,84,27,23,71,9,68,32,19,15,25,71,57,10,52,25,92,12,72,90,42,97,79,4,73,83,25,80,26,68,35,8,91,47,43,15,57,76,68,37,29,92,92,24,52,53,37,26,94,23,49,18,20,63,38,5,15,77,66,39,89,14,20,19,80,15,63,81,3,60,74,13,33,85,71,94,7,18,95,75,34,73,23,28,99,35,77,60,71,37,74,43,50,46,55,28,97,16,90,21,60,89,88,52,48,39,72,3,46,43,77,17,79,20,71,41,67,26,99,13,54,90,64,20,75,0,0,21,21,1,10,1,0,0,0,0,0,0]);
})();
