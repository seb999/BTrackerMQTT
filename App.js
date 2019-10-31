//BTracker MQTT Application
// - We have a ttnClient communicate with the Thing Network
// - We have socket.io to communicate with BtrackerWEB and BTrackerAPP
// - We create a Express server to run this on port 4001

//Settings
const appId = '628799427265176';
const accessKey = 'ttn-account-v2.llxrO7pihjYSaatgK--0dEYPb0yIxUVaMh5Isqq95Xo';
const url = 'eu.thethings.network:1883';

//Required module
const ttn = require('ttn');
const express = require("express");
const http = require("http");
const uuidv1 = require('uuid/v1');

//Create Express server
const port = process.env.PORT || 4001;
const indexPage = require("./routes/index");
const app = express();
app.use(indexPage);
const server = http.createServer(app);
server.listen(port, () => console.log(`Listening on port ${port}`));

const socket = require("socket.io")(server, { handlePreflightRequest: (req, res) => { const headers = { "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Origin": req.headers.origin, "Access-Control-Allow-Credentials": true }; res.writeHead(200, headers); res.end(); } });

//Create ttnClient
const ttnClient = new ttn.DataClient(appId, accessKey, url);

//Open connection to BTrackerWEB and BTrackerAPP
socket.on("connection", socket => {
    //Subscribe to uplink event from TheThinNetwork
    ttnClient.on("uplink", function (devID, payload) {
        console.log("Received uplink from : ", devID)
        obj = JSON.stringify(payload);
        obj2 = JSON.parse(obj);
        socket.emit("ttnMotionDetected", obj2.hardware_serial);
    })

    //Subscribe to ADD tracker from BTrackerX
    socket.on('ttnAddDevice', function (payload) {
        console.log("Add new device", payload);
        regiterDevice(payload);
    });

     //Subscribe to UPDATE tracker from BTracker
     socket.on('ttnUpdateDevice', function (payload) {
        console.log("Update device", payload);
        updateDevice(payload);
    });

    //Subscribe to DELETE tracker from BTracker
    socket.on('ttnDeleteDevice', function (payload) {
        console.log("Delete device", payload);
        deleteDevice(payload);
    });
});

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
        socket.emit("ttnAddSucceeded", devID);
    }).catch(function (err) {
        console.log(err.details);
        socket.emit("ttnAddFail", err.details);
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
        socket.emit("ttnUpdateSucceeded", devID);
    }).catch(function (err) {
        console.log(err.details);
        socket.emit("ttnUpdateFail", err.details);
    })
}

///////////////////////////////////
//Async method to DELETE a device//
///////////////////////////////////
const deleteDevice = async function (devId) {
    const ttnApplication = await ttn.application(appId, accessKey)
    const euis = await ttnApplication.getEUIs();

    // delete device
    await ttnApplication.deleteDevice(devId).then(() => {
        console.log("Deleted done!");
    }).catch(function (err) {
        console.log("Deleted fail: ", err.details);
    })
}