const TMClient = require('textmagic-rest-client');
const mysql = require('mysql');
const mySqlHost = "localhost";
const mySqlUser = "root";
const mySqlPassword = "Solna123@";
const mySqlDatabase = "btracker";

module.exports = {

    sendNotification: function (ttnClient) {
        //Open default ttnClient connection
        ttnClient.on("uplink", function (devID, payload) {
            obj = JSON.stringify(payload);
            obj2 = JSON.parse(obj);
            deviceEUI = obj2.hardware_serial;

            var con = mysql.createConnection({
                host: mySqlHost,
                user: mySqlUser,
                password: mySqlPassword,
                database: mySqlDatabase
            });

            //Check if alarm is activated for this device and send sms
            con.connect(function (err) {
                if (err) throw err;
                con.query("SELECT * FROM device where DeviceEUI='" + deviceEUI + "'" + " and DeviceIsAlarmOn=1", function (err, result, fields) {
                    if (err) throw err;
                    if (result.length > 0) {
                        console.log("Alert! sms sent")
                        // const tmcClient = new TMClient('sebastiendubos', 'bvBVqEFSLjnXix6UKv1H6eGc3dkOJ9');
                        // tmcClient.Messages.send({ text: 'Alert! ' + result[0].DeviceDescription, phones: result[0].DeviceTel }, function (err, res) {
                        //    console.log('Messages.send()', err, res);
                        // });
                    }
                });
            });
        })
    }
}