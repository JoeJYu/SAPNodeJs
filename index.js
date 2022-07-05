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
        time = new Date().getTime()
        conn.exec('INSERT INTO Raspdata VALUES (1, ?, 0, 1)', [time], function (err, result) {
            if (err) { res.send(err) };
            console.log("Increment:", result);
            res.send("Incremented counter")
        })
    })


    app.post('/decrement', (req, res) => {
        time = new Date().getTime()
        conn.exec('INSERT INTO Raspdata VALUES (1, 24, 0, -1)', [124], function (err, result) {
            if (err) { res.send(err) };
            console.log("Decrement:", result);
            res.send("Decremented counter")
        })
    })


    app.get('/', (req, res) => {
        conn.exec('SELECT * FROM Raspdata WHERE id = ?', [1], function (err, result) {
            if (err) { res.send(err) }
            else { res.send(result) }
        })
    })


    app.listen(process.env.PORT || 3000,
        () => console.log("Server is running..."));
});