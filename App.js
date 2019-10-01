//The Thing Network Node.js SDK
var ttn = require('ttn');
var appId = '628799427265176';
var accessKey = 'ttn-account-v2.42To_tkueS4f9vn9n8Iml6XleeN0-sjeAEu5eEX5cpE';
var client = new ttn.DataClient(appId, accessKey, 'eu.thethings.network:1883');

const express = require("express");
const socketIo = require("socket.io");
const http = require("http");

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const app = express();
app.use(index);
const server = http.createServer(app);
const io = socketIo(server); 

io.on("connection", socket => {

    client.on('uplink', function (msg)
    {
        console.log('Received message', msg);
        socket.emit("FromLoraTracker", msg);
    });

    //client.on("uplink", function (devID, payload) {
    //    console.log("*** Received uplink from*** ", devID)
    //    console.log(payload)
    //    console.log()
    //    socket.emit("FromLoraTracker", payload);
    //})

});

server.listen(port, () => console.log(`Listening on port ${port}`));







		
