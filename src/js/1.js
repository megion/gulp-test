'use strict';

let a = 5;
function myfunc1() {
    console.log(`hello world ${a} test `);
}

let inc = x => x+1;

console.log(`inc function call result ${inc(1)} test `);

export {myfunc1};
