
var badLine = 333;
console.log(badLine);

//$('#el1').off('.dropdown.data-api');
//$('#el1').on('click', function(e, options) {
    //console.log("t: ", t);
    //console.log('click:', e);
    //if(options && options.enableDefaultClickEvent) {
        //console.log('Exit: enableDefaultClickEvent');
        //return;
    //}

    //var parent = $('#el1').parent();
    //var isActive = parent.hasClass('open');
    //if(isActive) {
        //console.log('Exit: isActive');
        //return;
    //}

    //e.stopPropagation();
    //e.preventDefault();
    //if($('#el1').data("isPromiseRunnig")) {
        //return;
    //}
    
    //$('#el1').data("isPromiseRunnig", true);
    //setTimeout(function() {
        //$('#el1').data("isPromiseRunnig", false);
        //$('#el1').trigger( "click" , [ {enableDefaultClickEvent: true} ]);
    //}, 3000);
//});

import {myfunc1} from "./1";
import {moneyRound} from "./1";
import {epsEqu} from "./1";
import {decimalRound} from "./1";

myfunc1();

var v1 = moneyRound(5.794999999999999);
console.log(`v1: ${v1}`);

// 4.794 999 999 999 998 (15 fractions)
var v2 = moneyRound(4.794999999999998);
console.log(`v2: ${v2}`);

window.moneyRound = moneyRound;
window.epsEqu = epsEqu;
window.decimalRound = decimalRound;

