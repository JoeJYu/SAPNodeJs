const express = require('express')
const app = express()

var hana = require('@sap/hana-client');

var conn = hana.createConnection();

var conn_params = {
    serverNode: 'aa3ff0d9-4dbd-41b8-8568-fec280ef54d9.hana.trial-us10.hanacloud.ondemand.com:443',
    encrypt: 'true',
    sslValidateCertificate: 'false',
    uid: 'DBADMIN',
    pwd: 'Mensalyzer2022!'
};

// open DB connection
conn.connect(conn_params, function (err) {
    if (err) throw err;
    console.log("Connection established");

    // Put listener for Photoelectric barrier here
    app.post('/increment', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) SELECT counter + ? FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', [1], function (err, result) {
            if (err) { res.send(err) };
            console.log("Increment:", result);
            res.send("Incremented counter")
        })
    })


    app.post('/decrement', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) SELECT counter + ? FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', [-1], function (err, result) {
            if (err) { res.send(err) };
            console.log("Decrement:", result);
            res.send("Decremented counter")
        })
    })


    app.get('/', (req, res) => {
        conn.exec('SELECT * FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })

    app.get('/occupancies', (req, res) => {
        conn.exec('SELECT EXTRACT(YEAR FROM TS) as Year, EXTRACT(MONTH FROM TS) as MONTH, EXTRACT(DAY FROM TS) as DAY, EXTRACT(HOUR FROM TS) as HOUR, cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) as MINUTESINTERVAL, MEDIAN(COUNTER) FROM RASPDATA GROUP BY EXTRACT(YEAR FROM TS), EXTRACT(MONTH FROM TS), EXTRACT(DAY FROM TS), EXTRACT(HOUR FROM TS), cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) EXTRACT(YEAR FROM TS) as Year, EXTRACT(MONTH FROM TS) as MONTH, EXTRACT(DAY FROM TS) as DAY, CONCAT((EXTRACT(HOUR FROM TS)),(cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)))) as TIMEINTERVAL, MEDIAN(COUNTER) FROM RASPDATA GROUP BY EXTRACT(YEAR FROM TS), EXTRACT(MONTH FROM TS), EXTRACT(DAY FROM TS), CONCAT((EXTRACT(HOUR FROM TS)),(cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36))))', function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })


    app.listen(process.env.PORT || 3000,
        () => console.log("Server is running..."));
});