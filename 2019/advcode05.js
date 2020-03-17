(function(){

function verify(prog, index) {
  console.assert(0 <= index);
  console.assert(index < prog.length);
  console.assert(0 <= prog[index]);
  console.assert(prog[index] < prog.length);
}

function getModes(x) {
    let result = [];
    while (x) {
        result.push(x % 10);
        x = Math.floor(x / 10);
    }
    return result;
}

function getArgument(prog, modes, opcodeIndex, argIndex) {
    const mode = modes[argIndex - 1] || 0;
    const index = opcodeIndex + argIndex;
    if (mode == 0) {
        verify(prog, index);
        return prog[prog[index]];
    } else if (mode == 1) {
        return prog[index];
    } else {
        console.assert(0, mode, index);
    }
}

function run(prog, input, output) {
  for (let i = 0; i < prog.length;) {
    const opcode = prog[i] % 100;
    let modes = getModes(Math.floor(prog[i] / 100));
    if (opcode == 99) break;
    if (opcode == 1) {
      prog[prog[i+3]] = getArgument(prog, modes, i, 1) + getArgument(prog, modes, i, 2);
      i += 4;
    } else if (opcode == 2) {
      prog[prog[i+3]] = getArgument(prog, modes, i, 1) * getArgument(prog, modes, i, 2);
      i += 4;
    } else if (opcode == 3) {
        console.assert(input.length);
        prog[prog[i+1]] = input.shift();
        i += 2;
    } else if (opcode == 4) {
        output.push(getArgument(prog, modes, i, 1));
        i += 2;
    } else if (opcode == 5) {
        if (getArgument(prog, modes, i, 1)) {
            i = getArgument(prog, modes, i, 2);
        } else {
            i += 3;
        }
    } else if (opcode == 6) {
        if (!getArgument(prog, modes, i, 1)) {
            i = getArgument(prog, modes, i, 2);
        } else {
            i += 3;
        }
    } else if (opcode == 7) {
        if (getArgument(prog, modes, i, 1) < getArgument(prog, modes, i, 2)) {
            prog[prog[i+3]] = 1;
        } else {
            prog[prog[i+3]] = 0;
        }
        i += 4;
    } else if (opcode == 8) {
        if (getArgument(prog, modes, i, 1) == getArgument(prog, modes, i, 2)) {
            prog[prog[i+3]] = 1;
        } else {
            prog[prog[i+3]] = 0;
        }
        i += 4;
    } else {
      console.assert(0, prog[i]);
      break;
    }
  }
  return prog[0];
}

function test(prog, input = []) {
    let output = [];
    run(prog, input, output);
    console.log(output);
}

// test([3,9,8,9,10,9,4,9,99,-1,8], [8]);
// test([3,9,7,9,10,9,4,9,99,-1,8], [3])
// test([3,3,1108,-1,8,3,4,3,99], [22]);
// test([3,3,1107,-1,8,3,4,3,99], [-221]);

// test([3,12,6,12,15,1,13,14,13,4,13,99,-1,0,1,9], [10]);
// test([3,3,1105,-1,9,1101,0,0,12,4,12,99,1], [10]);

// test([3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,
// 1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,
// 999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99], [9]);

// test([1002,4,3,4,33]);
// test([1101,100,-1,4,0])

// test([1,0,0,0,99]);
// test([2,3,0,3,99]);
// test([2,4,4,5,99,0]);
// test([1,1,1,4,99,5,6,0,99]);

let output=[];
run([3,225,1,225,6,6,1100,1,238,225,104,0,1101,65,73,225,1101,37,7,225,1101,42,58,225,1102,62,44,224,101,-2728,224,224,4,224,102,8,223,223,101,6,224,224,1,223,224,223,1,69,126,224,101,-92,224,224,4,224,1002,223,8,223,101,7,224,224,1,223,224,223,1102,41,84,225,1001,22,92,224,101,-150,224,224,4,224,102,8,223,223,101,3,224,224,1,224,223,223,1101,80,65,225,1101,32,13,224,101,-45,224,224,4,224,102,8,223,223,101,1,224,224,1,224,223,223,1101,21,18,225,1102,5,51,225,2,17,14,224,1001,224,-2701,224,4,224,1002,223,8,223,101,4,224,224,1,223,224,223,101,68,95,224,101,-148,224,224,4,224,1002,223,8,223,101,1,224,224,1,223,224,223,1102,12,22,225,102,58,173,224,1001,224,-696,224,4,224,1002,223,8,223,1001,224,6,224,1,223,224,223,1002,121,62,224,1001,224,-1302,224,4,224,1002,223,8,223,101,4,224,224,1,223,224,223,4,223,99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,225,1101,314,0,0,106,0,0,1105,1,99999,1008,226,677,224,102,2,223,223,1005,224,329,1001,223,1,223,7,677,226,224,102,2,223,223,1006,224,344,1001,223,1,223,1007,226,677,224,1002,223,2,223,1006,224,359,1001,223,1,223,1007,677,677,224,102,2,223,223,1005,224,374,1001,223,1,223,108,677,677,224,102,2,223,223,1006,224,389,101,1,223,223,8,226,677,224,102,2,223,223,1005,224,404,101,1,223,223,7,226,677,224,1002,223,2,223,1005,224,419,101,1,223,223,8,677,226,224,1002,223,2,223,1005,224,434,101,1,223,223,107,677,677,224,1002,223,2,223,1006,224,449,101,1,223,223,7,677,677,224,1002,223,2,223,1006,224,464,101,1,223,223,1107,226,226,224,102,2,223,223,1006,224,479,1001,223,1,223,1007,226,226,224,102,2,223,223,1006,224,494,101,1,223,223,108,226,677,224,1002,223,2,223,1006,224,509,101,1,223,223,1108,226,677,224,102,2,223,223,1006,224,524,1001,223,1,223,1008,226,226,224,1002,223,2,223,1005,224,539,101,1,223,223,107,226,226,224,102,2,223,223,1006,224,554,101,1,223,223,8,677,677,224,102,2,223,223,1005,224,569,101,1,223,223,107,226,677,224,102,2,223,223,1005,224,584,101,1,223,223,1108,226,226,224,1002,223,2,223,1005,224,599,1001,223,1,223,1008,677,677,224,1002,223,2,223,1005,224,614,101,1,223,223,1107,226,677,224,102,2,223,223,1005,224,629,101,1,223,223,1108,677,226,224,1002,223,2,223,1005,224,644,1001,223,1,223,1107,677,226,224,1002,223,2,223,1006,224,659,1001,223,1,223,108,226,226,224,102,2,223,223,1006,224,674,101,1,223,223,4,223,99,226],
  [5], output);
console.log(output);

})();