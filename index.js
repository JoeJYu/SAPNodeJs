const express = require('express')
const cors = require("cors")
const app = express()
const request = require('request');

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
    app.use(cors()) // Allow everything
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        next();
    });

    // MENSA DATA
    app.get('/meal-of-week', (req, res) => {
        const { year, kw } = req.query;
        request(
            { url: `https://tum-dev.github.io/eat-api/en/mensa-garching/${year}/${kw}.json` },
            (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    return res.status(500).json({ type: 'error', message: err.message });
                }

                res.json(JSON.parse(body));
            }
        )
    });

    app.get('/mensa-garching', (req, res) => {
        request(
            { url: 'https://tum-dev.github.io/eat-api/enums/canteens.json' },
            (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    return res.status(500).json({ type: 'error', message: err.message });
                }
                const mensaInfo = JSON.parse(body).find((mensa) => mensa.enum_name === "MENSA_GARCHING");
                res.json(mensaInfo);
            }
        )
    });

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

    //reset
    app.post('/reset', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) VALUES(0)', function (err, result) {
            if (err) { res.send(err) };
            console.log("Resetted:", result);
            res.send("Resetted counter")
        })
    })

    app.get('/', (req, res) => {
        conn.exec('SELECT * FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })

    app.get('/occupancies', (req, res) => {
        conn.exec('SELECT EXTRACT(YEAR FROM TS) as Year, EXTRACT(MONTH FROM TS) as MONTH, EXTRACT(DAY FROM TS) as DAY, cast(EXTRACT(HOUR FROM TS)+2 as numeric(36)) as HOUR, cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) as MINUTESINTERVAL, MEDIAN(COUNTER) FROM RASPDATA GROUP BY EXTRACT(YEAR FROM TS), EXTRACT(MONTH FROM TS), EXTRACT(DAY FROM TS), EXTRACT(HOUR FROM TS), cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) ORDER BY YEAR ASC, MONTH ASC, DAY ASC, HOUR ASC, MINUTESINTERVAL ASC', function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })


    app.listen(process.env.PORT || 5000,
        () => console.log("Server is running..."));
});