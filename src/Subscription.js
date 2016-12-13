/* jshint -W097 */
/* globals getSubscriberMap, getSubscriptionList, getBuildingMap, log,
updateSubscriptionEnd, assert, daysInMonth, getMeterReadingMap,
sort_unique_date, throwException, incrementDay*/
"use strict";

function calculateCharges(pricingMap, settlementSubscriberId, settlementDate, billFrom, billTo) {
    var subscriberMap = getSubscriberMap();
    var subscriptionList = getSubscriptionList(billFrom, billTo);
    var buildingMap = getBuildingMap(billFrom, billTo);
    if (settlementSubscriberId !== undefined) {
        var result = getSubscription(subscriptionList, buildingMap, settlementSubscriberId, settlementDate);
        if (result.SubscriptionList.length > 0) { // Settlement is done much after subscription expires
            addPeriod(subscriptionList, buildingMap);
            buildPeriod(result.BuildingMap, subscriptionList, billFrom, billTo);
            processSubscription(result.SubscriptionList, subscriberMap, pricingMap, result.BuildingMap, billFrom, billTo);
        }
        var settlementSubscriberMap = {};
        settlementSubscriberMap[settlementSubscriberId] = subscriberMap[settlementSubscriberId];
        return settlementSubscriberMap;
    } else {
        addPeriod(subscriptionList, buildingMap);
        buildPeriod(buildingMap, subscriptionList, billFrom, billTo);
        processSubscription(subscriptionList, subscriberMap, pricingMap, buildingMap, billFrom, billTo);
        return subscriberMap;
    }
}

function processSubscription(subscriptionList, subscriberMap, pricingMap, buildingMap, billFrom, billTo) {
    log("Processing totally " + subscriptionList.length + " subscriptions");
    for (var i = 0; i < subscriptionList.length; i++) {
        var subscriber = subscriberMap[subscriptionList[i].SubscriberId];
        if (subscriber.Status == 'Closed') {
            continue;
        }
        var pricing = pricingMap[subscriptionList[i].PricingId];
        var building = buildingMap[subscriptionList[i].BuildingId];
        calculateChargesForSubscriber(subscriptionList[i], subscriber, pricing, building, billFrom, billTo);
    }
}

function getSubscription(subscriptionList, buildingMap, settlementSubscriberId, settlementDate) {
    var result = {
        SubscriptionList: [],
        BuildingMap: {}
    };
    for (var i = 0; i < subscriptionList.length; i++) {
        var subscription = subscriptionList[i];
        if (settlementSubscriberId == subscription.SubscriberId) {
            if (subscription.DateFrom <= settlementDate && subscription.DateTo > settlementDate) {
                log("Updating end date to settlement date for Subscription id - " + subscription.SubscriptionId);
                subscription.DateTo = settlementDate;
                subscription.BillingEnd = settlementDate;
                updateSubscriptionEnd(subscription.Index, settlementDate);
            }
            result.SubscriptionList.push(subscription);
            result.BuildingMap[subscription.BuildingId] = buildingMap[subscription.BuildingId];
        }
    }
    return result;
}

function calculateChargesForSubscriber(subscription, subscriber, pricing, building, billFrom, billTo) {
    assert(pricing, "pricing", subscription.SubscriptionId);
    assert(subscriber, "subscriber", subscription.SubscriptionId);
    assert(building, "building", subscription.SubscriptionId);

    var monthlyRental = 0;
    var meterCharge = 0;
    for (var i = 0; i < building.PeriodList.length; i++) {
        var period = building.PeriodList[i];
        if (subscription.BillingStart <= period.Start && subscription.BillingEnd >= period.End) {
            var price = pricing.PricingPer1;
            if (period.Count == 2) {
                price = pricing.PricingPer2;
            } else if (period.Count == 3) {
                price = pricing.PricingPer3;
            }
            monthlyRental += period.Proration * price;
            meterCharge += pricing.MeterRate * period.Meter / period.Count;
        }
    }
    monthlyRental = Math.round(monthlyRental);
    meterCharge = Math.round(meterCharge);
    var charges = {
        BuildingType: building.Type,
        BuildingId: building.BuildingId,
        Start: subscription.BillingStart,
        End: subscription.BillingEnd,
        Subscription: monthlyRental,
        Usage: meterCharge,
        Total: monthlyRental + meterCharge
    };
    subscriber.ChargeList.push(charges);
    subscriber.TotalCharges += charges.Total;

}

function getSubscriptionPeriod(subscriptionFrom, subscriptionTo, billFrom, billTo) {
    var actualStart = billFrom;
    var actualEnd = billTo;
    if (subscriptionFrom > billFrom) {
        if (subscriptionTo > billTo) {
            actualStart = subscriptionFrom;
        } else {
            actualStart = subscriptionFrom;
            actualEnd = subscriptionTo;
        }
    } else if (subscriptionTo < billTo) {
        if (subscriptionFrom > billFrom) {
            actualStart = subscriptionFrom;
            actualEnd = subscriptionTo;
        } else {
            actualEnd = subscriptionTo;
        }
    }
    return {BillingStart: actualStart, BillingEnd: actualEnd};
}

function calculateProration(actualStart, actualEnd, billFrom) {
    var noOfDays = (actualEnd.getTime() - actualStart.getTime()) / 86400000 + 1;
    var proration = noOfDays / daysInMonth(billFrom.getMonth(), billFrom.getYear());
    return proration;
}

function buildPeriod(buildingMap, subscriptionList, billFrom, billTo) {
    var meterReadingMap = getMeterReadingMap(billFrom, billTo);
    for (var building in buildingMap) {
        var dates = sort_unique_date(buildingMap[building].PeriodList);
        var meterReading = meterReadingMap[building];
        var result = [];
        log("Period list for building id - " + building);
        for (var i = 0; i < dates.length - 1; i++) {
            var end = new Date(dates[i + 1].valueOf());
            end.setDate(end.getDate() - 1);

            var count = countSubscription(buildingMap[building].BuildingId, subscriptionList, dates[i], end);
            var proration = calculateProration(dates[i], end, billFrom);
            var meterValue = 0;
            if (meterReading === undefined) {
                if (count > 0) {
                    throwException("Error - Missing meter reading for building id - " + building + "!");
                }
            } else {
                meterValue = getMeterForBuildingPeriod(meterReading, dates[i], end);
            }

            result.push({Start: dates[i], End: end, Count: count, Proration: proration, Meter: meterValue});

            log(dates[i].toDateString() + " - " + end.toDateString() + ", Count : " + count + ", Meter : " + meterValue + ", Proration : " + proration);
        }
        buildingMap[building].PeriodList = result;
    }
}

function addPeriod(subscriptionList, buildingMap) {
    for (var i = 0; i < subscriptionList.length; i++) {
        var periodList = buildingMap[subscriptionList[i].BuildingId].PeriodList;
        periodList.push(subscriptionList[i].BillingStart);

        // Need to do this to sync with all start dates in period
        var newEnd = incrementDay(subscriptionList[i].BillingEnd);
        periodList.push(newEnd);
    }
}

function getMeterForBuildingPeriod(meterReading, start, end) {
    var result = 0;
    for (var i = 0; i < meterReading.length; i++) {
        if (meterReading[i].Start <= end && meterReading[i].End >= start) {
            var actualStart = meterReading[i].Start > start
                ? meterReading[i].Start
                : start;
            var actualEnd = meterReading[i].End < end
                ? meterReading[i].End
                : end;
            result += meterReading[i].Value * (actualEnd.getTime() - actualStart.getTime() + 86400000) / (meterReading[i].End.getTime() - meterReading[i].Start.getTime() + 86400000);
        }
    }
    return result;
}

function countSubscription(buildingId, subscriptionList, start, end) {
    var count = 0;
    for (var i = 0; i < subscriptionList.length; i++) {
        if (buildingId == subscriptionList[i].BuildingId && subscriptionList[i].BillingStart <= start && subscriptionList[i].BillingEnd >= end) {
            count++;
        }
    }
    return count;
}
