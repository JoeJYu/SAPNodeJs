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
            else { 
                //test
                res.send(result.ts) 
            }
        })
    })


    app.listen(process.env.PORT || 3000,
        () => console.log("Server is running..."));
});