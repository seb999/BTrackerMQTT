//The Thing Network Node.js SDK
const appId = '628799427265176';
const accessKey = 'ttn-account-v2.42To_tkueS4f9vn9n8Iml6XleeN0-sjeAEu5eEX5cpE';
const url = 'eu.thethings.network:1883';
const port = process.env.PORT || 4001;

const ttn = require('ttn');
const express = require("express");
const http = require("http");
const indexPage = require("./routes/index");

var client = new ttn.DataClient(appId, accessKey, url);

const app = express();
app.use(indexPage);
const server = http.createServer(app);

const io = require("socket.io")(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, 
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

io.on("connection", socket => {

    //To send only device ID
    // client.on('uplink', function (msg)
    // {
    //     console.log('Received message', msg);
    //     socket.emit("FromLoraTracker", msg);
    // });

    client.on("uplink", function (devID, payload) {
       console.log("Received uplink from : ", devID)
       obj = JSON.stringify(payload);
       obj2 = JSON.parse(obj);
       socket.emit("FromLoraTracker", obj2.hardware_serial);
    })
});

server.listen(port, () => console.log(`Listening on port ${port}`));







		
