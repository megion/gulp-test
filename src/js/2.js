
var badLine = 333;
console.log(badLine);

//$('#el1').off('.dropdown.data-api');
$('#el1').on('click', function(e, options) {
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

