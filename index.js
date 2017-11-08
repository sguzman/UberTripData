#!/usr/local/bin/node
'use strict';

(function () {
    const rxjs = require('rxjs');
    const rp = require('request-promise');

    const rip = rxjs.Observable.fromPromise(rp);

    const args = process.argv.slice(2);
    const cookie = args[0];

    function get(url, cook) {
        const options = {
            uri: url,
            headers: {
                Cookie: cook
            },
            json: true
        };
        return rxjs.Observable.fromPromise(rp(options));
    }

    function checkCookie(cook) {
        const checkCook = 'https://partners.uber.com/p3/platform_chrome_nav_data/';
        return get(checkCook, cook)
    }

    function checkStatementList(cook) {
        const statementList = 'https://partners.uber.com/p3/money/statements/all_data';
        return get(statementList, cook);
    }

    function getTripList(cook, uuid) {
        const statementObj = `https://partners.uber.com/p3/money/statements/view/${uuid}`;
        return get(statementObj, cook)
    }
    
    function getTrip(cook, uuid) {
        const trip = `https://partners.uber.com/p3/money/trips/trip_data/${uuid}`;
        return get(trip, cook);
    }

    checkCookie(cookie)
        .pluck('nav','earnings','nav','paymentStatements','urls','length')
        .flatMap(s => checkStatementList(cookie))
        .flatMap(s => s)
        .pluck('uuid')
        .zip(rxjs.Observable.interval(100), function(a, b) { return a; })
        .flatMap(s => getTripList(cookie, s))
        .pluck('body', 'driver', 'trip_earnings', 'trips')
        .flatMap(s => Object.keys(s))
        .zip(rxjs.Observable.interval(50), function(a, b) { return a; })
        .flatMap(s => getTrip(cookie, s))
        .subscribe(
            s => {
                console.log(`Got ${JSON.stringify(s)}`)
            },
            e => {
                console.error(':(' + e.toString())
            },
        () => console.log('finished'));
})();
