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
    // we have number with max 12 decimal number, so round to 12 decimal 
    // and skip other decimals therefore, the calculation error will be fixed.
    //
    // For example it fix calculation error for number represented by as:
    // x.xxx xxx xxx xxx 99x
    var y1 = decimalRound(x, -12); 
    var y2 = decimalRound(y1, -2);
    return y2;
}

export {myfunc1};
export {moneyRound};
export {epsEqu};
export {decimalRound};

