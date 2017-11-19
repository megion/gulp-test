/**
 * HCSANALYST-5048: Приложение 7. Формулы расчета значений полей платежного документа
 */
angular.module('bills.payment-document-calculation-amount-utils', [
    'bills.ef-ls-pdtb-utils',
    'bills.round-money-utils'
])
    .factory('BillsPaymentDocumentCalculationAmountUtils', ['PDChargesUtils', 'BillsRoundMoneyUtils',
        function (PDChargesUtils, BillsRoundMoneyUtils) {

            function getNumber(number) {
                var res = parseFloat(number);
                return isNaN(res) ? 0 : res;
            }

            function getNumberOrNull(number) {
                var res = parseFloat(number);
                return isNaN(res) ? null : res;
            }

            /**
             * вычисление суммы поля total для указанного списка услуг 
             */
            function calculateSumTotals(rows, filterFn) {
                var total = 0;
                var hasValues = false;
                angular.forEach(rows, function (row) {
                    var b = filterFn ? filterFn(row) : true;
                    var t = getNumberOrNull(row.charge.total);
                    if (b && (t !== null)) {
                        total += t;
                        hasValues = true;
                    }
                });
                if (hasValues) {
                    return BillsRoundMoneyUtils.mathRoundFixed2(total);
                } else {
                    return null;
                }
            }

            /**
             * create array contains PDTB services
             */
            function pdtbAccountServicesAsArray(accountServices) {
                return accountServices.housingServices
                    .concat(accountServices.municipalServices)
                    .concat(accountServices.additionalServices)
                    .concat(accountServices.municipalResourcesInApartmentBuilding);
            }

            /**
             * вычисление ЭФ_ЛС_ПДТБ.18.1 «Размер платы за ком. услуги, индив. потреб.»
             * Рассчитывается только для строк с главными коммунальными услугами
             *
             * П6 = П1*П5
             */
            function calculateIndividualConsumptionPayment(row) {
                var tariff = getNumberOrNull(row.charge.tariff);
                var individualConsumption = getNumberOrNull(row.charge.individualConsumption);

                if ((tariff === null) || (individualConsumption === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(tariff * individualConsumption);
                }
            }

            /**
             * вычисление ЭФ_ЛС_ПДТБ.18.2 «Размер платы за ком. услуги, общедом. нужды»
             * Рассчитывается только для строк с:
             * - главными коммунальными услугами
             * - КР на СОИ
             *
             * П7 = П3*П5
             */
            function calculateHouseOverallNeedsTotalPayment(row) {
                var tariff = getNumberOrNull(row.charge.tariff);
                var houseOverallNeeds = getNumberOrNull(row.charge.houseOverallNeeds);

                if ((tariff === null) || (houseOverallNeeds === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(tariff * houseOverallNeeds);
                }
            }

            /**
             * расчет ЭФ_ЛС_ПДТБ.30
             * «Размер превышения платы рассчитанной с применением повышающего коэффициента над размером платы,
             * рассчитанной без учета повышающего коэффициента»
             * Рассчитывается только для строк с главными коммунальными услугами
             * Поле информативное и Не участвует в дальнейших расчетах.
             * Ячейка не рассчитывается и отображается пустой, если все операнды формулы пустые (не заданы или не рассчитаны).
             * ФОРМУЛА:
             *
             * П10 = (П6(если П2 = Норматив)+П7(П7 если П4 = Норматив))*(П9-1)
             *
             * ЭФ_ЛС_ПДТБ.30 = (ЭФ_ЛС_ПДТБ.18.1(1) + ЭФ_ЛС_ПДТБ.18.2(2))*(ЭФ_ЛС_ПДТБ.28 - 1)
             *
             * (1)ЭФ_ЛС_ПДТБ.18.1 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.3 выбрано значение «Норматив».
             * (2)ЭФ_ЛС_ПДТБ.18.2 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.4 выбрано значение «Норматив».
             */
            function calculateOverpaymentAmount(row) {
                var paymentRate = getNumberOrNull(row.charge.paymentRate);
                var individualConsumptionPayment = getNumberOrNull(row.charge.individualConsumptionPayment);
                var houseOverallNeedsTotalPayment = getNumberOrNull(row.charge.houseOverallNeedsTotalPayment);

                if (( ((individualConsumptionPayment === null) || (row.charge.individualConsumptionType !== 'NORM')) &&
                    ((houseOverallNeedsTotalPayment === null) || (row.charge.houseOverallNeedsType !== 'NORM')) ) ||
                    ((paymentRate === null) || (paymentRate===0)) ||
                    !PDChargesUtils.canEditPaymentRate(row)) {
                    return null;
                } else {
                    var overpaymentAmount = 0;
                    if ((individualConsumptionPayment !== null) && (row.charge.individualConsumptionType === 'NORM')) {
                        overpaymentAmount += individualConsumptionPayment;
                    }
                    if ((houseOverallNeedsTotalPayment !== null) && (row.charge.houseOverallNeedsType === 'NORM')) {
                        overpaymentAmount += houseOverallNeedsTotalPayment;
                    }
                    return BillsRoundMoneyUtils.mathRoundFixed2(overpaymentAmount*(paymentRate-1));
                }
            }

            /**
             * расчет ЭФ_ЛС_ПДТБ.25 Всего начислено за расчетный период, руб.
             *
             * ФОРМУЛА П8
             *
             * Для ЖУ (кроме код записи = 11 "Страхования"):
             * Платежный документ.Общая площадь*П5
             * Для остальных услуг:
             * П6+П7
             */
            function calculateCharged(row, paymentDocument) {
                var individualConsumptionPayment = getNumberOrNull(row.charge.individualConsumptionPayment);
                var houseOverallNeedsTotalPayment = getNumberOrNull(row.charge.houseOverallNeedsTotalPayment);
                var tariff = getNumberOrNull(row.charge.tariff);
                var totalSquare = getNumberOrNull(paymentDocument.totalSquare);

                if (PDChargesUtils.isHousingService(row)) {
                    if ((row.charge.tariff === null) || (paymentDocument.totalSquare === null)) {
                        return null;
                    } else {
                        return BillsRoundMoneyUtils.mathRoundFixed2(totalSquare*tariff);
                    }
                } else {
                    if ((individualConsumptionPayment === null) || ((houseOverallNeedsTotalPayment === null))) {
                        return null;
                    } else {
                        return BillsRoundMoneyUtils.mathRoundFixed2(individualConsumptionPayment +
                            houseOverallNeedsTotalPayment);
                    }
                }
            }

            /**
             * П14 вычисление ЭФ_ЛС_ПДТБ.21.2 Ячейка «Итого к оплате. КУ. ИНД»
             * ФОРМУЛА:
             * (ЭФ_ЛС_ПДТБ.18.1 * ЭФ_ЛС_ПДТБ.28) + ЭФ_ЛС_ПДТБ.19 - ЭФ_ЛС_ПДТБ.20
             * ЭФ_ЛС_ПДТБ.28 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.3 выбрано значение «Норматив»
             *
             * П14 = П6*П9(если П2 = Норматив)+П11-П12
             */
            function calculateIndividualConsumptionTotal(row) {
                var individualConsumptionPayment = getNumberOrNull(row.charge.individualConsumptionPayment);
                // высчитать individualConsumptionTotal только если задано individualConsumptionPayment как число
                if (individualConsumptionPayment === null) {
                    return null;
                } 

                var k = 1;
                if(PDChargesUtils.canEditPaymentRate(row)) {
                    var paymentRate = getNumberOrNull(row.charge.paymentRate);
                    if ( (paymentRate !== null) && (paymentRate!==0)) {
                        if (row.charge.individualConsumptionType === 'NORM') {
                            k = paymentRate;
                        }
                    }
                }

                return BillsRoundMoneyUtils.mathRoundFixed2(individualConsumptionPayment*k +
                    getNumber(row.charge.adjustment) -
                    Math.abs(getNumber(row.charge.grant))); // HCS-35172
            }


            /**
             * П15 вычисление ЭФ_ЛС_ПДТБ.21.3 Ячейка «Итого к оплате. КУ. ОБЩ»
             * ФОРМУЛА:
             * (ЭФ_ЛС_ПДТБ.18.2 * ЭФ_ЛС_ПДТБ.28) + ЭФ_ЛС_ПДТБ.19 - ЭФ_ЛС_ПДТБ.20
             * ЭФ_ЛС_ПДТБ.28 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.4 выбрано значение «Норматив».
             *
             * П15 = П7*П9(если П4 = Норматив)+П11-П12
             */
            function calculateHouseOverallNeedsTotal(row) {
                var houseOverallNeedsTotalPayment = getNumberOrNull(row.charge.houseOverallNeedsTotalPayment);
                if (houseOverallNeedsTotalPayment === null) {
                    return null;
                } 

                var k = 1;
                if(PDChargesUtils.canEditPaymentRate(row)) {
                    var paymentRate = getNumberOrNull(row.charge.paymentRate);
                    if ( (paymentRate !== null) && (paymentRate!==0)) {
                        if (row.charge.houseOverallNeedsType === 'NORM') {
                            k = paymentRate;
                        }
                    }
                }

                return BillsRoundMoneyUtils.mathRoundFixed2(houseOverallNeedsTotalPayment*k +
                    getNumber(row.charge.adjustment) -
                    Math.abs(getNumber(row.charge.grant))); // HCS-35172
            }


            /**
             * П13 Вычисление ЭФ_ЛС_ПДТБ.21.1 Ячейка «Итого к оплате. Всего»
             *
             * Для ГКУ:
             * П13 = П6*П9(если П2 = Норматив)+П7*П9(если П4 = Норматив)+П11-П12
             * Для остальных услуг:
             * П13 = П8+П11-П12
             *
             * ФОРМУЛА для вычисления ЭФ_ЛС_ПДТБ.21.1:
             *
             * 1) Для коммунальных услуг рассчитывается как:
             * ЭФ_ЛС_ПДТБ.21.1 = (ЭФ_ЛС_ПДТБ.18.1 * ЭФ_ЛС_ПДТБ.28(1))+(ЭФ_ЛС_ПДТБ.18.2 * ЭФ_ЛС_ПДТБ.28(2)) +
             * ЭФ_ЛС_ПДТБ.19 - ЭФ_ЛС_ПДТБ.20
             *
             * (1)ЭФ_ЛС_ПДТБ.28 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.3 выбрано значение «Норматив»
             * (2)ЭФ_ЛС_ПДТБ.28 участвует в расчетах только если в ЭФ_ЛС_ПДТБ.16.4 выбрано значение «Норматив»
             *
             * Примечаение для ЭФ_ЛС_ПДТБ.28:
             * Ячейка доступна только для строк раздела «Коммунальные услуги, в т.ч.»,
             * для остальных строк отображается прочерк «–».
             * Ячейка недоступна для ввода (заблокирована), ~~а значение очищается~~ 
             * (в расчетах принимается равным 1), для строк коммунальных услуг,
             * если в соответствующей строке в ЭФ_ЛС_ПДТБ.16.3 и ЭФ_ЛС_ПДТБ.16.4 выбраны значения НЕотличные от
             * «Норматив».
             * Если ячейка заблокирована ИЛИ значение ячейки «0», то в расчетах не участвует.
             *
             *
             * 2) Для остальных типов услуг рассчитывается как:
             * ЭФ_ЛС_ПДТБ.21.1 = ЭФ_ЛС_ПДТБ.25 + ЭФ_ЛС_ПДТБ.19 - ЭФ_ЛС_ПДТБ.20
             *
             * где:
             * ЭФ_ЛС_ПДТБ.19	Ячейка «Перерасчеты»
             * ЭФ_ЛС_ПДТБ.20	Ячейка «Льготы, субсидии»
             */
            function calculateTotal(row) {
                // ЭФ_ЛС_ПДТБ.18.1
                var individualConsumptionPayment = getNumberOrNull(row.charge.individualConsumptionPayment);
                // ЭФ_ЛС_ПДТБ.18.2
                var houseOverallNeedsTotalPayment = getNumberOrNull(row.charge.houseOverallNeedsTotalPayment);
                // ЭФ_ЛС_ПДТБ.19
                var adjustment = getNumberOrNull(row.charge.adjustment);
                // ЭФ_ЛС_ПДТБ.20
                var grant = getNumberOrNull(row.charge.grant);
                // ЭФ_ЛС_ПДТБ.25
                var charged = getNumberOrNull(row.charge.charged);

                // вычисление ЭФ_ЛС_ПДТБ.21.1
                // Для коммунальных услуг
                
                if (PDChargesUtils.isMunicipalService(row)) {
                    if ((individualConsumptionPayment === null) &&
                        (houseOverallNeedsTotalPayment === null) &&
                        (adjustment === null) &&
                        (grant === null)) {
                        return null;
                    } else {
                        var k1 = 1, k2 = 1;

                        if(PDChargesUtils.canEditPaymentRate(row)) {
                            var paymentRate = getNumberOrNull(row.charge.paymentRate);
                            if ( (paymentRate !== null) && (paymentRate!==0)) {
                                if (row.charge.individualConsumptionType === 'NORM') {
                                    k1 = paymentRate;
                                }
                                if (row.charge.houseOverallNeedsType === 'NORM') {
                                    k2 = paymentRate;
                                }
                            }
                        }
                        
                        return BillsRoundMoneyUtils.mathRoundFixed2(k1*individualConsumptionPayment + 
                            k2*houseOverallNeedsTotalPayment + adjustment - Math.abs(grant)); // HCS-35172
                    }
                } else { // Для остальных типов услуг
                    if ((charged === null) &&
                        (adjustment === null) &&
                        (grant === null)) {
                        return null;
                    } else {
                        return BillsRoundMoneyUtils.mathRoundFixed2(charged + row.charge.adjustment -
                        Math.abs(grant)); // HCS-35172
                    }
                }
            }

            /**
             * Вычисление ЭФ_ЛС_ПДТБ.23.1 «Итоговая сумма к оплате по всем услугам»»
             * П16 = ∑ П13
             */
            function calculateAccountServicesTotal(accountServices) {
                // В иттоговую сумму не включаются суммы по строкам, соответсвующим
                // коммунальным ресурсам на содержание общего имущества в МКД
                var rows = pdtbAccountServicesAsArray(accountServices);
                return calculateSumTotals(rows, function(row) {
                    return !PDChargesUtils.isMunicipalResourceInApartmentBuilding(row);
                });
            }

            /**
             * Вычисление ЭФ_ЛС_ПДНСР.12 Итого к оплате по неустойкам и судебным издержкам
             * П21 = ∑ П13(ЭФ_ЛС_ПДНСР.11)
             * П21 - fake field, do not sent to backend(only for show on UI)
             */
            function calculatePenaltiesServicesTotal(accountServices) {
                return calculateSumTotals(accountServices.penaltiesServices);
            }

            /**
             * ЭФ_ЛС_БИАЗ.05 (Сумма к оплате за растчетный период)
             * PaymentDocument.total
             *
             * Текущий ПД
             * П17 = П16+П13(Взнос на капитальный ремонт)+П21
             * ЭФ_ЛС_БИАЗ.05 = ЭФ_ЛС_ПДТБ.23.1 + ЭФ_ЛС_ПДКР.16 + ЭФ_ЛС_ПДНСР.12
             *
             * Долговой ПД
             * П17 = П16+П13(Взнос на капитальный ремонт)
             * ЭФ_ЛС_БИАЗ.05 = ЭФ_ЛС_ДПДТБ.07 + ЭФ_ЛС_ДПДКР.06
             *
             */
            function calculatePaymentDocumentTotal(accountServices) {
                // ЭФ_ЛС_ПДТБ.23.1 accountServices.total
                // ЭФ_ЛС_ПДКР.16 ЭФ_ЛС_ДПДКР.06 accountServices.capitalRepairCharge.charge.total
                // ЭФ_ЛС_ПДНСР.12 calculateSumTotals(accountServices.penaltiesServices) - only calculation
                // ЭФ_ЛС_ДПДТБ.07 Итого к оплате за расчетный период accountServices.total
                var accountServicesTotal = getNumberOrNull(accountServices.total);
                var pdnsrTotal = getNumberOrNull(accountServices.penaltiesTotal); // fake field
                var krTotal = getNumberOrNull(accountServices.capitalRepairCharge.charge.total);

                if((accountServicesTotal === null) && (pdnsrTotal === null) && (krTotal === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(accountServicesTotal + pdnsrTotal + krTotal);
                }
            }

            /**
             * ЭФ_ЛС_БИАЗ.04 Итого к оплате с учетом задолженности/ переплаты
             * (подсчитывается для "текущего" платжного документа, для "долгового" нет)
             *
             * PaymentDocument.totalWithDebtAndAdvance
             * ЭФ_ЛС_БИАЗ.04 = ЭФ_ЛС_БИАЗ.05  + ЭФ_ЛС_БИАЗ.01 - ЭФ_ЛС_БИАЗ.02
             *
             * or
             *
             * П20 = П17+П18-П19
             */
            function calculateTotalWithDebtAndAdvance(paymentDocument) {
                // ЭФ_ЛС_БИАЗ.05 Сумма к оплате за расчетный период paymentDocument.total
                // ЭФ_ЛС_БИАЗ.01 paymentDocument.paymentReferenceInformation.previousPeriodDebts
                // ЭФ_ЛС_БИАЗ.02 paymentDocument.paymentReferenceInformation.beginningPeriodAdvance

                if(paymentDocument.type === 'DEBT') {
                    return null;
                }

                var paymentDocumentTotal = getNumberOrNull(paymentDocument.total);
                var previousPeriodDebts = getNumberOrNull(
                    paymentDocument.paymentReferenceInformation.previousPeriodDebts);
                var beginningPeriodAdvance = getNumberOrNull(
                    paymentDocument.paymentReferenceInformation.beginningPeriodAdvance);

                if ((paymentDocumentTotal === null) && (previousPeriodDebts === null) &&
                    (beginningPeriodAdvance === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(paymentDocumentTotal + previousPeriodDebts -
                        Math.abs(beginningPeriodAdvance));
                }
            }

            /**
             * calculate ЭФ_ЛС_ПДКР.16 «Итого к оплате за расчетный период, руб.»
             * Формула: «Всего начислено» + «Перерасчеты» - «Льготы, субсидии» = «Итого к оплате»
             * П13 = П8+П11-П12
             */
            function calculateCapitalRepairTotal(accountServices) {
                var charged = getNumberOrNull(accountServices.capitalRepairCharge.charge.charged);
                var adjustment = getNumberOrNull(accountServices.capitalRepairCharge.charge.adjustment);
                var grant = getNumberOrNull(accountServices.capitalRepairCharge.charge.grant);

                if ((charged === null) && (adjustment === null) && (grant === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(charged + adjustment - Math.abs(grant)); // HCS-35172
                }
            }

            /**
             * calculate ЭФ_ЛС_ПДКР.13 «Всего начислено за расчетный период, руб.»
             *
             * Для ЖУ (кроме код записи = 11 "Страхования"):
             * П8 = Платежный документ.Общая площадь*П5
             */
            function calculateCapitalRepairCharged(accountServices, paymentDocument) {
                var tariff = getNumberOrNull(accountServices.capitalRepairCharge.charge.tariff);
                var totalSquare = getNumberOrNull(paymentDocument.totalSquare);

                if ((tariff === null) && (totalSquare === null)) {
                    return null;
                } else {
                    return BillsRoundMoneyUtils.mathRoundFixed2(tariff*totalSquare);
                }
            }

            /**
             * update P6 - ЭФ_ЛС_ПДТБ.18.1 
             */
            function updateP6(row, accountServices, paymentDocument) {
                var v = calculateIndividualConsumptionPayment(row);
                row.charge.individualConsumptionPayment = v;
                row.charge.norm.individualConsumptionPayment = v;
            }

            /**
             * update P7 - ЭФ_ЛС_ПДТБ.18.2
             */
            function updateP7(row, accountServices, paymentDocument) {
                var v = calculateHouseOverallNeedsTotalPayment(row);
                row.charge.houseOverallNeedsTotalPayment = v;
                row.charge.norm.houseOverallNeedsTotalPayment = v;
            }

            /**
             * update P8 - ЭФ_ЛС_ПДТБ.25
             */
            function updateP8(row, accountServices, paymentDocument) {
                var v = calculateCharged(row, paymentDocument);
                row.charge.charged = v;
                row.charge.norm.charged = v;
            }

            /**
             * update P10 - ЭФ_ЛС_ПДТБ.30
             */
            function updateP10(row, accountServices, paymentDocument) {
                var v = calculateOverpaymentAmount(row);
                row.charge.overpaymentAmount = v;
                row.charge.norm.overpaymentAmount = v;
            }

            /**
             * update P14 - ЭФ_ЛС_ПДТБ.21.2
             */
            function updateP14(row, accountServices, paymentDocument) {
                var v = calculateIndividualConsumptionTotal(row);
                row.charge.individualConsumptionTotal = v;
                row.charge.norm.individualConsumptionTotal = v;
            }

            /**
             * update P15 - ЭФ_ЛС_ПДТБ.21.3
             */
            function updateP15(row, accountServices, paymentDocument) {
                var v = calculateHouseOverallNeedsTotal(row);
                row.charge.houseOverallNeedsTotal = v;
                row.charge.norm.houseOverallNeedsTotal = v;
            }

            /**
             * update P13 - ЭФ_ЛС_ПДТБ.21.1
             */
            function updateP13(row, accountServices, paymentDocument) {
                var v = calculateTotal(row);
                row.charge.total = v;
                row.charge.norm.total = v;
            }

            /**
             * update P16 - ЭФ_ЛС_ПДТБ.23.1
             */
            function updateP16(row, accountServices, paymentDocument) {
                var v = calculateAccountServicesTotal(accountServices);
                accountServices.total = v;
                accountServices.norm.total = v;
            }

            /**
             * update P8_capital_repair - ЭФ_ЛС_ПДКР.13
             */
            function updateP8_capital_repair(row, accountServices, paymentDocument) {
                if(accountServices.capitalRepairCharge) {
                    var v = calculateCapitalRepairCharged(accountServices, paymentDocument);
                    accountServices.capitalRepairCharge.charge.charged = v;
                    accountServices.capitalRepairCharge.charge.norm.charged = v;
                }
            }

            /**
             * update P13_capital_repair - ЭФ_ЛС_ПДКР.13
             */
            function updateP13_capital_repair(row, accountServices, paymentDocument) {
                if(accountServices.capitalRepairCharge) {
                    var v = calculateCapitalRepairTotal(accountServices);
                    accountServices.capitalRepairCharge.charge.total = v;
                    accountServices.capitalRepairCharge.charge.norm.total = v;
                }
            }

            /**
             * update P21 - ЭФ_ЛС_ПДНСР.12
             * not editable fake field
             */
            function updateP21(row, accountServices, paymentDocument) {
                accountServices.penaltiesTotal = calculatePenaltiesServicesTotal(accountServices); 
            }

            /**
             * update P17 - ЭФ_ЛС_БИАЗ.05
             */
            function updateP17(row, accountServices, paymentDocument) {
                var v = calculatePaymentDocumentTotal(accountServices);
                paymentDocument.total = v;
                paymentDocument.norm.total = v;
            }

            /**
             * update P20 - ЭФ_ЛС_БИАЗ.04
             */
            function updateP20(row, accountServices, paymentDocument) {
                var v = calculateTotalWithDebtAndAdvance(paymentDocument);
                paymentDocument.totalWithDebtAndAdvance = v;
                paymentDocument.norm.totalWithDebtAndAdvance = v;
            }

            /**
             * update all calculatable values 
             */
            function updateAllAmounts(row, accountServices, paymentDocument) {
                updateP6(row, accountServices, paymentDocument);
                updateP7(row, accountServices, paymentDocument);
                updateP8(row, accountServices, paymentDocument);
                updateP10(row, accountServices, paymentDocument);
                updateP14(row, accountServices, paymentDocument);
                updateP15(row, accountServices, paymentDocument);
                updateP13(row, accountServices, paymentDocument);
                updateP16(row, accountServices, paymentDocument);
                updateP8_capital_repair(row, accountServices, paymentDocument);
                updateP13_capital_repair(row, accountServices, paymentDocument);
                updateP21(row, accountServices, paymentDocument);
                updateP17(row, accountServices, paymentDocument);
                updateP20(row, accountServices, paymentDocument);
            }

            function createAmountsUpdateTree() {
                // PaymentDocument.totalWithDebtAndAdvance
                var p20 = {
                    name: 'P20',
                    children: [],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP20(row, accountServices, paymentDocument);
                    }
                };

                // --------------------
                var p17 = {
                    name: 'P17',
                    children: [p20],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP17(row, accountServices, paymentDocument);
                    }
                };
                var p18 = {
                    name: 'P18',
                    children: [p20]
                };
                var p19 = {
                    name: 'P19',
                    children: [p20]
                };
                // pdnsr services sum
                var p21 = {
                    name: 'P21',
                    children: [p17],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP21(row, accountServices, paymentDocument);
                    }
                };
                var p13_penalties = {
                    name: 'P13_penalties',
                    children: [p21]
                };
                // --------------------- capital repair
                var p13_capital_repair = {
                    name: 'P13_capital_repair',
                    children: [p17],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        return !!accountServices.capitalRepairCharge;
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP13_capital_repair(row, accountServices, paymentDocument);
                    }

                };
                var p8_capital_repair = {
                    name: 'P8_capital_repair',
                    children: [p13_capital_repair],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP8_capital_repair(row, accountServices, paymentDocument);
                    }
                };
                var p5_capital_repair = {
                    name: 'P5_capital_repair',
                    children: [p8_capital_repair]
                };
                var p11_capital_repair = {
                    name: 'P11_capital_repair',
                    children: [p13_capital_repair]
                };
                var p12_capital_repair = {
                    name: 'P12_capital_repair',
                    children: [p13_capital_repair]
                };               
                
                // sum all row p13
                var p16 = {
                    name: 'P16',
                    children: [p17],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP16(row, accountServices, paymentDocument);
                    }
                };
                
                // -----------------------
                var p13_not_municipal_service = {
                    name: 'P13_not_municipal_service',
                    children: [p16],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        return !PDChargesUtils.isMunicipalService(row);
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP13(row, accountServices, paymentDocument);
                    }
                };
                var p13_municipal_service = {
                    name: 'P13_municipal_service',
                    children: [p16],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        return PDChargesUtils.isMunicipalService(row);
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP13(row, accountServices, paymentDocument);
                    }
                };
                var p8_housing_service = {
                    name: 'P8_housing_service',
                    children: [p13_not_municipal_service],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        return PDChargesUtils.isHousingService(row);
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP8(row, accountServices, paymentDocument);
                    }
                };
                var p8_not_housing_service = {
                    name: 'P8_not_housing_service',
                    children: [p13_not_municipal_service],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        return !PDChargesUtils.isHousingService(row);
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP8(row, accountServices, paymentDocument);
                    }
                };

                // -------------------------
                // overPaymentAmount
                var p10 = {
                    name: 'P10',
                    children: [],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP10(row, accountServices, paymentDocument);
                    }
                };
                // individualConsumptionTotal
                var p14 = {
                    name: 'P14',
                    children: [],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP14(row, accountServices, paymentDocument);
                    }
                };
                // houseOverallNeedsTotal
                var p15 = {
                    name: 'P15',
                    children: [],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP15(row, accountServices, paymentDocument);
                    }
                };
                
                // -------------------------
                var p7 = {
                    name: 'P7',
                    children: [p10, p15, p13_municipal_service, p8_not_housing_service],
                    hasAccess: function(row, accountServices, paymentDocument) {
                        /*
                         * Рассчитывается только для строк с:
                         * - главными коммунальными услугами
                         * - КР на СОИ
                         */
                        return PDChargesUtils.isMunicipalService(row) || 
                            PDChargesUtils.isMunicipalResourceInApartmentBuilding(row);
                    },
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP7(row, accountServices, paymentDocument);
                    }
                };
                var p6 = {
                    name: 'P6',
                    children: [p10, p14, p13_municipal_service, p8_not_housing_service],
                    updateAmount: function(row, accountServices, paymentDocument) {
                        updateP6(row, accountServices, paymentDocument);
                    }
                };
                
                // -------------------------
                var p5 = {
                    name: 'P5',
                    children: [p6, p7, p8_housing_service]
                };
                var p1 = {
                    name: 'P1',
                    children: [p6]
                };
                var p2 = {
                    name: 'P2',
                    children: [p10, p14, p13_municipal_service]
                };
                var p4 = {
                    name: 'P4',
                    children: [p10, p15, p13_municipal_service]
                };
                
                // push nodes without parent - root nodes
                var tree = [p1, p5, p3, p2, p4, p9, p11, p12, p18, p19, p21, p5_capital_repair, p11_capital_repair,
                    p12_capital_repair, p13_penalties];
                return tree;
            }

            var amountsUpdateTree = createAmountsUpdateTree();

            function findAmountStartNode(nodeName) {
                function findStartNode(nodes) {
                    // the BFS of the graph
                    var children = [];
                    for(var i=0; i<nodes.length; i++) {
                        var node = nodes[i];
                        children = children.concat(node.children);
                        if(node.name === nodeName) {
                            return node; 
                        }
                    }
                    if(children.length) {
                        var startNode = findStarNode(children);
                        if(startNode) {
                            return startNode;
                        }
                    }
                    return null;
                }
                return findStarNode(amountsUpdateTree);
            }

            function findAmountDependencies(nodeName, row, accountServices, paymentDocument) {
                function findDependencies(nodes, resultNodes, resultSet) {
                    // the BFS of the graph
                    var children = [];
                    for(var i=0; i<nodes.length; i++) {
                        var node = nodes[i];
                        var access = node.hasAccess ? node.hasAccess(row, accountServices, paymentDocument) : true;
                        if(access) {
                            // add only unique node
                            if(resultSet[node.name]) {
                                // now it is not possible, see graph stucture 
                                console.warn("node already has added", node);
                            } else {
                                children = children.concat(node.children);
                                resultNodes.push(node);
                                resultSet[node.name] = true;
                            }
                        }
                    }
                    if(children.length) {
                        findDependencies(children, resultNodes, resultSet);
                    }
                }

                var startNode = findAmountStartNode(nodeName);
                if(!startNode) {
                    console.error("Node not found for name: ", nodeName);
                    return null;
                }
                var results = [];
                findDependencies(startNode.children, results, {});
                return results;
            }

            function updateAmountDependencies(nodeName, row, accountServices, paymentDocument) {
                var dependentNodes = findAmountDependencies(nodeName, row, accountServices, paymentDocument);
                for(var i=0; i<dependentNodes.length; i++) {
                    var node = dependentNodes[i];
                    if(node.updateAmount) {
                        console.error("logic error: node does not have update function. " + 
                            "You must add updateAmount function for node ", node);
                    } else {
                        node.updateAmount(row, accountServices, paymentDocument);
                    }
                }
            }

            /**
             * run after change
             * - individualConsumption
             * - houseOverallNeeds
             * - tariff
             * - paymentRate FIXME: change paymentRate must not update all values
             */
            //function updateChargeValues(row, accountServices, paymentDocument) {

                //// расчет ЭФ_ЛС_ПДТБ.18.1
                //row.charge.individualConsumptionPayment = calculateIndividualConsumptionPayment(row);
                //// расчет ЭФ_ЛС_ПДТБ.18.2
                //row.charge.houseOverallNeedsTotalPayment = calculateHouseOverallNeedsTotalPayment(row);          
                //// расчет ЭФ_ЛС_ПДТБ.30
                //row.charge.overpaymentAmount = calculateOverpaymentAmount(row);
                //// расчет ЭФ_ЛС_ПДТБ.25
                //row.charge.charged = calculateCharged(row, paymentDocument);

                //updateTotalForCharge(row, accountServices, paymentDocument);
            //}

            function updateCapitalRepairChargeValues(accountServices, paymentDocument) {
                // calculate ЭФ_ЛС_ПДКР.13
                accountServices.capitalRepairCharge.charge.charged = calculateCapitalRepairCharged(
                    accountServices, paymentDocument); 

                // update ЭФ_ЛС_ПДКР.16
                updateTotalCapitalRepairCharge(accountServices, paymentDocument);
            }

            function updateTotalCapitalRepairCharge(accountServices, paymentDocument) {
                accountServices.capitalRepairCharge.charge.total = calculateCapitalRepairTotal(accountServices);
                paymentDocument.total = calculatePaymentDocumentTotal(accountServices);
                paymentDocument.totalWithDebtAndAdvance = calculateTotalWithDebtAndAdvance(paymentDocument);
            }

            function updateTotalToPayForPeriod(accountServices, paymentDocument) {
                paymentDocument.total = calculatePaymentDocumentTotal(accountServices);
            }

            function updateTotalWithDebtAndAdvance(accountServices, paymentDocument) {
                paymentDocument.totalWithDebtAndAdvance = calculateTotalWithDebtAndAdvance(paymentDocument);
            }

            /**
             * Сумма автоматически пересчитывается при каждом изменении в ячейках столбца ЭФ_ЛС_ПДТБ.21.1
             */
            function updateTotalForAllCharges(accountServices, paymentDocument) {
                // total для всех строк
                accountServices.total = calculateAccountServicesTotal(accountServices);
                paymentDocument.total = calculatePaymentDocumentTotal(accountServices);
                paymentDocument.totalWithDebtAndAdvance = calculateTotalWithDebtAndAdvance(paymentDocument);
            }

            /**
             * run after change 
             * - adjustment
             * - grant
             * - charged
             */
            function updateTotalForCharge(row, accountServices, paymentDocument) {
                row.charge.individualConsumptionTotal = calculateIndividualConsumptionTotal(row);
                row.charge.houseOverallNeedsTotal = calculateHouseOverallNeedsTotal(row);
                row.charge.total = calculateTotal(row);

                updateTotalForAllCharges(accountServices, paymentDocument);
            }

            function recalculateAllAccountServicesValues(accountServices, paymentDocument, account) {
                var pdtbServices = pdtbAccountServicesAsArray(accountServices);
                angular.forEach(pdtbServices, function(row) {
                    if(!PDChargesUtils.canEditHouseOverallNeedsType(row, account, accountServices)) {
                        row.charge.houseOverallNeedsType = null;
                    }
                    if(!PDChargesUtils.canEditIndividualConsumptionType(row, account)) {
                        row.charge.individualConsumptionType = null;
                    }
                    if (!PDChargesUtils.canEditPaymentRate(row)) {
                        // clear values 
                        row.charge.paymentRate = null;
                        row.charge.overpaymentAmount = null;
                    }
                    updateAllAmounts(row, accountServices, paymentDocument);
                });

                // capitalRepairCharge
                if(accountServices.capitalRepairCharge) {
                    updateCapitalRepairChargeValues(accountServices, paymentDocument);
                }

                //updateTotalToPayForPeriod(accountServices, paymentDocument);
                paymentDocument.total = calculatePaymentDocumentTotal(accountServices);
                paymentDocument.totalWithDebtAndAdvance = calculateTotalWithDebtAndAdvance(paymentDocument);
            }

            return {
                updateAllAmounts: updateAllAmounts,
                updateAmountDependencies: updateAmountDependencies, 
                findAmountDependencies: findAmountDependencies
            };
        }
    ]);
