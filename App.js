//The Thing Network Node.js SDK

//Create a MQTT client connected to our thing network application
const appId = '628799427265176';
const accessKey = 'ttn-account-v2.llxrO7pihjYSaatgK--0dEYPb0yIxUVaMh5Isqq95Xo';
const url = 'eu.thethings.network:1883';
const port = process.env.PORT || 4001;
const ttn = require('ttn');
var ttnClient = new ttn.DataClient(appId, accessKey, url);

//Create a http server using express
const express = require("express");
const http = require("http");
const indexPage = require("./routes/index");
const app = express();
app.use(indexPage);
const server = http.createServer(app);
server.listen(port, () => console.log(`Listening on port ${port}`));

//Create socker.io client that will use this server
const socket = require("socket.io")(server, {
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

//Open connection HERE!!
socket.on("connection", socket => {

    ttnClient.on("uplink", function (devID, payload) {
       console.log("Received uplink from : ", devID)
       obj = JSON.stringify(payload);
       obj2 = JSON.parse(obj);
       socket.emit("FromLoraTracker", obj2.hardware_serial);
    })

    socket.on('addNewDevice', function(devEUI){ 
        console.log("Received downlink from BTracker" , devEUI);
        regiterNewDevice();
     });
});

//For debbuging
// ttnClient.on("uplink", function (devID, payload) {
//     console.log("Received uplink from : ", devID)
//     obj = JSON.stringify(payload);
//     obj2 = JSON.parse(obj);
//  })

//Asynch method to register a new device
const regiterNewDevice = async function (EUI) {
    const application = await ttn.application(appId, accessKey)

   const euis = await application.getEUIs();
   const devices = await application.devices();
   const newDeviceId = "test" + (devices.length + 1).toString();
    
   // register a new device
    await application.registerDevice(newDeviceId, {
      description: "Description",
      appEui: euis[0],
      devEui: "9988776655443324",
      nwkSKey: ttn.key(16),
      appSKey: ttn.key(16),
      appKey: ttn.key(16),
      
    })
}

regiterNewDevice("abc").catch(function (err) {
    console.error(err)
    process.exit(1)
  })









		
