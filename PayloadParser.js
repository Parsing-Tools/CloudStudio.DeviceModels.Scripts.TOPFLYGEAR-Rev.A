function parseUplink(device, payload) {

    var payloadb = payload.asBytes();
    //env.log(payloadb);
    //var payload = "272704004900B508694870602292414F1624021413464071652144FA886DC03CA121420000015D8008008000851BFF40000000A98E0644012C00000E100F00640510F480000000FFD5";
    var decodedMessages = PersonalAssetDecoder.decode(payloadb);
    var decodedMessage = decodedMessages[0];
    env.log (decodedMessage);

    // Geolocation
    if(decodedMessage != null && decodedMessage.latlngValid != false && decodedMessage.latitude != null && decodedMessage.longitude != null && decodedMessage.altitude !=null) {
        var eplt = device.endpoints.byType(endpointType.locationTracker);
        if (eplt != null)
        {
            eplt.updateLocationTrackerStatus(decodedMessage.latitude, decodedMessage.longitude, decodedMessage.altitude, 0, decodedMessage.date );
                
        };
    }

    // Device Temperature
    if(decodedMessage != null && decodedMessage.deviceTemp != null) {
        var eplt = device.endpoints.byType(endpointType.temperatureSensor);
        if (eplt != null)
        {
            eplt.updateTemperatureSensorStatus(decodedMessage.deviceTemp, decodedMessage.date);
                
        }
    }

    // Device Battery
    if(decodedMessage != null && decodedMessage.batteryVoltage != null) {
        var e = device.endpoints.byType(endpointType.voltageSensor);
        if (e != null)
        {
            e.updateVoltageSensorStatus(decodedMessage.batteryVoltage, decodedMessage.date);
                
        }
    }
    
}


var ByteUtils = {
    IMEI:{
      decode:function (bytes,index){
          if (bytes != null && index > 0 && (bytes.length - index) >= 8) {
              var str = ByteUtils.bytes2HexString(bytes, index);
              return str.substring(1, 16);
          }
          return ""
      } ,
      encode(imei){
          if(imei.length != 15){
              return []
          }
          return this.hexStringToByte("0" + imei)
      }
    },
    hexToFloat: function (hex) {
        var s = hex >> 31 ? -1 : 1;
        var e = (hex >> 23) & 0xFF;
        return s * (hex & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, (e - 127))
    },
    flipHexString: function (hexValue, length) {
        var h = hexValue.substr(0, 2);
        for (var i = 0; i < length; ++i) {
            h += hexValue.substr(2 + (length - 1 - i) * 2, 2);
        }
        return h;
    },
    hexStringArrayToFloat: function (input) {
        let hex = this.flipHexString('0x' + input, 8);
        if (hex == '0x00000000') {
            return 0;
        }
        return this.hexToFloat(hex)
    },
    bytes2Float:function (bytes,index){
        if(bytes.length < index + 4){
            return 0
        }
        var changeArray = this.arrayOfRange(bytes,index,index+4)
        return this.hexStringArrayToFloat(this.bytes2HexString(changeArray,0))
    },
    bytes2HexString:function(bytes,index){
        var result = ""
        for(var i = index;i < bytes.length;i++){
            var item = bytes[i].toString(16);
            if(item.length == 1){
                item = "0" + item
            }
            result += item
        }
        return result
    },
    charArrayToStr: function (charCodeArray, codeType) {
        var curCharCode, secondCode;
        var resultStr = [];
        if (codeType && codeType.toLowerCase() == 'ascii') {
            for (var i = 0; i < charCodeArray.length; i = i + 2) {
                curCharCode = charCodeArray[i];
                resultStr.push(String.fromCharCode(curCharCode));
                secondCode = charCodeArray[i + 1];
                if (secondCode != 0) {
                    resultStr.push(String.fromCharCode(secondCode));
                }
            }
        } else {
            for (var i = 0; i < charCodeArray.length; i = i + 1) {
                curCharCode = charCodeArray[i];
                resultStr.push(String.fromCharCode(curCharCode));
            }
        }
        return resultStr.join("");
    },
    hexStringToByte:function (hexStr){
        var len = hexStr.length;
        if(len % 2 != 0){
            return ""
        }
        var result = []
        for (var i = 0; i < len; i = i + 2) {
            var curCharCode = parseInt(hexStr.substr(i, 2), 16);
            result.push(curCharCode);
        }
        return result;
    },
    strToBytes:function(str,encoding){
        var bytes = [];
        var buff = new Buffer(str, encoding);
        for(var i= 0; i< buff.length; i++){
            var byteint = buff[i];
            bytes.push(byteint);
        }
        return bytes;
    } ,
    bin2String:function (array)
    {
        return String.fromCharCode.apply(String, array);
    },
    byteToShort: function (input,index) {
        if(input.length < index + 1){
            return;
        }
        return input[index + 1] + (input[index] << 8);
    },
    arrayOfRange: function (source, from, to) {
        var result = []
        for (var i = from; i < to && i < source.length; i++) {
            result.push(source[i])
        }
        return result;
    },
    arrayEquals:function (item1,item2){
      if(item1.length != item2.length){
          return false
      }
      for(var i = 0 ;i < item1.length;i++){
          if(item1[i] != item2[i]){
              return false
          }
      }
      return true
    },
    getGTM0Date: function(bytes, startIndex) {
        var dateStr = this.bytes2HexString(bytes, startIndex);
        var year = parseInt("20" + dateStr.substring(0, 2));
        var month = parseInt(dateStr.substring(2, 4)) - 1;
        var day = parseInt(dateStr.substring(4, 6));
        var hour = parseInt(dateStr.substring(6, 8));
        var minute = parseInt(dateStr.substring(8, 10));
        var second = parseInt(dateStr.substring(10, 12));

        // Create a Date object with the extracted values
        return new Date(Date.UTC(year, month, day, hour, minute, second));
    },
    byteToLong: function (bytes,index) {
        if (bytes.length < 4 + index) {
            return null
        }
        return bytes[index + 3] + ( bytes[index + 2]<< 8) + ( bytes[index+ 1]<< 16) + (bytes[index]<< 24);
    },
    short2Bytes:function (number){
        var bytes = [2]
        for (var i = 1; i >= 0; i--) {
            bytes[i] = number % 256
            number >>= 8;
        }
        return bytes;
    },
    stringToByte:function (str,codeType){
        var bytes = new Array();
        var len, c;
        len = str.length;
        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            bytes.push(c)
            if(codeType == "ascii"){
                bytes.push(0x00)
            }
        }
        return bytes;
    }
}

var PersonalAssetDecoder = {
    HEADER_LENGTH:3,
    SIGNUP:[0x27, 0x27, 0x01],
    DATA:[0x27, 0x27, 0x02],
    HEARTBEAT:[0x27, 0x27, 0x03],
    ALARM:[0x27, 0x27, 0x04],
    CONFIG:[0x27, 0x27, 0x81],
    NETWORK_INFO_DATA : [0x27, 0x27, 0x05],
    BLUETOOTH_DATA:[0x27, 0x27, 0x10],
    WIFI_DATA:[0x27, 0x27, 0x15],
    LOCK_DATA:[0x27, 0x27, 0x17],
    GEO_DATA :[0x27, 0x27, 0x20],
    BLUETOOTH_SECOND_DATA:[0x27, 0x27, 0x12],
    WIFI_WITH_DEVICE_INFO_DATA : [0x27, 0x27, 0x24 ],
    WIFI_ALAARM_WITH_DEVICE_INFO_DATA : [0x27, 0x27, 0x25 ],
    DEVICE_TEMP_COLLECTION_DATA: [0x27, 0x27, 0x26 ],
    latlngInvalidData:[0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,
        0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF],
    encryptType:0,
    aesKey:"",
    match:function(bytes){
        if(bytes.length != this.HEADER_LENGTH){
            return false
        }
        return ByteUtils.arrayEquals(this.SIGNUP, bytes)
            || ByteUtils.arrayEquals(this.HEARTBEAT, bytes)
            || ByteUtils.arrayEquals(this.DATA, bytes)
            || ByteUtils.arrayEquals(this.ALARM, bytes)
            || ByteUtils.arrayEquals(this.CONFIG,bytes)
            || ByteUtils.arrayEquals(this.BLUETOOTH_DATA,bytes)
            || ByteUtils.arrayEquals(this.WIFI_DATA,bytes)
            || ByteUtils.arrayEquals(this.LOCK_DATA,bytes)
            || ByteUtils.arrayEquals(this.GEO_DATA,bytes)
            || ByteUtils.arrayEquals(this.BLUETOOTH_SECOND_DATA,bytes)
            || ByteUtils.arrayEquals(this.WIFI_WITH_DEVICE_INFO_DATA,bytes)
            || ByteUtils.arrayEquals(this.WIFI_ALAARM_WITH_DEVICE_INFO_DATA,bytes)
            || ByteUtils.arrayEquals(this.DEVICE_TEMP_COLLECTION_DATA,bytes)
            || ByteUtils.arrayEquals(this.NETWORK_INFO_DATA,bytes);
    },
    decode(buf){
        TopflytechByteBuf.putBuf(buf);
        var messages = [];
        if (TopflytechByteBuf.getReadableBytes() < (this.HEADER_LENGTH + 2)){
            return messages;
        }
        var foundHead = false;
        var bytes= [3]
        while (TopflytechByteBuf.getReadableBytes() > 5){
            TopflytechByteBuf.markReaderIndex();
            bytes[0] = TopflytechByteBuf.getByte(0);
            bytes[1] = TopflytechByteBuf.getByte(1);
            bytes[2] = TopflytechByteBuf.getByte(2);
            if (this.match(bytes)){
                foundHead = true;
                TopflytechByteBuf.skipBytes(this.HEADER_LENGTH);
                var lengthBytes = TopflytechByteBuf.readBytes(2);
                var packageLength = ByteUtils.byteToShort(lengthBytes, 0);
                if (this.encryptType == CryptoTool.MessageEncryptType.MD5){
                    packageLength = packageLength + 8;
                }else if(this.encryptType == CryptoTool.MessageEncryptType.AES){
                    packageLength = CryptoTool.AES.getAesLength(packageLength);
                }
                TopflytechByteBuf.resetReaderIndex();
                if(packageLength <= 0){
                    TopflytechByteBuf.skipBytes(5);
                    break;
                }
                if (packageLength > TopflytechByteBuf.getReadableBytes()){
                    break;
                }
                var data = TopflytechByteBuf.readBytes(packageLength);
                data = CryptoTool.decryptData(data, this.encryptType, this.aesKey);
                if (data != null){
                    try {
                        var message = this.build(data);
                        if (message != null){
                            messages.push(message);
                        }
                    }catch (e){
                        console.log(e)
                    }
                }
            }else{
                TopflytechByteBuf.skipBytes(1);
            }
        }
        return messages
    },
    build:function (bytes){
        if (bytes != null && bytes.length > this.HEADER_LENGTH
            && (bytes[0] == 0x27 && bytes[1] == 0x27)) {
            switch (bytes[2]) {
                case 0x01:
                    var signInMessage = this.parseLoginMessage(bytes);
                    return signInMessage;
                case 0x03:
                    var heartbeatMessage = this.parseHeartbeat(bytes);
                    return heartbeatMessage;
                case 0x02:
                case 0x04:
                    var locationMessage = this.parseDataMessage(bytes);
                    return locationMessage;
                case 0x05:
                    var networkInfoMessage = this.parseNetworkInfoMessage(bytes);
                    return networkInfoMessage;
                case 0x10:
                    var bluetoothPeripheralDataMessage = this.parseBluetoothDataMessage(bytes);
                    return bluetoothPeripheralDataMessage;
                case 0x17:
                    var lockMessage = this.parseLockMessage(bytes);
                    return lockMessage;
                case 0x15:
                    var  wifiMessage = this.parseWifiMessage(bytes);
                    return wifiMessage;
                case 0x20:
                    var innerGeoDataMessage = this.parseInnerGeoMessage(bytes);
                    return innerGeoDataMessage;
                case 0x12:
                    var bluetoothPeripheralDataSecondMessage = this.parseSecondBluetoothDataMessage(bytes);
                    return bluetoothPeripheralDataSecondMessage;
                case 0x24:
                case 0x25:
                    var  wifiWithDeviceInfoMessage = this.parseWifiWithDeviceInfoMessage(bytes);
                    return wifiWithDeviceInfoMessage;
                case 0x26:
                    var deviceTempCollectionMessage = this.parseDeviceTempCollectionMessage(bytes);
                    return deviceTempCollectionMessage;
                case 0x81:
                    var message =  this.parseInteractMessage(bytes);
                    return message;
                default:
                    return null;
            }
        }
        return null;
    },
    parseHeartbeat:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var HeartbeatMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"heartbeat",
        }
        return HeartbeatMessage
    },
    parseInnerGeoMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var gmt0 = ByteUtils.getGTM0Date(bytes,15)
        var lockGeofenceEnable = bytes[21]
        var innerGeoDataMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"innerGeoData",
            date:gmt0,
            lockGeofenceEnable:lockGeofenceEnable,
            geoList:[],
        }
        var i = 22;
        while (i + 3 <= bytes.length){
            var id = bytes[i];
            var len = ByteUtils.byteToShort(bytes,i+1);
            var innerGeofence = {points:[]};
            innerGeofence.id = id;
            if(i + 3 + len > bytes.length){
                break;
            }
            if(len == 0){
                i += 3 + len;
                innerGeofence.type = -1;
                innerGeoDataMessage.geoList.push(innerGeofence);
                continue;
            }

            var geoType = bytes[i+3];
            innerGeofence.type = geoType;
            if(geoType == 0x01 || geoType == 0x02 || geoType == 0x03 || geoType == 0x07 || geoType == 0x08){
                var j = i+4;
                while (j < i + 3 + len){
                    var lng = ByteUtils.bytes2Float(bytes,j);
                    var lat = ByteUtils.bytes2Float(bytes,j+4);
                    innerGeofence.points.push([lat,lng]);
                    j+= 8;
                }
            }else{
                var radius = ByteUtils.byteToLong(bytes,i+4);
                var lng = ByteUtils.bytes2Float(bytes,i+8);
                var lat = ByteUtils.bytes2Float(bytes,i+12);
                innerGeofence.radius = radius;
                innerGeofence.points.push([lat,lng]);
            }
            innerGeoDataMessage.geoList.push(innerGeofence);
            i += 3 + len;
        }
        return innerGeoDataMessage;
    },
    parseSecondBluetoothDataMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var bluetoothPeripheralDataMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"bluetoothData",
        }
        bluetoothPeripheralDataMessage.isIgnition = (bytes[21] & 0x01) == 0x01
        bluetoothPeripheralDataMessage.protocolHeadType = bytes[2]
        bluetoothPeripheralDataMessage.date = ByteUtils.getGTM0Date(bytes, 15)
        var latlngValid = (bytes[22] & 0x40) == 0x40;
        var isHisData = (bytes[22] & 0x80) == 0x80;
        bluetoothPeripheralDataMessage.latlngValid = latlngValid
        bluetoothPeripheralDataMessage.isHistoryData = isHisData
        var altitude = latlngValid? ByteUtils.bytes2Float(bytes, 23) : 0.0;
        var longitude = latlngValid ? ByteUtils.bytes2Float(bytes, 27) : 0.0;
        var latitude = latlngValid ? ByteUtils.bytes2Float(bytes, 31) : 0.0;
        var azimuth = latlngValid ? ByteUtils.byteToShort(bytes, 37) : 0;
        var speedf = 0.0;
        if(latlngValid){
            var bytesSpeed = ByteUtils.arrayOfRange(bytes, 35, 37);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.indexOf("f") != -1){
                speedf = -999
            }else {
                speedf = parseFloat(strSp.substring(0, 3) +"."+ strSp.substring(3, strSp.length));
            }
        }
        var is_4g_lbs = false;
        var mcc_4g = null;
        var mnc_4g = null;
        var eci_4g = null;
        var tac = null;
        var pcid_4g_1 = null;
        var pcid_4g_2 = null;
        var pcid_4g_3 = null;
        var is_2g_lbs = false;
        var mcc_2g = null;
        var mnc_2g = null;
        var lac_2g_1 = null;
        var ci_2g_1 = null;
        var lac_2g_2 = null;
        var ci_2g_2 = null;
        var lac_2g_3 = null;
        var ci_2g_3 = null;
        if (!latlngValid){
            var lbsByte = bytes[23];
            if ((lbsByte & 0x80) == 0x80){
                is_4g_lbs = true;
            }else{
                is_2g_lbs = true;
            }
        }
        if (is_2g_lbs){
            mcc_2g = ByteUtils.byteToShort(bytes,23);
            mnc_2g = ByteUtils.byteToShort(bytes,25);
            lac_2g_1 = ByteUtils.byteToShort(bytes,27);
            ci_2g_1 = ByteUtils.byteToShort(bytes,29);
            lac_2g_2 = ByteUtils.byteToShort(bytes,31);
            ci_2g_2 = ByteUtils.byteToShort(bytes,33);
            lac_2g_3 = ByteUtils.byteToShort(bytes,35);
            ci_2g_3 = ByteUtils.byteToShort(bytes,37);
        }
        if (is_4g_lbs){
            mcc_4g = ByteUtils.byteToShort(bytes,23) & 0x7FFF;
            mnc_4g = ByteUtils.byteToShort(bytes,25);
            eci_4g = ByteUtils.byteToLong(bytes, 27);
            tac = ByteUtils.byteToShort(bytes, 31);
            pcid_4g_1 = ByteUtils.byteToShort(bytes, 33);
            pcid_4g_2 = ByteUtils.byteToShort(bytes, 35);
            pcid_4g_3 = ByteUtils.byteToShort(bytes,37);
        }
        bluetoothPeripheralDataMessage.latitude = latitude
        bluetoothPeripheralDataMessage.longitude = longitude
        bluetoothPeripheralDataMessage.azimuth = azimuth
        bluetoothPeripheralDataMessage.speed = speedf
        bluetoothPeripheralDataMessage.altitude = altitude
        bluetoothPeripheralDataMessage.isHadLocationInfo = true
        bluetoothPeripheralDataMessage.is_4g_lbs =is_4g_lbs
        bluetoothPeripheralDataMessage.is_2g_lbs =is_2g_lbs
        bluetoothPeripheralDataMessage.mcc_2g =mcc_2g
        bluetoothPeripheralDataMessage.mnc_2g =mnc_2g
        bluetoothPeripheralDataMessage.lac_2g_1 =lac_2g_1
        bluetoothPeripheralDataMessage.ci_2g_1 =ci_2g_1
        bluetoothPeripheralDataMessage.lac_2g_2 =lac_2g_2
        bluetoothPeripheralDataMessage.ci_2g_2 =ci_2g_2
        bluetoothPeripheralDataMessage.lac_2g_3 =lac_2g_3
        bluetoothPeripheralDataMessage.ci_2g_3 =ci_2g_3
        bluetoothPeripheralDataMessage.mcc_4g =mcc_4g
        bluetoothPeripheralDataMessage.mnc_4g =mnc_4g
        bluetoothPeripheralDataMessage.eci_4g =eci_4g
        bluetoothPeripheralDataMessage.tac =tac
        bluetoothPeripheralDataMessage.pcid_4g_1 =pcid_4g_1
        bluetoothPeripheralDataMessage.pcid_4g_2 =pcid_4g_2
        bluetoothPeripheralDataMessage.pcid_4g_3 =pcid_4g_3
        var bleData = ByteUtils.arrayOfRange(bytes,39,bytes.length);
        if (bleData.length <= 0){
            return bluetoothPeripheralDataMessage;
        }
        var bleDataList = []
        if(bleData[0] == 0x00 && bleData[1] == 0x01){
            bluetoothPeripheralDataMessage.bleMessageType = "tire"
            for (var i = 2;i+10 <= bleData.length;i+=10){
                var bleTireData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = 1.22 + 0.01 * voltageTmp;
                }
                var airPressureTmp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var airPressure;
                if(airPressureTmp == 255){
                    airPressure = -999;
                }else{
                    airPressure = 1.572 * 2 * airPressureTmp;
                }
                var airTempTmp = bleData[i + 8] < 0 ? bleData[i + 8] + 256 : bleData[i + 8];
                var airTemp;
                if(airTempTmp == 255){
                    airTemp = -999;
                }else{
                    airTemp = airTempTmp - 55;
                }
                bleTireData.mac =mac
                bleTireData.voltage =voltage
                bleTireData.airPressure =airPressure
                bleTireData.airTemp =airTemp
                var alarm = bleData[i + 9];
                if(alarm == -1){
                    alarm = 0;
                }
                bleTireData.status = alarm
                bleDataList.push(bleTireData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x02){
            bluetoothPeripheralDataMessage.bleMessageType = "sos"
            var bleAlertData = {}
            var macArray = ByteUtils.arrayOfRange(bleData, 2, 8);
            var mac = ByteUtils.bytes2HexString(macArray, 0);
            var voltageStr = ByteUtils.bytes2HexString(bleData,8).substring(0, 2);
            var voltage = parseFloat(voltageStr) / 10;

            var alertByte = bleData[9];
            var alert = alertByte == 0x01 ? "low_battery" : "sos";

            bleAlertData.setAlertType = alert
            bleAlertData.altitude = altitude
            bleAlertData.azimuth = azimuth
            bleAlertData.innerVoltage = voltage
            bleAlertData.isHistoryData = isHisData
            bleAlertData.latitude = latitude
            bleAlertData.latlngValid = latlngValid
            bleAlertData.longitude = longitude
            bleAlertData.mac = mac
            bleAlertData.speed = speedf
            bleAlertData.is_4g_lbs = is_4g_lbs
            bleAlertData.is_2g_lbs = is_2g_lbs
            bleAlertData.mcc_2g = mcc_2g
            bleAlertData.mnc_2g = mnc_2g
            bleAlertData.lac_2g_1 = lac_2g_1
            bleAlertData.ci_2g_1 = ci_2g_1
            bleAlertData.lac_2g_2 = lac_2g_2
            bleAlertData.ci_2g_2 = ci_2g_2
            bleAlertData.lac_2g_3 = lac_2g_3
            bleAlertData.ci_2g_3 = ci_2g_3
            bleAlertData.mcc_4g = mcc_4g
            bleAlertData.mnc_4g = mnc_4g
            bleAlertData.eci_4g = eci_4g
            bleAlertData.tac = tac
            bleAlertData.pcid_4g_1 = pcid_4g_1
            bleAlertData.pcid_4g_2 = pcid_4g_2
            bleAlertData.pcid_4g_3 = pcid_4g_3
            bleDataList.push(bleAlertData);
        }else if (bleData[0] == 0x00 && bleData[1] == 0x03){
            bluetoothPeripheralDataMessage.bleMessageType = "driver"
            var bleDriverSignInData = {}
            var macArray = ByteUtils.arrayOfRange(bleData, 2,8);
            var mac = ByteUtils.bytes2HexString(macArray, 0);
            var voltageStr = ByteUtils.bytes2HexString(bleData,8).substring(0, 2);
            var voltage = parseFloat(voltageStr) / 10;

            var alertByte = bleData[9];
            var alert = alertByte == 0x01 ? "low_battery" : "driver"

            bleDriverSignInData.setAlert =alert
            bleDriverSignInData.altitude =altitude
            bleDriverSignInData.azimuth =azimuth
            bleDriverSignInData.voltage =voltage
            bleDriverSignInData.isHistoryData = isHisData
            bleDriverSignInData.latitude =latitude
            bleDriverSignInData.latlngValid =latlngValid
            bleDriverSignInData.longitude =longitude
            bleDriverSignInData.mac =mac
            bleDriverSignInData.speed = speedf
            bleDriverSignInData.is_4g_lbs =is_4g_lbs
            bleDriverSignInData.is_2g_lbs =is_2g_lbs
            bleDriverSignInData.mcc_2g =mcc_2g
            bleDriverSignInData.mnc_2g =mnc_2g
            bleDriverSignInData.lac_2g_1 =lac_2g_1
            bleDriverSignInData.ci_2g_1 =ci_2g_1
            bleDriverSignInData.lac_2g_2 =lac_2g_2
            bleDriverSignInData.ci_2g_2 =ci_2g_2
            bleDriverSignInData.lac_2g_3 =lac_2g_3
            bleDriverSignInData.ci_2g_3 =ci_2g_3
            bleDriverSignInData.mcc_4g =mcc_4g
            bleDriverSignInData.mnc_4g =mnc_4g
            bleDriverSignInData.eci_4g =eci_4g
            bleDriverSignInData.tac =tac
            bleDriverSignInData.pcid_4g_1 =pcid_4g_1
            bleDriverSignInData.pcid_4g_2 =pcid_4g_2
            bleDriverSignInData.pcid_4g_3 =pcid_4g_3
            bleDataList.push(bleDriverSignInData);
        }else if (bleData[0] == 0x00 && bleData[1] == 0x04){
            bluetoothPeripheralDataMessage.bleMessageType = "temp"
            for (var i = 2;i +15 <= bleData.length;i+=15){
                var bleTempData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                if(mac.startsWith("0000")){
                    mac = mac.substring(4,12);
                }
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6]
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var humidityTemp = ByteUtils.byteToShort(bleData,i+10);
                var humidity;
                if(humidityTemp == 65535){
                    humidity = -999;
                }else{
                    humidity = parseFloat((humidityTemp * 0.01).toFixed(2));
                }
                var lightTemp = ByteUtils.byteToShort(bleData,i+12);
                var lightIntensity ;
                if(lightTemp == 65535){
                    lightIntensity = -999;
                }else{
                    lightIntensity = lightTemp & 0x0001;
                }
                var rssiTemp = bleData[i + 14] < 0 ? bleData[i + 14] + 256 : bleData[i + 14];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleTempData.rssi =rssi
                bleTempData.mac =mac
                bleTempData.lightIntensity =lightIntensity
                bleTempData.humidity =humidity
                bleTempData.voltage =voltage
                bleTempData.batteryPercent =batteryPercent
                bleTempData.temp =temperature
                bleDataList.push(bleTempData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x05){
            bluetoothPeripheralDataMessage.bleMessageType = "door"
            for (var i = 2;i+12 <= bleData.length;i+=12){
                var bleDoorData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ?  bleData[i + 6] + 256 :  bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var doorStatus = bleData[i+10] < 0 ? bleData[i+10] + 256 : bleData[i+10];
                var online = 1;
                if(doorStatus == 255){
                    doorStatus = -999;
                    online = 0;
                }

                var rssiTemp = bleData[i + 11] < 0 ? bleData[i + 11] + 256 : bleData[i + 11];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleDoorData.rssi =rssi
                bleDoorData.mac =mac
                bleDoorData.online =online
                bleDoorData.doorStatus =doorStatus
                bleDoorData.voltage =voltage
                bleDoorData.batteryPercent =batteryPercent
                bleDoorData.temp =temperature
                bleDataList.push(bleDoorData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x06){
            bluetoothPeripheralDataMessage.bleMessageType = "ctrl"
            for (var i = 2;i+12 <= bleData.length;i+=12){
                var bleCtrlData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed());
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var CtrlStatus =bleData[i+10] < 0 ? bleData[i+10] + 256 : bleData[i+10];
                var online = 1;
                if(CtrlStatus == 255){
                    CtrlStatus = -999;
                    online = 0;
                }

                var rssiTemp = bleData[i + 11] < 0 ? bleData[i + 11] + 256 : bleData[i + 11];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleCtrlData.setRssi = rssi
                bleCtrlData.setMac = mac
                bleCtrlData.setOnline = online
                bleCtrlData.setCtrlStatus = CtrlStatus
                bleCtrlData.voltage = voltage
                bleCtrlData.setBatteryPercent = batteryPercent
                bleCtrlData.temp = temperature
                bleDataList.push(bleCtrlData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x07){
            bluetoothPeripheralDataMessage.bleMessageType = "fuel"
            for (var i = 2;i+15 <= bleData.length;i+=15){
                var bleFuelData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var valueTemp = ByteUtils.byteToShort(bleData,i+7);
                var value;
                if(valueTemp == 65535){
                    value = -999;
                }else{
                    value = valueTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+9);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var status =bleData[i+13] < 0 ? bleData[i+13] + 256 : bleData[i+13];
                var online = 1;
                if(status == 255){
                    status = 0;
                    online = 0;
                }
                var rssiTemp = bleData[i + 14] < 0 ? bleData[i + 14] + 256 : bleData[i + 14];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleFuelData.rssi = rssi
                bleFuelData.mac = mac
                bleFuelData.online = online
                bleFuelData.status = status
                bleFuelData.voltage = voltage
                bleFuelData.value = value
                bleFuelData.temp = temperature
                bleDataList.push(bleFuelData);
            }
        }
        bluetoothPeripheralDataMessage.bleDataList = bleDataList
        return bluetoothPeripheralDataMessage;
    },
    parseNetworkInfoMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var networkInfoMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"networkInfo",
        }
        var gmt0 = ByteUtils.getGTM0Date(bytes,15)
        var networkOperatorLen = bytes[21];
        var networkOperatorStartIndex = 22;
        var networkOperatorByte = ByteUtils.arrayOfRange(bytes, networkOperatorStartIndex, networkOperatorStartIndex + networkOperatorLen);
        var networkOperator = ByteUtils.charArrayToStr(networkOperatorByte,"ascii")
        var accessTechnologyLen = bytes[networkOperatorStartIndex + networkOperatorLen];
        var accessTechnologyStartIndex = networkOperatorStartIndex + networkOperatorLen + 1;
        var accessTechnologyByte = ByteUtils.arrayOfRange(bytes, accessTechnologyStartIndex,accessTechnologyStartIndex + accessTechnologyLen);
        var accessTechnology = ByteUtils.bin2String(accessTechnologyByte)
        var bandLen = bytes[accessTechnologyStartIndex + accessTechnologyLen];
        var bandStartIndex = accessTechnologyStartIndex + accessTechnologyLen + 1;
        var bandLenByte = ByteUtils.arrayOfRange(bytes, bandStartIndex,bandStartIndex + bandLen);
        var band = ByteUtils.bin2String(bandLenByte)
        var msgLen = ByteUtils.byteToShort(bytes,3);
        if(msgLen > bandStartIndex + bandLen ){
            var IMSILen = bytes[bandStartIndex + bandLen];
            var IMSIStartIndex = bandStartIndex + bandLen + 1;
            var IMSILenByte = ByteUtils.arrayOfRange(bytes,IMSIStartIndex,IMSIStartIndex + IMSILen);
            var IMSI = ByteUtils.bin2String(IMSILenByte)
            networkInfoMessage.imsi = IMSI
            if(msgLen > IMSIStartIndex + IMSILen){
                var iccidLen = bytes[IMSIStartIndex + IMSILen];
                var iccidStartIndex = IMSIStartIndex + IMSILen + 1;
                var iccidLenByte = ByteUtils.arrayOfRange(bytes,iccidStartIndex,iccidStartIndex + iccidLen);
                var iccid = ByteUtils.bin2String(iccidLenByte)
                networkInfoMessage.iccid = iccid
            }
        }
        networkInfoMessage.date = gmt0;
        networkInfoMessage.accessTechnology = accessTechnology
        networkInfoMessage.networkOperator = networkOperator
        networkInfoMessage.band = band
        return networkInfoMessage;
    },
    parseInteractMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var data = ByteUtils.arrayOfRange(bytes,16,bytes.length)
        var content = ByteUtils.charArrayToStr(data,"ascii")
        var configMessage = {
            serialNo:serialNo,
            messageType:"config",
            imei:imei,
            srcBytes:bytes,
            content:content,
        }
        return configMessage
    },
    parseBluetoothDataMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var bluetoothPeripheralDataMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"bluetoothData",
        }
        bluetoothPeripheralDataMessage.isIgnition = (bytes[21] & 0x01) == 0x01
        bluetoothPeripheralDataMessage.protocolHeadType = bytes[2]
        bluetoothPeripheralDataMessage.date = ByteUtils.getGTM0Date(bytes, 15);
        var bleData = ByteUtils.arrayOfRange(bytes,22,bytes.length);
        if (bleData.length <= 0){
            return bluetoothPeripheralDataMessage;
        }
        var bleDataList = []
        if(bleData[0] == 0x00 && bleData[1] == 0x01){
            bluetoothPeripheralDataMessage.bleMessageType = "tire"
            for (var i = 2;i+10 <= bleData.length;i+=10){
                var bleTireData = [];
                var macArray = ByteUtils.arrayOfRange(bleData, i, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp =  bleData[i + 6] < 0 ?  bleData[i + 6] + 256 :  bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = 1.22 + 0.01 * voltageTmp;
                }
                var airPressureTmp =  bleData[i + 7] < 0 ?  bleData[i + 7] + 256 :  bleData[i + 7];
                var airPressure;
                if(airPressureTmp == 255){
                    airPressure = -999;
                }else{
                    airPressure = 1.572 * 2 * airPressureTmp;
                }
                var airTempTmp =  bleData[i + 8] < 0 ? bleData[i + 8] + 256 :  bleData[i + 8];
                var airTemp;
                if(airTempTmp == 255){
                    airTemp = -999;
                }else{
                    airTemp = airTempTmp - 55;
                }
                //var isTireLeaks = (bleData[i+5] == 0x01);
                bleTireData.mac =mac
                bleTireData.voltage =voltage
                bleTireData.airPressure =airPressure
                bleTireData.airTemp =airTemp
                //bleTireData.setIsTireLeaks(isTireLeaks);
                var alarm =  bleData[i + 9];
                if(alarm == -1){
                    alarm = 0;
                }
                bleTireData.alarm = alarm
                bleDataList.push(bleTireData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x02){
            bluetoothPeripheralDataMessage.bleMessageType = "sos"
            var bleAlertData = {}
            var macArray = ByteUtils.arrayOfRange(bleData, 2, 8);
            var mac = ByteUtils.bytes2HexString(macArray, 0);
            var voltageStr = ByteUtils.bytes2HexString(bleData,8).substring(0, 2);
            var voltage = parseFloat(voltageStr) / 10;
            var alertByte = bleData[9];
            var alert = alertByte == 0x01 ? "low_battery" : "sos";
            var isHistoryData = (bleData[10] & 0x80) != 0x00;
            var latlngValid = (bleData[10] & 0x40) != 0x00;
            var satelliteCount = bleData[10] & 0x1F;
            var altitude = latlngValid? ByteUtils.bytes2Float(bleData, 11) : 0.0;
            var longitude = latlngValid ? ByteUtils.bytes2Float(bleData, 15) : 0.0;
            var latitude = latlngValid ? ByteUtils.bytes2Float(bleData, 19) : 0.0;
            var azimuth = latlngValid ? ByteUtils.byteToShort(bleData, 25) : 0;
            var speedf = 0.0;
            var bytesSpeed = ByteUtils.arrayOfRange(bleData, 23, 25);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.indexOf("f") != -1){
                speedf = -1;
            }else {
                speedf = parseFloat(strSp.substring(0, 3) +"."+ strSp.substring(3, strSp.length));
            }
            var is_4g_lbs = false;
            var mcc_4g = null;
            var mnc_4g = null;
            var eci_4g = null;
            var tac = null;
            var pcid_4g_1 = null;
            var pcid_4g_2 = null;
            var pcid_4g_3 = null;
            var is_2g_lbs = false;
            var mcc_2g = null;
            var mnc_2g = null;
            var lac_2g_1 = null;
            var ci_2g_1 = null;
            var lac_2g_2 = null;
            var ci_2g_2 = null;
            var lac_2g_3 = null;
            var ci_2g_3 = null;
            if (!latlngValid){
                var lbsByte = bleData[11];
                if ((lbsByte & 0x80) == 0x80){
                    is_4g_lbs = true;
                }else{
                    is_2g_lbs = true;
                }
            }
            if (is_2g_lbs){
                mcc_2g = ByteUtils.byteToShort(bleData,11);
                mnc_2g = ByteUtils.byteToShort(bleData,13);
                lac_2g_1 = ByteUtils.byteToShort(bleData,15);
                ci_2g_1 = ByteUtils.byteToShort(bleData,17);
                lac_2g_2 = ByteUtils.byteToShort(bleData,19);
                ci_2g_2 = ByteUtils.byteToShort(bleData,21);
                lac_2g_3 = ByteUtils.byteToShort(bleData,23);
                ci_2g_3 = ByteUtils.byteToShort(bleData,25);
            }
            if (is_4g_lbs){
                mcc_4g = ByteUtils.byteToShort(bleData,11) & 0x7FFF;
                mnc_4g = ByteUtils.byteToShort(bleData,13);
                eci_4g = ByteUtils.byteToLong(bleData, 15);
                tac = ByteUtils.byteToShort(bleData, 19);
                pcid_4g_1 = ByteUtils.byteToShort(bleData, 21);
                pcid_4g_2 = ByteUtils.byteToShort(bleData, 23);
                pcid_4g_3 = ByteUtils.byteToShort(bleData,25);
            }
            bleAlertData.alertType = alert
            bleAlertData.altitude = altitude
            bleAlertData.azimuth = azimuth
            bleAlertData.innerVoltage = voltage
            bleAlertData.isHistoryData = isHistoryData
            bleAlertData.latitude = latitude
            bleAlertData.latlngValid = latlngValid
            bleAlertData.satelliteCount = satelliteCount
            bleAlertData.longitude = longitude
            bleAlertData.mac = mac
            bleAlertData.speed = speedf
            bleAlertData.is_4g_lbs = is_4g_lbs
            bleAlertData.is_2g_lbs = is_2g_lbs
            bleAlertData.mcc_2g = mcc_2g
            bleAlertData.mnc_2g = mnc_2g
            bleAlertData.lac_2g_1 = lac_2g_1
            bleAlertData.ci_2g_1 = ci_2g_1
            bleAlertData.lac_2g_2 = lac_2g_2
            bleAlertData.ci_2g_2 = ci_2g_2
            bleAlertData.lac_2g_3 = lac_2g_3
            bleAlertData.ci_2g_3 = ci_2g_3
            bleAlertData.mcc_4g = mcc_4g
            bleAlertData.mnc_4g = mnc_4g
            bleAlertData.eci_4g = eci_4g
            bleAlertData.tac = tac
            bleAlertData.pcid_4g_1 = pcid_4g_1
            bleAlertData.pcid_4g_2 = pcid_4g_2
            bleAlertData.pcid_4g_3 = pcid_4g_3
            bleDataList.push(bleAlertData);
        }else if (bleData[0] == 0x00 && bleData[1] == 0x03){
            bluetoothPeripheralDataMessage.bleMessageType = "driver"
            var bleDriverSignInData = {}
            var macArray = ByteUtils.arrayOfRange(bleData, 2,8);
            var mac = ByteUtils.bytes2HexString(macArray, 0);
            var voltageStr = ByteUtils.bytes2HexString(bleData,8).substring(0, 2);
            var voltage = parseFloat(voltageStr) / 10;
            var alertByte = bleData[9];
            var alert = alertByte == 0x01 ? "low_battery" : "driver";
            var isHistoryData = (bleData[10] & 0x80) != 0x00;
            var latlngValid = (bleData[10] & 0x40) != 0x00;
            var satelliteCount = bleData[10] & 0x1F;
            var altitude = latlngValid? ByteUtils.bytes2Float(bleData, 11) : 0.0;
            var longitude = latlngValid ? ByteUtils.bytes2Float(bleData, 15) : 0.0;
            var latitude = latlngValid ? ByteUtils.bytes2Float(bleData, 19) : 0.0;
            var azimuth = latlngValid ? ByteUtils.byteToShort(bleData, 25) : 0;
            var speedf = 0.0;
            var bytesSpeed = ByteUtils.arrayOfRange(bleData, 23, 25);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.indexOf("f") != -1){
                speedf = -1;
            }else {
                speedf = parseFloat(strSp.substring(0, 3) +"."+ strSp.substring(3, strSp.length));
            }
            var is_4g_lbs = false;
            var mcc_4g = null;
            var mnc_4g = null;
            var eci_4g = null;
            var tac = null;
            var pcid_4g_1 = null;
            var pcid_4g_2 = null;
            var pcid_4g_3 = null;
            var is_2g_lbs = false;
            var mcc_2g = null;
            var mnc_2g = null;
            var lac_2g_1 = null;
            var ci_2g_1 = null;
            var lac_2g_2 = null;
            var ci_2g_2 = null;
            var lac_2g_3 = null;
            var ci_2g_3 = null;
            if (!latlngValid){
                var lbsByte = bleData[11];
                if ((lbsByte & 0x80) == 0x80){
                    is_4g_lbs = true;
                }else{
                    is_2g_lbs = true;
                }
            }
            if (is_2g_lbs){
                mcc_2g = ByteUtils.byteToShort(bleData,11);
                mnc_2g = ByteUtils.byteToShort(bleData,13);
                lac_2g_1 = ByteUtils.byteToShort(bleData,15);
                ci_2g_1 = ByteUtils.byteToShort(bleData,17);
                lac_2g_2 = ByteUtils.byteToShort(bleData,19);
                ci_2g_2 = ByteUtils.byteToShort(bleData,21);
                lac_2g_3 = ByteUtils.byteToShort(bleData,23);
                ci_2g_3 = ByteUtils.byteToShort(bleData,25);
            }
            if (is_4g_lbs){
                mcc_4g = ByteUtils.byteToShort(bleData,11) & 0x7FFF;
                mnc_4g = ByteUtils.byteToShort(bleData,13);
                eci_4g = ByteUtils.byteToLong(bleData, 15);
                tac = ByteUtils.byteToShort(bleData, 19);
                pcid_4g_1 = ByteUtils.byteToShort(bleData, 21);
                pcid_4g_2 = ByteUtils.byteToShort(bleData, 23);
                pcid_4g_3 = ByteUtils.byteToShort(bleData,25);
            }
            bleDriverSignInData.alert = alert
            bleDriverSignInData.altitude = altitude
            bleDriverSignInData.azimuth = azimuth
            bleDriverSignInData.voltage = voltage
            bleDriverSignInData.isHistoryData = isHistoryData
            bleDriverSignInData.latitude = latitude
            bleDriverSignInData.latlngValid = latlngValid
            bleDriverSignInData.satelliteCount = satelliteCount
            bleDriverSignInData.longitude = longitude
            bleDriverSignInData.mac = mac
            bleDriverSignInData.speed = speedf
            bleDriverSignInData.is_4g_lbs = is_4g_lbs
            bleDriverSignInData.is_2g_lbs = is_2g_lbs
            bleDriverSignInData.mcc_2g = mcc_2g
            bleDriverSignInData.mnc_2g = mnc_2g
            bleDriverSignInData.lac_2g_1 = lac_2g_1
            bleDriverSignInData.ci_2g_1 = ci_2g_1
            bleDriverSignInData.lac_2g_2 = lac_2g_2
            bleDriverSignInData.ci_2g_2 = ci_2g_2
            bleDriverSignInData.lac_2g_3 = lac_2g_3
            bleDriverSignInData.ci_2g_3 = ci_2g_3
            bleDriverSignInData.mcc_4g = mcc_4g
            bleDriverSignInData.mnc_4g = mnc_4g
            bleDriverSignInData.eci_4g = eci_4g
            bleDriverSignInData.tac = tac
            bleDriverSignInData.pcid_4g_1 = pcid_4g_1
            bleDriverSignInData.pcid_4g_2 = pcid_4g_2
            bleDriverSignInData.pcid_4g_3 = pcid_4g_3
            bleDataList.push(bleDriverSignInData);
        }else if (bleData[0] == 0x00 && bleData[1] == 0x04){
            bluetoothPeripheralDataMessage.bleMessageType = "temp"
            for (var i = 2;i +15 <= bleData.length;i+=15){
                var bleTempData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                if(mac.startsWith("0000")){
                    mac = mac.substring(4,12);
                }
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6]
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var humidityTemp = ByteUtils.byteToShort(bleData,i+10);
                var humidity;
                if(humidityTemp == 65535){
                    humidity = -999;
                }else{
                    humidity = parseFloat((humidityTemp * 0.01).toFixed(2));
                }
                var lightTemp = ByteUtils.byteToShort(bleData,i+12);
                var lightIntensity ;
                if(lightTemp == 65535){
                    lightIntensity = -999;
                }else{
                    lightIntensity = lightTemp & 0x0001;
                }
                var rssiTemp = bleData[i + 14] < 0 ? bleData[i + 14] + 256 : bleData[i + 14];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleTempData.rssi =rssi
                bleTempData.mac =mac
                bleTempData.lightIntensity =lightIntensity
                bleTempData.humidity =humidity
                bleTempData.voltage =voltage
                bleTempData.batteryPercent =batteryPercent
                bleTempData.temp =temperature
                bleDataList.push(bleTempData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x05){
            bluetoothPeripheralDataMessage.bleMessageType = "door"
            for (var i = 2;i+12 <= bleData.length;i+=12){
                var bleDoorData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ?  bleData[i + 6] + 256 :  bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var doorStatus = bleData[i+10] < 0 ? bleData[i+10] + 256 : bleData[i+10];
                var online = 1;
                if(doorStatus == 255){
                    doorStatus = -999;
                    online = 0;
                }

                var rssiTemp = bleData[i + 11] < 0 ? bleData[i + 11] + 256 : bleData[i + 11];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleDoorData.rssi =rssi
                bleDoorData.mac =mac
                bleDoorData.online =online
                bleDoorData.doorStatus =doorStatus
                bleDoorData.voltage =voltage
                bleDoorData.batteryPercent =batteryPercent
                bleDoorData.temp =temperature
                bleDataList.push(bleDoorData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x06){
            bluetoothPeripheralDataMessage.bleMessageType = "ctrl"
            for (var i = 2;i+12 <= bleData.length;i+=12){
                var bleCtrlData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed());
                }
                var batteryPercentTemp = bleData[i + 7] < 0 ? bleData[i + 7] + 256 : bleData[i + 7];
                var batteryPercent;
                if(batteryPercentTemp == 255){
                    batteryPercent = -999;
                }else{
                    batteryPercent = batteryPercentTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+8);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var CtrlStatus =bleData[i+10] < 0 ? bleData[i+10] + 256 : bleData[i+10];
                var online = 1;
                if(CtrlStatus == 255){
                    CtrlStatus = -999;
                    online = 0;
                }

                var rssiTemp = bleData[i + 11] < 0 ? bleData[i + 11] + 256 : bleData[i + 11];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleCtrlData.setRssi = rssi
                bleCtrlData.setMac = mac
                bleCtrlData.setOnline = online
                bleCtrlData.setCtrlStatus = CtrlStatus
                bleCtrlData.voltage = voltage
                bleCtrlData.setBatteryPercent = batteryPercent
                bleCtrlData.temp = temperature
                bleDataList.push(bleCtrlData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x07){
            bluetoothPeripheralDataMessage.bleMessageType = "fuel"
            for (var i = 2;i+15 <= bleData.length;i+=15){
                var bleFuelData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                var voltageTmp = bleData[i + 6] < 0 ? bleData[i + 6] + 256 : bleData[i + 6];
                var voltage;
                if(voltageTmp == 255){
                    voltage = -999;
                }else{
                    voltage = parseFloat((2 + 0.01 * voltageTmp).toFixed(2));
                }
                var valueTemp = ByteUtils.byteToShort(bleData,i+7);
                var value;
                if(valueTemp == 65535){
                    value = -999;
                }else{
                    value = valueTemp;
                }
                var temperatureTemp = ByteUtils.byteToShort(bleData,i+9);
                var tempPositive = (temperatureTemp & 0x8000) == 0 ? 1 : -1;
                var temperature;
                if(temperatureTemp == 65535){
                    temperature = -999;
                }else{
                    temperature = parseFloat(((temperatureTemp & 0x7fff) * 0.01 * tempPositive).toFixed(2));
                }
                var status =bleData[i+13] < 0 ? bleData[i+13] + 256 : bleData[i+13];
                var online = 1;
                if(status == 255){
                    status = 0;
                    online = 0;
                }
                var rssiTemp = bleData[i + 14] < 0 ? bleData[i + 14] + 256 : bleData[i + 14];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                bleFuelData.rssi = rssi
                bleFuelData.mac = mac
                bleFuelData.online = online
                bleFuelData.status = status
                bleFuelData.voltage = voltage
                bleFuelData.value = value
                bleFuelData.temp = temperature
                bleDataList.push(bleFuelData);
            }
        }else if (bleData[0] == 0x00 && bleData[1] == 0x0d){
            bluetoothPeripheralDataMessage.bleMessageType = "customer2397Sensor"
            var i = 2;
            while (i + 8 < bleData.length){
                var bleCustomer2397SensorData = {}
                var macArray = ByteUtils.arrayOfRange(bleData, i + 0, i + 6);
                var mac = ByteUtils.bytes2HexString(macArray, 0);
                i+=6;
                i+=1;
                var rawDataLen = bleData[i] < 0 ? bleData[i] + 256 : bleData[i];
                if(i + rawDataLen >= bleData.length || rawDataLen < 1){
                    break;
                }
                i += 1;
                var rawData = ByteUtils.arrayOfRange(bleData,i,i+rawDataLen-1);
                i += rawDataLen - 1;
                var rssiTemp = bleData[i] < 0 ? bleData[i] + 256 : bleData[i];
                var rssi;
                if(rssiTemp == 255){
                    rssi = -999;
                }else{
                    rssi = rssiTemp - 128;
                }
                i += 1;
                bleCustomer2397SensorData.rawData = rawData
                bleCustomer2397SensorData.mac = mac
                bleCustomer2397SensorData.rssi = rssi
                bleDataList.push(bleCustomer2397SensorData);
            }
        }
        bluetoothPeripheralDataMessage.bleDataList = bleDataList
        return bluetoothPeripheralDataMessage;
    },
    parseLoginMessage:function (bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var software = "V" + (bytes[15] & 0xf) + "." + ((bytes[16] & 0xf0) >> 4) + "." + (bytes[16] & 0xf)
        var firmware = ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 20, 22), 0);
        firmware = "V" + firmware.substring(0,1) + "." + firmware.substring(1, 2) + "." + firmware.substring(2,3) + "." + firmware.substring(3,4)
        var hardwareByte = bytes[22];
        var hardware = "";
        if((hardwareByte & 0x80) == 0x80){
            hardware = ByteUtils.bytes2HexString([hardwareByte & 0x7f], 0);
        }else{
            hardware = ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 22, 23), 0);
        }
        hardware = hardware.substring(0,1)+ "." + hardware.substring(1, 2)
        var signInMessage = {
            serialNo:serialNo,
            imei:imei,
            software:software,
            firmware:firmware,
            hardware:hardware,
            srcBytes:bytes,
            messageType:"signIn",
        }
        return signInMessage
    },
    parseLockMessage:function(bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var lockMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"lock",
        }
        var date = ByteUtils.getGTM0Date(bytes, 15);
        var latlngValid = (bytes[21] & 0x40) != 0x00;
        var isGpsWorking = (bytes[21] & 0x20) == 0x00;
        var isHistoryData = (bytes[21] & 0x80) != 0x00;
        var satelliteCount = bytes[21] & 0x1F;
        var latlngData = ByteUtils.arrayOfRange(bytes,22,38);
        if (ByteUtils.arrayEquals(latlngData,this.latlngInvalidData)){
            latlngValid = false;
        }
        var altitude = latlngValid ? ByteUtils.bytes2Float(bytes, 22) : 0;
        var longitude = latlngValid ? ByteUtils.bytes2Float(bytes,26) : 0;
        var latitude = latlngValid ? ByteUtils.bytes2Float(bytes,30) : 0;
        var speedf = 0.0;
        if (latlngValid){
            var bytesSpeed = ByteUtils.arrayOfRange(bytes, 34, 36);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.toLowerCase() !=="ffff" ){
                speedf = parseFloat(strSp.substring(0, 3) + "." +strSp.substring(3, strSp.length));
            }
        }
        var azimuth = latlngValid ? ByteUtils.byteToShort(bytes, 36) : 0;
        var is_4g_lbs = false;
        var mcc_4g = null;
        var mnc_4g = null;
        var eci_4g = null;
        var tac = null;
        var pcid_4g_1 = null;
        var pcid_4g_2 = null;
        var pcid_4g_3 = null;
        var is_2g_lbs = false;
        var mcc_2g = null;
        var mnc_2g = null;
        var lac_2g_1 = null;
        var ci_2g_1 = null;
        var lac_2g_2 = null;
        var ci_2g_2 = null;
        var lac_2g_3 = null;
        var ci_2g_3 = null;
        if (!latlngValid){
            var lbsByte = bytes[22];
            if ((lbsByte & 0x80) == 0x80){
                is_4g_lbs = true;
            }else{
                is_2g_lbs = true;
            }
        }
        if (is_2g_lbs){
            mcc_2g = ByteUtils.byteToShort(bytes,22);
            mnc_2g = ByteUtils.byteToShort(bytes,24);
            lac_2g_1 = ByteUtils.byteToShort(bytes,26);
            ci_2g_1 = ByteUtils.byteToShort(bytes,28);
            lac_2g_2 = ByteUtils.byteToShort(bytes,30);
            ci_2g_2 = ByteUtils.byteToShort(bytes,32);
            lac_2g_3 = ByteUtils.byteToShort(bytes,34);
            ci_2g_3 = ByteUtils.byteToShort(bytes,36);
        }
        if (is_4g_lbs){
            mcc_4g = ByteUtils.byteToShort(bytes,22) & 0x7FFF;
            mnc_4g = ByteUtils.byteToShort(bytes,24);
            eci_4g = ByteUtils.bin2String(bytes, 26);
            tac = ByteUtils.byteToShort(bytes, 30);
            pcid_4g_1 = ByteUtils.byteToShort(bytes, 32);
            pcid_4g_2 = ByteUtils.byteToShort(bytes, 34);
            pcid_4g_3 = ByteUtils.byteToShort(bytes,36);
        }
        var lockType = bytes[38] & 0xff;
        if(lockType < 0){
            lockType += 256;
        }
        var idLen = (bytes[39] & 0xff) * 2;
        var idStr = ByteUtils.bytes2HexString(bytes,40);
        var id = idStr;
        if (idStr.length > idLen){
            id = idStr.substring(0,idLen);
        }
        id = id.toUpperCase();
        lockMessage.protocolHeadType = bytes[2]
        lockMessage.date = date
        lockMessage.latlngValid = latlngValid
        lockMessage.altitude = altitude
        lockMessage.longitude = longitude
        lockMessage.latitude = latitude
        lockMessage.latlngValid = latlngValid
        lockMessage.speed=speedf
        lockMessage.azimuth=azimuth
        lockMessage.lockType=lockType
        lockMessage.lockId=id

        lockMessage.isHistoryData = isHistoryData
        lockMessage.satelliteCount = satelliteCount
        lockMessage.isGpsWorking = isGpsWorking
        lockMessage.is_4g_lbs = is_4g_lbs
        lockMessage.is_2g_lbs = is_2g_lbs
        lockMessage.mcc_2g = mcc_2g
        lockMessage.mnc_2g = mnc_2g
        lockMessage.lac_2g_1 = lac_2g_1
        lockMessage.ci_2g_1 = ci_2g_1
        lockMessage.lac_2g_2 = lac_2g_2
        lockMessage.ci_2g_2 = ci_2g_2
        lockMessage.lac_2g_3 = lac_2g_3
        lockMessage.ci_2g_3 = ci_2g_3
        lockMessage.mcc_4g = mcc_4g
        lockMessage.mnc_4g = mnc_4g
        lockMessage.eci_4g = eci_4g
        lockMessage.tac = tac
        lockMessage.pcid_4g_1 = pcid_4g_1
        lockMessage.pcid_4g_2 = pcid_4g_2
        lockMessage.pcid_4g_3 = pcid_4g_3

        return lockMessage;
    },
    parseDeviceTempCollectionMessage:function(bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7);
        var date = ByteUtils.getGTM0Date(bytes, 15);
        var type = bytes[21];
        var interval = ByteUtils.byteToShort(bytes,22);
        var valueLen = bytes.length - 24;
        var deviceTempCollectionMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"deviceTempCollection",
        }
        deviceTempCollectionMessage.date = date;
        deviceTempCollectionMessage.type = type;
        deviceTempCollectionMessage.interval = interval;
        if(valueLen > 0 && valueLen / 2 > 0){
            var tempCount = valueLen / 2;
            var tempList = [];
            for(var i = 0;i < tempCount;i++){
                var tempInt = ByteUtils.byteToShort(bytes,24 + i * 2);
                tempList.push(tempInt * 0.01);
            }
            deviceTempCollectionMessage.tempList = tempList ;
        }
        return deviceTempCollectionMessage;
    },
    parseWifiWithDeviceInfoMessage:function(bytes){
        var isWifiMsg = (bytes[15] & 0x20) == 0x20;
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var date = ByteUtils.getGTM0Date(bytes, 17);
        var isHisData = (bytes[15] & 0x80) == 0x80
        var isGpsWorking = (bytes[15] & 0x8) == 0x8  ? false : true
        var originalAlarmCode = bytes[16]
        if(originalAlarmCode < 0){
            originalAlarmCode += 256
        }
        var selfMac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 23, 29), 0);
        var ap1Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 29, 35), 0);
        var ap1Rssi = bytes[35];
        var ap2Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes,36,42),0);
        var ap2Rssi = bytes[42];
        var ap3Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes,43,49),0);
        var ap3Rssi = bytes[49];

        var latlngValid = (bytes[15] & 0x40) == 0x40;
        var altitude = latlngValid ? ByteUtils.bytes2Float(bytes, 23) : 0;
        var longitude = latlngValid ? ByteUtils.bytes2Float(bytes,27) : 0;
        var latitude = latlngValid ? ByteUtils.bytes2Float(bytes,31) : 0;
        var speedf = 0.0;
        if (latlngValid) {
            var bytesSpeed = ByteUtils.arrayOfRange(bytes, 35, 37);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.toLowerCase() !== "ffff"){
                speedf = parseFloat(strSp.substring(0, 3) + "." +  strSp.substring(3, strSp.length));
            }
        }
        var azimuth = latlngValid ? ByteUtils.byteToShort(bytes, 37) : 0;
        var satelliteCount = latlngValid ? bytes[39] : 0;
        var hdop = latlngValid ? ByteUtils.byteToShort(bytes, 40) : 0;
        var is_4g_lbs = false;
        var mcc_4g = null;
        var mnc_4g = null;
        var ci_4g = null;
        var tac = null;
        var pcid_4g_1 = null;
        var pcid_4g_2 = null;
        var pcid_4g_3 = null;
        var is_2g_lbs = false;
        var mcc_2g = null;
        var mnc_2g = null;
        var lac_2g_1 = null;
        var ci_2g_1 = null;
        var lac_2g_2 = null;
        var ci_2g_2 = null;
        var lac_2g_3 = null;
        var ci_2g_3 = null;
        if (!latlngValid){
            var lbsByte = bytes[23];
            if ((lbsByte & 0x80) == 0x80){
                is_4g_lbs = true;
            }else{
                is_2g_lbs = true;
            }
        }
        if (is_2g_lbs){
            mcc_2g = ByteUtils.byteToShort(bytes,23);
            mnc_2g = ByteUtils.byteToShort(bytes,25);
            lac_2g_1 = ByteUtils.byteToShort(bytes,27);
            ci_2g_1 = ByteUtils.byteToShort(bytes,29);
            lac_2g_2 = ByteUtils.byteToShort(bytes,31);
            ci_2g_2 = ByteUtils.byteToShort(bytes,33);
            lac_2g_3 = ByteUtils.byteToShort(bytes,35);
            ci_2g_3 = ByteUtils.byteToShort(bytes,37);
        }
        if (is_4g_lbs){
            mcc_4g = ByteUtils.byteToShort(bytes,23) & 0x7FFF;
            mnc_4g = ByteUtils.byteToShort(bytes,25);
            ci_4g = ByteUtils.byteToLong(bytes, 27);
            tac = ByteUtils.byteToShort(bytes, 31);
            pcid_4g_1 = ByteUtils.byteToShort(bytes, 33);
            pcid_4g_2 = ByteUtils.byteToShort(bytes, 35);
            pcid_4g_3 = ByteUtils.byteToShort(bytes,37);
        }

        var axisXDirect = (bytes[50] & 0x80) == 0x80 ? 1 : -1;
        var axisX = ((bytes[50] & 0x7F & 0xff) + (((bytes[51] & 0xf0) >> 4) & 0xff) /10.0) * axisXDirect;

        var axisYDirect = (bytes[51] & 0x08) == 0x08 ? 1 : -1;
        var axisY = (((((bytes[51] & 0x07) << 4) & 0xff) + (((bytes[52] & 0xf0) >> 4) & 0xff)) + (bytes[52] & 0x0F & 0xff)/10.0)* axisYDirect;

        var axisZDirect = (bytes[53] & 0x80) == 0x80 ? 1 : -1;
        var axisZ = (bytes[53] & 0x7F & 0xff) + (((bytes[54] & 0xf0) >> 4) & 0xff) / 10 * axisZDirect

        var batteryPercentBytes = [bytes[55]];
        var batteryPercentStr = ByteUtils.bytes2HexString(batteryPercentBytes, 0);
        var batteryCharge = 100;
        if(batteryPercentStr.toLowerCase() == "ff"){
            batteryCharge = -999;
        }else{
            batteryCharge = parseInt(batteryPercentStr);
            if (0 == batteryCharge) {
                batteryCharge = 100;
            }
        }
        var deviceTemp = -999;
        if ( bytes[56] != 0xff){
            deviceTemp = (bytes[56] & 0x7F) * ((bytes[56] & 0x80) == 0x80 ? -1 : 1);
        }
        var lightSensorBytes = [bytes[57]]
        var lightSensorStr = ByteUtils.bytes2HexString(lightSensorBytes, 0);
        var lightSensor = 0;
        if(lightSensorStr.toLowerCase() =="ff"){
            lightSensor = -999;
        }else{
            lightSensor = parseFloat(lightSensorStr) / 10.0;
        }

        var batteryVoltageBytes = [bytes[58]];
        var batteryVoltageStr = ByteUtils.bytes2HexString(batteryVoltageBytes, 0);
        var batteryVoltage = 0;
        if(batteryVoltageStr.toLowerCase() == "ff"){
            batteryVoltage = -999;
        }else{
            batteryVoltage = parseFloat(batteryVoltageStr) / 10.0;
        }
        var solarVoltageBytes = [bytes[59]]
        var solarVoltageStr = ByteUtils.bytes2HexString(solarVoltageBytes, 0);
        var solarVoltage = 0;
        if(solarVoltageStr.toLowerCase() =="ff"){
            solarVoltage = -999;
        }else{
            solarVoltage = parseFloat(solarVoltageStr) / 10.0
        }

        var mileage = ByteUtils.byteToLong(bytes, 60);
        var status = ByteUtils.byteToShort(bytes, 64);
        var network = (status & 0x7F0) >> 4;
        var accOnInterval = ByteUtils.byteToShort(bytes, 66);
        var accOffInterval = ByteUtils.byteToLong(bytes, 68);
        var angleCompensation = (bytes[72] & 0xff);
        if (angleCompensation < 0){
            angleCompensation += 256;
        }
        var distanceCompensation = ByteUtils.byteToShort(bytes, 73);
        var heartbeatInterval = bytes[75];
        var isUsbCharging = (status & 0x8000) == 0x8000;
        var isSolarCharging = (status & 0x8) == 0x8;
        var iopIgnition = (status & 0x4) == 0x4;
        var alarmByte = bytes[16];
        var originalAlarmCode = alarmByte;
        var status1 = bytes[65];
        var smartPowerOpenStatus = "close";
        if((status1 & 0x01) == 0x01){
            smartPowerOpenStatus = "open";
        }
        var status2 = bytes[77];
        var isLockSim = (status2 & 0x80) == 0x80;
        var isLockDevice = (status2 & 0x40) == 0x40;
        var AGPSEphemerisDataDownloadSettingStatus = (status2 & 0x20) == 0x10;
        var gSensorSettingStatus = (status2 & 0x10) == 0x10;
        var frontSensorSettingStatus = (status2 & 0x08) == 0x08;
        var deviceRemoveAlarmSettingStatus = (status2 & 0x04) == 0x04;
        var openCaseAlarmSettingStatus = (status2 & 0x02) == 0x02;
        var deviceInternalTempReadingANdUploadingSettingStatus = (status2 & 0x01) == 0x01;
        var status3 = bytes[78];
        var smartPowerSettingStatus = "disable";
        if((status3 & 0x80) == 0x80){
            smartPowerSettingStatus = "enable";
        }
        var lockType = null;
        if (bytes.length >= 82){
            lockType = bytes[81];
        }
        if(isWifiMsg){
            var wifiWithDeviceInfoMessage = {
                serialNo:serialNo,
                imei:imei,
                srcBytes:bytes,
                messageType:"wifiWithDeviceInfo",
            }
            wifiWithDeviceInfoMessage.setDate = date
            wifiWithDeviceInfoMessage.selfMac = selfMac.toUpperCase()
            wifiWithDeviceInfoMessage.ap1Mac = ap1Mac.toUpperCase()
            wifiWithDeviceInfoMessage.ap1Rssi = ap1Rssi
            wifiWithDeviceInfoMessage.ap2Mac = ap2Mac.toUpperCase()
            wifiWithDeviceInfoMessage.ap2Rssi = ap2Rssi
            wifiWithDeviceInfoMessage.ap3Mac = ap3Mac.toUpperCase()
            wifiWithDeviceInfoMessage.ap3Rssi = ap3Rssi
            wifiWithDeviceInfoMessage.isHisData = isHisData
            wifiWithDeviceInfoMessage.originalAlarmCode = originalAlarmCode
            wifiWithDeviceInfoMessage.axisX = axisX
            wifiWithDeviceInfoMessage.axisY = axisY
            wifiWithDeviceInfoMessage.axisZ = axisZ
            wifiWithDeviceInfoMessage.mileage = mileage
            wifiWithDeviceInfoMessage.networkSignal = network
            wifiWithDeviceInfoMessage.accOnInterval = accOnInterval
            wifiWithDeviceInfoMessage.accOffInterval = accOffInterval
            wifiWithDeviceInfoMessage.angleCompensation = angleCompensation
            wifiWithDeviceInfoMessage.distanceCompensation = distanceCompensation
            wifiWithDeviceInfoMessage.heartbeatInterval = heartbeatInterval
            wifiWithDeviceInfoMessage.isUsbCharging = isUsbCharging
            wifiWithDeviceInfoMessage.isSolarCharging = isSolarCharging
            wifiWithDeviceInfoMessage.iopIgnition = iopIgnition
            wifiWithDeviceInfoMessage.protocolHeadType = bytes[2]
            wifiWithDeviceInfoMessage.iop = wifiWithDeviceInfoMessage.isIopIgnition ? 0x4000 : 0x0000
            wifiWithDeviceInfoMessage.batteryCharge =batteryCharge
            wifiWithDeviceInfoMessage.isLockSim =isLockSim
            wifiWithDeviceInfoMessage.isLockDevice = isLockDevice
            wifiWithDeviceInfoMessage.AGPSEphemerisDataDownloadSettingStatus =AGPSEphemerisDataDownloadSettingStatus
            wifiWithDeviceInfoMessage.gSensorSettingStatus =gSensorSettingStatus
            wifiWithDeviceInfoMessage.frontSensorSettingStatus =frontSensorSettingStatus
            wifiWithDeviceInfoMessage.deviceRemoveAlarmSettingStatus =deviceRemoveAlarmSettingStatus
            wifiWithDeviceInfoMessage.openCaseAlarmSettingStatus =openCaseAlarmSettingStatus
            wifiWithDeviceInfoMessage.deviceInternalTempReadingANdUploadingSettingStatus =deviceInternalTempReadingANdUploadingSettingStatus
             wifiWithDeviceInfoMessage.deviceTemp =deviceTemp
            wifiWithDeviceInfoMessage.lightSensor =lightSensor
            wifiWithDeviceInfoMessage.batteryVoltage =batteryVoltage
            wifiWithDeviceInfoMessage.solarVoltage =solarVoltage
            wifiWithDeviceInfoMessage.smartPowerSettingStatus =smartPowerSettingStatus
            wifiWithDeviceInfoMessage.smartPowerOpenStatus =smartPowerOpenStatus
            return wifiWithDeviceInfoMessage;
        }else{
            var locationMessage = {
                serialNo:serialNo,
                imei:imei,
                srcBytes:bytes,
                messageType:"location",
            }
            locationMessage.protocolHeadType = bytes[2]
            locationMessage.isAlarmData = originalAlarmCode != 0
            locationMessage.networkSignal = network
            locationMessage.isSolarCharging = isSolarCharging
            locationMessage.isUsbCharging = isUsbCharging
            locationMessage.samplingIntervalAccOn = accOnInterval
            locationMessage.samplingIntervalAccOff = accOffInterval
            locationMessage.angleCompensation =angleCompensation
            locationMessage.distanceCompensation =distanceCompensation
            locationMessage.isGpsWorking =isGpsWorking
            locationMessage.isHistoryData =isHisData
            locationMessage.satelliteCount = satelliteCount
            locationMessage.hdop = hdop
            locationMessage.heartbeatInterval =heartbeatInterval
            locationMessage.originalAlarmCode =originalAlarmCode
            locationMessage.mileage =mileage
            locationMessage.iopIgnition =iopIgnition
            locationMessage.iop = locationMessage.isIopIgnition ? 0x4000 : 0x0000
            locationMessage.batteryCharge =batteryCharge
            locationMessage.date =date
            locationMessage.latlngValid =latlngValid
            locationMessage.altitude =altitude
            locationMessage.latitude =latitude
            locationMessage.longitude =longitude
            locationMessage.isLockSim =isLockSim
            locationMessage.isLockDevice =isLockDevice
            locationMessage.AGPSEphemerisDataDownloadSettingStatus =AGPSEphemerisDataDownloadSettingStatus
            locationMessage.gSensorSettingStatus =gSensorSettingStatus
            locationMessage.frontSensorSettingStatus =frontSensorSettingStatus
            locationMessage.deviceRemoveAlarmSettingStatus =deviceRemoveAlarmSettingStatus
            locationMessage.openCaseAlarmSettingStatus =openCaseAlarmSettingStatus
            locationMessage.deviceInternalTempReadingANdUploadingSettingStatus =deviceInternalTempReadingANdUploadingSettingStatus
            if(locationMessage.latlngValid) {
                locationMessage.speed = speedf
            } else {
                locationMessage.speed = 0
            }
            locationMessage.azimuth =azimuth
            locationMessage.axisX =axisX
            locationMessage.axisY =axisY
            locationMessage.axisZ =axisZ
            locationMessage.deviceTemp =deviceTemp
            locationMessage.lightSensor =lightSensor
            locationMessage.batteryVoltage =batteryVoltage
            locationMessage.solarVoltage =solarVoltage
            locationMessage.smartPowerSettingStatus =smartPowerSettingStatus
            locationMessage.smartPowerOpenStatus =smartPowerOpenStatus
            locationMessage.is_4g_lbs =is_4g_lbs
            locationMessage.is_2g_lbs =is_2g_lbs
            locationMessage.mcc_2g =mcc_2g
            locationMessage.mnc_2g =mnc_2g
            locationMessage.lac_2g_1 =lac_2g_1
            locationMessage.ci_2g_1 =ci_2g_1
            locationMessage.lac_2g_2 =lac_2g_2
            locationMessage.ci_2g_2 =ci_2g_2
            locationMessage.lac_2g_3 =lac_2g_3
            locationMessage.ci_2g_3 =ci_2g_3
            locationMessage.mcc_4g =mcc_4g
            locationMessage.mnc_4g =mnc_4g
            locationMessage.ci_4g =bci_4g
            locationMessage.tac =tac
            locationMessage.pcid_4g_1 =pcid_4g_1
            locationMessage.pcid_4g_2 =pcid_4g_2
            locationMessage.pcid_4g_3 =pcid_4g_3
            locationMessage.lockType =lockType
            return locationMessage;
        }

    },
    parseWifiMessage:function(bytes){
        var serialNo = ByteUtils.byteToShort(bytes,5);
        var imei = ByteUtils.IMEI.decode(bytes,7)
        var wifiMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:bytes,
            messageType:"wifi",
        }
        var date = ByteUtils.getGTM0Date(bytes, 15);
        var selfMac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 21, 27), 0);
        var ap1Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes, 27, 33), 0);
        var ap1Rssi = bytes[33];
        var ap2Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes,34,40),0);
        var ap2Rssi = bytes[40];
        var ap3Mac =  ByteUtils.bytes2HexString(ByteUtils.arrayOfRange(bytes,41,47),0);
        var ap3Rssi = bytes[47];
        wifiMessage.setDate = date
        wifiMessage.selfMac = selfMac.toUpperCase()
        wifiMessage.ap1Mac = ap1Mac.toUpperCase()
        wifiMessage.ap1Rssi = ap1Rssi
        wifiMessage.ap2Mac = ap2Mac.toUpperCase()
        wifiMessage.ap2Rssi = ap2Rssi
        wifiMessage.ap3Mac = ap3Mac.toUpperCase()
        wifiMessage.ap3Rssi = ap3Rssi
        return wifiMessage
    },
    parseDataMessage:function (data){
        var serialNo = ByteUtils.byteToShort(data,5);
        var imei = ByteUtils.IMEI.decode(data,7)
        var locationMessage = {
            serialNo:serialNo,
            imei:imei,
            srcBytes:data,
            messageType:"location",
        }
        var date = ByteUtils.getGTM0Date(data, 17);
        var isGpsWorking = (data[15] & 0x20) == 0x00;
        var isHistoryData = (data[15] & 0x80) != 0x00;
        var latlngValid = (data[15] & 0x40) == 0x40;
        var satelliteCount = data[15] & 0x1F;
        var altitude = latlngValid ? ByteUtils.bytes2Float(data, 23) : 0;
        var longitude = latlngValid ? ByteUtils.bytes2Float(data,27) : 0;
        var latitude = latlngValid ? ByteUtils.bytes2Float(data,31) : 0;
        var speedf = 0.0;
        if (latlngValid) {
            var bytesSpeed = ByteUtils.arrayOfRange(data, 35, 37);
            var strSp = ByteUtils.bytes2HexString(bytesSpeed, 0);
            if(strSp.toLowerCase() !== "ffff"){
                speedf = parseFloat(strSp.substring(0, 3) + "." +  strSp.substring(3, strSp.length));
            }
        }
        var azimuth = latlngValid ? ByteUtils.byteToShort(data, 37) : 0;

        var is_4g_lbs = false;
        var mcc_4g = null;
        var mnc_4g = null;
        var eci_4g = null;
        var tac = null;
        var pcid_4g_1 = null;
        var pcid_4g_2 = null;
        var pcid_4g_3 = null;
        var is_2g_lbs = false;
        var mcc_2g = null;
        var mnc_2g = null;
        var lac_2g_1 = null;
        var ci_2g_1 = null;
        var lac_2g_2 = null;
        var ci_2g_2 = null;
        var lac_2g_3 = null;
        var ci_2g_3 = null;
        if (!latlngValid){
            var lbsByte = data[23];
            if ((lbsByte & 0x80) == 0x80){
                is_4g_lbs = true;
            }else{
                is_2g_lbs = true;
            }
        }
        if (is_2g_lbs){
            mcc_2g = ByteUtils.byteToShort(data,23);
            mnc_2g = ByteUtils.byteToShort(data,25);
            lac_2g_1 = ByteUtils.byteToShort(data,27);
            ci_2g_1 = ByteUtils.byteToShort(data,29);
            lac_2g_2 = ByteUtils.byteToShort(data,31);
            ci_2g_2 = ByteUtils.byteToShort(data,33);
            lac_2g_3 = ByteUtils.byteToShort(data,35);
            ci_2g_3 = ByteUtils.byteToShort(data,37);
        }
        if (is_4g_lbs){
            mcc_4g = ByteUtils.byteToShort(data,23) & 0x7FFF;
            mnc_4g = ByteUtils.byteToShort(data,25);
            eci_4g = ByteUtils.byteToLong(data, 27);
            tac = ByteUtils.byteToShort(data, 31);
            pcid_4g_1 = ByteUtils.byteToShort(data, 33);
            pcid_4g_2 = ByteUtils.byteToShort(data, 35);
            pcid_4g_3 = ByteUtils.byteToShort(data,37);
        }

        var axisXDirect = (data[39] & 0x80) == 0x80 ? 1 : -1;
        var axisX = ((data[39] & 0x7F & 0xff) + (((data[40] & 0xf0) >> 4) & 0xff) /10.0) * axisXDirect;

        var axisYDirect = (data[40] & 0x08) == 0x08 ? 1 : -1;
        var axisY = (((((data[40] & 0x07) << 4) & 0xff) + (((data[41] & 0xf0) >> 4) & 0xff)) + (data[41] & 0x0F & 0xff)/10.0)* axisYDirect;

        var axisZDirect = (data[42] & 0x80) == 0x80 ? 1 : -1;
        var axisZ = (data[42] & 0x7F & 0xff) + (((data[43] & 0xf0) >> 4) & 0xff) / 10 * axisZDirect

        var batteryPercentBytes = [data[44]];
        var batteryPercentStr = ByteUtils.bytes2HexString(batteryPercentBytes, 0);
        var batteryCharge = 100;
        if(batteryPercentStr.toLowerCase() == "ff"){
            batteryCharge = -999;
        }else{
            batteryCharge = parseInt(batteryPercentStr);
            if (0 == batteryCharge) {
                batteryCharge = 100;
            }
        }
        var deviceTemp = -999;
        if ( data[45] != 0xff){
            deviceTemp = (data[45] & 0x7F) * ((data[45] & 0x80) == 0x80 ? -1 : 1);
        }
        var lightSensorBytes = [data[46]]
        var lightSensorStr = ByteUtils.bytes2HexString(lightSensorBytes, 0);
        var lightSensor = 0;
        if(lightSensorStr.toLowerCase() =="ff"){
            lightSensor = -999;
        }else{
            lightSensor = parseFloat(lightSensorStr) / 10.0;
        }

        var batteryVoltageBytes = [data[47]];
        var batteryVoltageStr = ByteUtils.bytes2HexString(batteryVoltageBytes, 0);
        var batteryVoltage = 0;
        if(batteryVoltageStr.toLowerCase() == "ff"){
            batteryVoltage = -999;
        }else{
            batteryVoltage = parseFloat(batteryVoltageStr) / 10.0;
        }
        var solarVoltageBytes = [data[48]]
        var solarVoltageStr = ByteUtils.bytes2HexString(solarVoltageBytes, 0);
        var solarVoltage = 0;
        if(solarVoltageStr.toLowerCase() =="ff"){
            solarVoltage = -999;
        }else{
            solarVoltage = parseFloat(solarVoltageStr) / 10.0
        }

        var mileage = ByteUtils.byteToLong(data, 49);
        var status = ByteUtils.byteToShort(data, 53);
        var network = (status & 0x7F0) >> 4;
        var accOnInterval = ByteUtils.byteToShort(data, 55);
        var accOffInterval = ByteUtils.byteToLong(data, 57);
        var angleCompensation = (data[61] & 0xff);
        if (angleCompensation < 0){
            angleCompensation += 256;
        }
        var distanceCompensation = ByteUtils.byteToShort(data, 62);
        var heartbeatInterval = data[64];
        var isUsbCharging = (status & 0x8000) == 0x8000;
        var isSolarCharging = (status & 0x8) == 0x8;
        var iopIgnition = (status & 0x4) == 0x4;
        var alarmByte = data[16];
        var originalAlarmCode = alarmByte;
        var isAlarmData = data[2] == 0x04;
        var status1 = data[54];
        var smartPowerOpenStatus = "close";
        if((status1 & 0x01) == 0x01){
            smartPowerOpenStatus = "open";
        }
        var status2 = data[66];
        var isLockSim = (status2 & 0x80) == 0x80;
        var isLockDevice = (status2 & 0x40) == 0x40;
        var AGPSEphemerisDataDownloadSettingStatus = (status2 & 0x20) == 0x10;
        var gSensorSettingStatus = (status2 & 0x10) == 0x10;
        var frontSensorSettingStatus = (status2 & 0x08) == 0x08;
        var deviceRemoveAlarmSettingStatus = (status2 & 0x04) == 0x04;
        var openCaseAlarmSettingStatus = (status2 & 0x02) == 0x02;
        var deviceInternalTempReadingANdUploadingSettingStatus = (status2 & 0x01) == 0x01;
        var status3 = data[67];
        var smartPowerSettingStatus = "disable";
        if((status3 & 0x80) == 0x80){
            smartPowerSettingStatus = "enable";
        }
        var lockType = null;
        if (data.length >= 71){
            lockType = data[70];
        }

        locationMessage.protocolHeadType = data[2]
        locationMessage.isAlarmData = isAlarmData
        locationMessage.networkSignal = network
        locationMessage.isSolarCharging = isSolarCharging
        locationMessage.isUsbCharging = isUsbCharging
        locationMessage.samplingIntervalAccOn = accOnInterval
        locationMessage.samplingIntervalAccOff = accOffInterval
        locationMessage.angleCompensation =angleCompensation
        locationMessage.distanceCompensation =distanceCompensation
        locationMessage.isGpsWorking =isGpsWorking
        locationMessage.isHistoryData =isHistoryData
        locationMessage.satelliteCount =satelliteCount
        locationMessage.heartbeatInterval =heartbeatInterval
        locationMessage.originalAlarmCode =originalAlarmCode
        locationMessage.mileage =mileage
        locationMessage.iopIgnition =iopIgnition
        locationMessage.iop = locationMessage.isIopIgnition ? 0x4000 : 0x0000
        locationMessage.batteryCharge =batteryCharge
        locationMessage.date =date
        locationMessage.latlngValid =latlngValid
        locationMessage.altitude =altitude
        locationMessage.latitude =latitude
        locationMessage.longitude =longitude
        locationMessage.isLockSim =isLockSim
        locationMessage.isLockDevice =isLockDevice
        locationMessage.AGPSEphemerisDataDownloadSettingStatus =AGPSEphemerisDataDownloadSettingStatus
        locationMessage.gSensorSettingStatus =gSensorSettingStatus
        locationMessage.frontSensorSettingStatus =frontSensorSettingStatus
        locationMessage.deviceRemoveAlarmSettingStatus =deviceRemoveAlarmSettingStatus
        locationMessage.openCaseAlarmSettingStatus =openCaseAlarmSettingStatus
        locationMessage.deviceInternalTempReadingANdUploadingSettingStatus =deviceInternalTempReadingANdUploadingSettingStatus
        if(locationMessage.latlngValid) {
            locationMessage.speed = speedf
        } else {
            locationMessage.speed = 0
        }
        locationMessage.azimuth =azimuth
        locationMessage.axisX =axisX
        locationMessage.axisY =axisY
        locationMessage.axisZ =axisZ
        locationMessage.deviceTemp =deviceTemp
        locationMessage.lightSensor =lightSensor
        locationMessage.batteryVoltage =batteryVoltage
        locationMessage.solarVoltage =solarVoltage
        locationMessage.smartPowerSettingStatus =smartPowerSettingStatus
        locationMessage.smartPowerOpenStatus =smartPowerOpenStatus
        locationMessage.is_4g_lbs =is_4g_lbs
        locationMessage.is_2g_lbs =is_2g_lbs
        locationMessage.mcc_2g =mcc_2g
        locationMessage.mnc_2g =mnc_2g
        locationMessage.lac_2g_1 =lac_2g_1
        locationMessage.ci_2g_1 =ci_2g_1
        locationMessage.lac_2g_2 =lac_2g_2
        locationMessage.ci_2g_2 =ci_2g_2
        locationMessage.lac_2g_3 =lac_2g_3
        locationMessage.ci_2g_3 =ci_2g_3
        locationMessage.mcc_4g =mcc_4g
        locationMessage.mnc_4g =mnc_4g
        locationMessage.eci_4g =eci_4g
        locationMessage.tac =tac
        locationMessage.pcid_4g_1 =pcid_4g_1
        locationMessage.pcid_4g_2 =pcid_4g_2
        locationMessage.pcid_4g_3 =pcid_4g_3
        locationMessage.lockType =lockType
        return locationMessage;
    }
}

var TopflytechByteBuf = {
    selfBuf:[4096],
    readIndex:0,
    writeIndex:0,
    capacity:4096,
    markerReadIndex:0,
    putBuf:function (inBuf){
        if (this.capacity - this.writeIndex >= inBuf.length){
            for (var i = 0;i < inBuf.length;i++,this.writeIndex++){
                this.selfBuf[this.writeIndex] = inBuf[i];
            }
        }else{
            if (this.capacity - this.writeIndex + this.readIndex >= inBuf.length){
                var currentDataLength = this.writeIndex - this.readIndex;
                for (var i = 0;i < currentDataLength;i++){
                    this.selfBuf[i] = this.selfBuf[this.readIndex + i];
                }
                this.writeIndex = currentDataLength;
                this.readIndex = 0;
                this.markerReadIndex = 0;
                for (var i = 0;i < inBuf.length;i++,this.writeIndex++){
                    this.selfBuf[this.writeIndex] = inBuf[i];
                }
            }else{
                var needLength = ((this.writeIndex - this.readIndex + inBuf.length) / 4096 + 1) * 4096;
                var tmp = [needLength];
                for (var i = 0 ;i < this.writeIndex - this.readIndex;i++){
                    tmp[i] = this.selfBuf[this.readIndex + i];
                }
                this.selfBuf = tmp;
                this.capacity = needLength;
                this.writeIndex = this.writeIndex - this.readIndex;
                this.readIndex = 0;
                this.markerReadIndex = 0;
                for (var i = 0;i < inBuf.length;i++,this.writeIndex++){
                    this.selfBuf[this.writeIndex] = inBuf[i];
                }
            }
        }
    },
    getReadableBytes:function (){
        return this.writeIndex - this.readIndex;
    },
    getReadIndex:function (){
        return this.readIndex
    },
    getByte:function (index){
        if (index >= this.writeIndex - this.readIndex){
            return '0';
        }
        return this.selfBuf[this.readIndex + index];
    },
    markReaderIndex:function (){
        this.markerReadIndex = this.readIndex;
    },
    resetReaderIndex:function (){
        this.readIndex = this.markerReadIndex;
    },
    skipBytes:function (length){
        this.readIndex += length;
    },
    readBytes:function (length){
        if (length > this.getReadableBytes()){
            return null;
        }
        var result = ByteUtils.arrayOfRange(this.selfBuf, this.readIndex, this.readIndex + length);
        this.readIndex += length;
        return result;
    }
}

var CryptoTool = {
    MessageEncryptType:{
        NONE:0,
        MD5:1,
        AES:2,
    },
    AES : {
        getAesLength:function (packageLength){
            if (packageLength <= 15){
                return packageLength;
            }
            return ((packageLength - 15) / 16 + 1) * 16 + 15;
        },
        //加密公共密钥 32位
        keys : 'topflytechAES',
            clearEncoding : 'binary',
            algorithm : 'aes-128-cbc',
            cipherEncoding : 'binary',
            ivParam:"topflytech201205",
            encode : function(data,keys){
            try{
                if(!keys) {
                    keys = this.keys
                }
                var md5Key = cryptoTool.md5(keys)
                var keyBytes = ByteUtils.hexStringToByte(md5Key)
                var secret = new Buffer(keyBytes)
                var cipher = crypto.createCipheriv('aes-128-cbc', secret, this.ivParam);
                var crypted = cipher.update(new Buffer(data), 'binary', 'hex');
                crypted += cipher.final('hex');
                // crypted = new Buffer(crypted, 'binary').toString('base64');
                return ByteUtils.hexStringToByte(crypted);
            }catch(e){
                console.log(e);
                return "";
            }
        },
        decode : function(data,keys){
            try{
                if(!keys) {
                    keys = this.keys
                }
                var md5Key = cryptoTool.md5(keys)
                var keyBytes = ByteUtils.hexStringToByte(md5Key)
                var secret = new Buffer(keyBytes)
                var decipher = crypto.createDecipheriv('aes-128-cbc', secret, this.ivParam);
                var decoded = decipher.update(new Buffer(data), 'hex', 'hex');
                decoded += decipher.final('hex');
                return ByteUtils.hexStringToByte(decoded);
            }catch(e){
                //console.log(e)
                return "";
            }
        }
    },
    md5: function(content) {
        var md5 = crypto.createHash('md5');
        md5.update(content);
        return md5.digest('hex');
    },
    decryptData:function (data,encryptType,aesKey){
        if (encryptType == this.MessageEncryptType.MD5){
            var realData = ByteUtils.arrayOfRange(data, 0, data.length - 8)
            var md5Data = ByteUtils.arrayOfRange(data, data.length - 8, data.length)
            var pathMd5 = this.md5(new Buffer(realData));
            if (pathMd5 == null){
                return null;
            }
            var pathMd5Byte = ByteUtils.hexStringToByte(pathMd5)
            pathMd5 = ByteUtils.arrayOfRange(pathMd5Byte, 4, 12);
            if (!ByteUtils.arrayEquals(pathMd5,md5Data)){
                return null;
            }
            return realData;
        }else if(encryptType == this.MessageEncryptType.AES){
            var head = ByteUtils.arrayOfRange(data,0,15)
            var aesData = ByteUtils.arrayOfRange(data,15,data.length)
            if (aesData == null || aesData.length == 0){
                return data;
            }
            var realData = null;
            try {
                realData = this.AES.decode(aesData, aesKey);
            } catch (e) {
                console.log(e)
            }
            if (realData == null){
                return null;
            }
            var result = []
            for(var i = 0;i < head.length;i++){
                result.push(head[i])
            }
            for(var i = 0;i < realData.length;i++){
                result.push(realData[i])
            }
            return result;
        }else {
            return data;
        }
    },
    encrypt:function (data,encryptType,aesKey){
        if (encryptType == this.MessageEncryptType.MD5){
            var pathMd5 = this.md5(new Buffer(data));
            if (pathMd5 == null){
                return null;
            }
            var pathMd5Byte = ByteUtils.hexStringToByte(pathMd5)
            var result = []
            for(var i = 0;i < data.length;i++){
                result.push(data[i])
            }
            for(var i = 0;i < pathMd5Byte.length;i++){
                result.push(pathMd5Byte[i])
            }
            return result
        }else if (encryptType == this.MessageEncryptType.AES){
            if(!aesKey){
                return null;
            }
            var head = ByteUtils.arrayOfRange(data,0,15);
            var realData = ByteUtils.arrayOfRange(data,15,data.length);
            if (realData == null || realData.length == 0) {
                return data;
            }
            var aesData = null;
            try{
                aesData = this.AES.decode(realData,aesKey)
            }catch (e){
                console.log(e)
            }
            if (aesData == null){
                return null;
            }
            var result = []
            for(var i = 0;i < head.length;i++){
                result.push(head[i])
            }
            for(var i = 0;i < aesData.length;i++){
                result.push(aesData[i])
            }
            return result
        }else{
            return data;
        }
    }
}
