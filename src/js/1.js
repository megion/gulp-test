'use strict';

let a = 5;
function myfunc1() {
    console.log(`hello world ${a} test `);
}

let inc = x => x+1;

console.log(`inc function call result ${inc(1)} test `);

// polyfill
var NUMBER_EPSILON;
if (Number.EPSILON === undefined) {
    NUMBER_EPSILON = Math.pow(2, -52);
} else {
    NUMBER_EPSILON = Number.EPSILON;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
 * Функция принимает два аргумента: первый — текущий расчет,
 * второй — ожидаемый результат. Она возвращает сравнение двух:
 * epsEqu(0.1 + 0.2, 0.3)
 * > true
 */
function epsEqu(x, y) {
    return Math.abs(x - y) < NUMBER_EPSILON * Math.max(Math.abs(x), Math.abs(y));
}

/**
 * see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
 */
function decimalRound(value, exp) {
    value = +value;
    exp = +exp;
    // If the value is negative...
    if (value < 0) {
        return -decimalRound(-value, exp);
    }
    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

/**
 * examples calculation with errors:
 * 5.1 * 112.35
 * 1.9 * 215.95
 * 1.9 * 3.55
 * 1296.03 - 36.62 + 116.70
 */
function moneyRound(x) {
    if(x === 0) {
        return x;
    }
    // first round for correction erro float number
    var y1 = decimalRound(x, -12); 
    var y2;
    if(epsEqu(x, y1)) {
        // second round for money round
        y2 = decimalRound(y1, -2); 
    } else {
        // first round has error so exclude first round
        // for example, this error will happen if x = 6.744999999999899 where 
        // (the digit 8 in position 13) 
        //console.warn("first round has error:", x, y1);
        y2 = decimalRound(x, -2);  
    }
    return y2;
}

export {myfunc1};
export {moneyRound};
