describe('payment-document-calculation-amount-utils.js test', function () {
    var BillsPaymentDocumentCalculationAmountUtils,
        $httpBackend;

    beforeEach(module('bills.payment-document-calculation-amount-utils'));
    //beforeEach(module('bills.round-money-utils'));

    //beforeEach(inject(function (_$compile_, _$rootScope_, _BillsPaymentDocumentCalculationAmountUtils_, 
        //_$httpBackend_) {

        //BillsPaymentDocumentCalculationAmountUtils = _BillsPaymentDocumentCalculationAmountUtils_;

        //$httpBackend = _$httpBackend_;
        //$httpBackend.when('POST', '/suim/api/rest/services/createSession')
            //.respond('OK, mocked');
        //$httpBackend.when('POST', '/suim/api/rest/services/reportError')
            //.respond('OK, mocked');

    //}));

    describe('BillsPaymentDocumentCalculationAmountUtils findAmountStartNode', function() {

        beforeEach(function() {
        });

        it('should find start node', function() {
            //var node = BillsPaymentDocumentCalculationAmountUtils.findAmountStartNode('P14');
            
            //expect(node).toBeNotNull();
            //expect(node.name).toBe('P14');
        });
        
    });

});
