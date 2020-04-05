//Required module
const smsService = require("./routes/smsService");
const ttn = require('ttn');
const express = require("express");
const http = require("http");
const uuidv1 = require('uuid/v1');

////////////////////////////////////////
//The Thing Network WebSocket client  //
////////////////////////////////////////
//Settings TTN (The Thing Network)
const appId = '628799427265176';
const accessKey = 'ttn-account-v2.llxrO7pihjYSaatgK--0dEYPb0yIxUVaMh5Isqq95Xo';
const url = 'eu.thethings.network:1883';
const ttnClient = new ttn.DataClient(appId, accessKey, url);

//////////////////////////////////////////////////////////////////////////////
//BTracket WebSocket server to communicate with BTracketApp and BTrackerWeb //
//////////////////////////////////////////////////////////////////////////////
//Create Express server and WebSocket
const port = process.env.PORT || 4001;
const indexPage = require("./routes/index");
const app = express();
app.use(indexPage);
const server = http.createServer(app);
server.listen(port, () => console.log(`Listening on port ${port}`));
//Create Socket.IO server
const btracketWebSocket = require("socket.io")(server, { handlePreflightRequest: (req, res) => { const headers = { "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Origin": req.headers.origin, "Access-Control-Allow-Credentials": true }; res.writeHead(200, headers); res.end(); } });

//Send sms if TTN detect motion
smsService.sendNotification(ttnClient);

var socketlist = [];

//Open ttnClient connection from BTrackerWEB and BTrackerAPP
btracketWebSocket.on("connection", btracketWebSocket => {
    //DEBUG
    socketlist.push(btracketWebSocket);
    console.log("subscribe again", socketlist.length);
    //socket.Disconnect(true);
    //process.exit(1)

    //on data coming from The Thing Network
    ttnClient.on("uplink", function (devID, payload) {
        console.log("Received uplink from : ", devID)
        notifyClientMotionDetected(payload);
    })

    //Subscribe to ADD tracker from BTrackerWeb and BtrackerApp
    btracketWebSocket.on('ttnAddDevice', function (payload) {
        console.log("Add new device", payload);
        regiterDevice(payload);
    });

    //Subscribe to UPDATE tracker from BTrackerWeb and BtrackerApp
    btracketWebSocket.on('ttnUpdateDevice', function (payload) {
        console.log("Update device", payload);
        updateDevice(payload);
    });

    //Subscribe to DELETE tracker from BTrackerWeb and BtrackerApp
    btracketWebSocket.on('ttnDeleteDevice', function (payload) {
        console.log("Delete device", payload);
        deleteDevice(payload);
    });

    btracketWebSocket.on('disconnect', function () {
        console.log('Disconnected')
    })
});
////////////////////////////////////////
//Async method to Emit MOTION DETECTED//
////////////////////////////////////////
const notifyClientMotionDetected = async function (payload) {
    obj = JSON.stringify(payload);
    obj2 = JSON.parse(obj);
    EUI = obj2.hardware_serial
    btracketWebSocket.emit("ttnMotionDetected", EUI);
}

/////////////////////////////////////
//Async method to REGISTER a device//
/////////////////////////////////////
const regiterDevice = async function (payload) {
    const ttnApplication = await ttn.application(appId, accessKey)

    obj = JSON.stringify(payload);
    obj2 = JSON.parse(obj);

    const devEUI = obj2.EUI;
    const devDescription = obj2.Description;
    const euis = await ttnApplication.getEUIs();
    const devID = uuidv1(); //Generate GUID for devID

    // register a new device
    await ttnApplication.registerDevice(devID, {
        description: devDescription,
        appEui: euis[0],
        devEui: devEUI,
        nwkSKey: ttn.key(16),
        appSKey: ttn.key(16),
        appKey: ttn.key(16),

    }).then((e) => {
        btracketWebSocket.emit("ttnAddSucceeded", devID);
    }).catch(function (err) {
        console.log(err.details);
        btracketWebSocket.emit("ttnAddFail", err.details);
    })
}

/////////////////////////////////////
//Async method to UPDATE a device//
/////////////////////////////////////
const updateDevice = async function (payload) {
    const ttnApplication = await ttn.application(appId, accessKey)

    obj = JSON.stringify(payload);
    obj2 = JSON.parse(obj);

    const devEUI = obj2.EUI;
    const devDescription = obj2.Description;
    const devID = obj2.devID
    const euis = await ttnApplication.getEUIs();

    // register a new device
    await ttnApplication.updateDevice(devID, {
        description: devDescription,
        appEui: euis[0],
        devEui: devEUI,
        nwkSKey: ttn.key(16),
        appSKey: ttn.key(16),
        appKey: ttn.key(16),

    }).then((e) => {
        btracketWebSocket.emit("ttnUpdateSucceeded", devID);
    }).catch(function (err) {
        console.log(err.details);
        btracketWebSocket.emit("ttnUpdateFail", err.details);
    })
}

///////////////////////////////////
//Async method to DELETE a device//
///////////////////////////////////
const deleteDevice = async function (devId) {
    const ttnApplication = await ttn.application(appId, accessKey);
    // delete device
    await ttnApplication.deleteDevice(devId)
        .then((e) => {
            btracketWebSocket.emit("ttnDeleteSucceeded");
        }).catch(function (err) {
            console.log("Deleted fail: ", err.details);
            btracketWebSocket.emit("ttnDeleteFail", err.details);
        })
}