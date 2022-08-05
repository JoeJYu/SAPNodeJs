//loading necessary modules
//Section 1: modules
const express = require('express')
const cors = require("cors")
const app = express()
const request = require('request');

//Section 2: SAP HANA client
var hana = require('@sap/hana-client');

//connect Node.js to SAP HANA Service Instance
var conn = hana.createConnection();

//Use the following connection string (parameters) to connect
//serverNode: SQL Endpoint of SAP HANA Database Instance
//uid and pwd of SAP HANA Database Instance (credentials)
var conn_params = {
    serverNode: 'aa3ff0d9-4dbd-41b8-8568-fec280ef54d9.hana.trial-us10.hanacloud.ondemand.com:443',
    encrypt: 'true',
    sslValidateCertificate: 'false',
    uid: 'DBADMIN',
    pwd: 'Mensalyzer2022!'
};

//Section 3: DB connection
//open DB connection
conn.connect(conn_params, function (err) {
    if (err) throw err;
    console.log("Connection established");

    console.log("Analyze Database…")
    conn.exec('SELECT * FROM RASPDATA', [], function (err, result) {
        if (err) { res.send(err) };

        if (result.length === 0) {
            console.log("Prepare Database for first usage…")
            conn.exec('INSERT INTO RASPDATA (counter) VALUES (0)', [], function (err, result) {
                if (err) { res.send("Error during initial setup" + err) };

                console.log("Database preparation finished!")
            })
        }
        console.log("Database Analysis completed.")
    })
    
    app.use(cors()) // Allow everything
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        next();
    });
    
//Section 4: Endpoints Mensa information and menu
    //Endpoint 1: to retrieve the menu details of a week of the mensa in garching
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

    //Endpoint 2: to retrieve general information of the mensa in garching
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

//Section 5: endpoints for raspberry pi to call
    //Endpoint 3: to increase the counter by 1 --> adding a new row into the database with updated counter
    //whenever someone crosses the photelectric barrier into the positive direction (going inside), this endpoint is called by the raspberry pi
    app.post('/increment', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) SELECT counter + ? FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', [1], function (err, result) {
            if (err) { res.send(err) };
            console.log("Increment:", result);
            res.send("Incremented counter")
        })
    })

    //Endpoint 4: to decrease the counter by 1 --> adding a new row into the database with updated counter
    //whenever someone crosses the photelectric barrier into the negative direction (going outside), this endpoint is called by the raspberry pi
    app.post('/decrement', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) SELECT counter + ? FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', [-1], function (err, result) {
            if (err) { res.send(err) };
            console.log("Decrement:", result);
            res.send("Decremented counter")
        })
    })

//Section 6: endpoints to retrieve information from HANA DB and to reset the counter
    //Endpoint 5: to reset the counter to 0 
    app.post('/reset', (req, res) => {
        conn.exec('INSERT INTO RASPDATA (counter) VALUES(0)', function (err, result) {
            if (err) { res.send(err) };
            console.log("Resetted:", result);
            res.send("Resetted counter")
        })
    })

    //Endpoint 6: to retrieve the newest counter entry of the database 
    //used to display the live occupancy in the web app
    app.get('/', (req, res) => {
        conn.exec('SELECT * FROM RASPDATA c1 WHERE c1.ts = (SELECT MAX(ts) FROM RASPDATA)', function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })

    //Endpoint 7: to retrieve the occupancy development
    //used to display the development of occupancies as a bar chart in the web app
    app.get('/occupancies', (req, res) => {
        sqlStatement = "SELECT EXTRACT(YEAR FROM TS) as Year,  EXTRACT(MONTH FROM TS) as MONTH, EXTRACT(DAY FROM TS) as DAY, " +
        "cast(EXTRACT(HOUR FROM TS)+2 as numeric(36)) as HOUR, cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) as MINUTESINTERVAL" + 
        "MEDIAN(COUNTER) FROM RASPDATA GROUP BY EXTRACT(YEAR FROM TS), EXTRACT(MONTH FROM TS), EXTRACT(DAY FROM TS), EXTRACT(HOUR FROM TS)," +  
        "cast(FLOOR(EXTRACT(MINUTE FROM TS)/15)*15 as numeric(36)) ORDER BY YEAR ASC, MONTH ASC, DAY ASC, HOUR ASC, MINUTESINTERVAL ASC"

        conn.exec(sqlStatement, 
        function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })
//Section 7: Listen and Bind connection
    //listen and bind the connections on the specified host and port
    app.listen(process.env.PORT || 5000,
        () => console.log("Server is running..."));
});