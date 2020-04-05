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
            EUI = obj2.hardware_serial;

            var mySqlConnection = mysql.createConnection({
                host: mySqlHost,
                user: mySqlUser,
                password: mySqlPassword,
                database: mySqlDatabase
            });
            console.log(EUI);

            //Check if alarm is activated for this device and send sms (every 3 min max)
            mySqlConnection.connect(function (err) {
                if (err) throw err;
               
                mySqlConnection.query("SELECT * FROM device where DeviceEUI='" + EUI + "'" + " and DeviceIsAlarmOn=1", function (err, result, fields) {
                    if (err) throw err;
                    if (result.length > 0) {
                    
                        if(result[0].DeviceLastSMS == null){
                            console.log("Alert! sms sent")
                            mySqlConnection.query("UPDATE Device set DeviceLastSMS = '" + Date_toYMD(new Date()) + "' where DeviceEUI='" + EUI + "'", function (err, result, fields) {});
                            // const tmcClient = new TMClient('sebastiendubos', 'bvBVqEFSLjnXix6UKv1H6eGc3dkOJ9');
                            // tmcClient.Messages.send({ text: 'Alert! ' + result[0].DeviceDescription, phones: result[0].DeviceTel }, function (err, res) {
                            //    console.log('Messages.send()', err, res);
                            // });
                            return;
                        }
                        if(new Date().getTime() > result[0].DeviceLastSMS.getTime()+ 150000){
                            console.log("Alert! sms sent")
                            mySqlConnection.query("UPDATE Device set DeviceLastSMS = '" + Date_toYMD(new Date()) + "' where DeviceEUI='" + EUI + "'", function (err, result, fields) {});
                            // const tmcClient = new TMClient('sebastiendubos', 'bvBVqEFSLjnXix6UKv1H6eGc3dkOJ9');
                            // tmcClient.Messages.send({ text: 'Alert! ' + result[0].DeviceDescription, phones: result[0].DeviceTel }, function (err, res) {
                            //    console.log('Messages.send()', err, res);
                            // });
                        }
                        else{
                            console.log("Alert! sms already sent, waiting 3 min")
                        }
                    }
                });
            });
        })
    }
}

function Date_toYMD(date) {
    var year, month, day;
    year = String(date.getFullYear());
    month = String(date.getMonth() + 1);
    time = date.toTimeString().split("T")[0].split(" ")[0];
    if (month.length == 1) {
        month = "0" + month;
    }
    day = String(date.getDate());
    if (day.length == 1) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day + " " + time;
} 