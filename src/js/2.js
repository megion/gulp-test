
var badLine = 333;
console.log(badLine);

//$('#el1').off('.dropdown.data-api');
$('#el1').on('click', function(e, options) {
    var t = math.format(5.1 * 112.35, 14);
    console.log("t: ", t);
    console.log('click:', e);
    if(options && options.enableDefaultClickEvent) {
        console.log('Exit: enableDefaultClickEvent');
        return;
    }

    var parent = $('#el1').parent();
    var isActive = parent.hasClass('open');
    if(isActive) {
        console.log('Exit: isActive');
        return;
    }

    e.stopPropagation();
    e.preventDefault();
    if($('#el1').data("isPromiseRunnig")) {
        return;
    }
    
    $('#el1').data("isPromiseRunnig", true);
    setTimeout(function() {
        $('#el1').data("isPromiseRunnig", false);
        $('#el1').trigger( "click" , [ {enableDefaultClickEvent: true} ]);
    }, 3000);
});

console.log(math.format(5.1 * 112.35, 14)); // 2i

// Closure
(function() {
    /**
     * Decimal adjustment of a number.
     *
     * @param {String}  type  The type of adjustment.
     * @param {Number}  value The number.
     * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
     * @returns {Number} The adjusted value.
     */
    function decimalAdjust(type, value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (value === null || isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // If the value is negative...
        if (value < 0) {
            return -decimalAdjust(type, -value, exp);
        }
        // Shift
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    // Decimal round
    if (!Math.round10) {
        Math.round10 = function(value, exp) {
            return decimalAdjust('round', value, exp);
        };
    }
    // Decimal floor
    if (!Math.floor10) {
        Math.floor10 = function(value, exp) {
            return decimalAdjust('floor', value, exp);
        };
    }
    // Decimal ceil
    if (!Math.ceil10) {
        Math.ceil10 = function(value, exp) {
            return decimalAdjust('ceil', value, exp);
        };
    }
})();

console.log(Math.round10(55.55, -1));   // 55.6
console.log(Math.round10(55.549, -1));  // 55.5
/**
 * 6.744 999 999 999 999 // 15
 * 410.304 999 999 999 95 // 14
 * 1376.110 000 000 000 1 // 13 
 */

/**
 * Функция принимает два аргумента: первый — текущий расчет,
 * второй — ожидаемый результат. Она возвращает сравнение двух:
 * epsEqu(0.1 + 0.2, 0.3)
 * > true
 */
function epsEqu(x, y) {
    return Math.abs(x - y) < Number.EPSILON * Math.max(Math.abs(x), Math.abs(y));
}

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

function moneyRound(x) {
    // first round for correction erro float number
    var y1 = decimalRound(x, -12); 
    var y2;
    if(epsEqu(x, y1)) {
        // second round for money round
        y2 = decimalRound(y1, -2); 
    } else {
        // first round has error so exclude first round
        console.warn("first round has error:", x, y1);
        y2 = decimalRound(x, -2);  
    }
    return y2;
}


