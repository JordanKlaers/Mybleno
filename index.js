var bleno = require('bleno');
var util = require('util');
var BlenoCharacteristic = bleno.Characteristic;
var BlenoPrimaryService = bleno.PrimaryService;
var recieveData = require("./recieveData.js");
var pixel = require("node-pixel");
var five = require("johnny-five");
var Raspi = require("raspi-io");

var LEDObject = {
	connected: false,
	strip: null
};


var board = new five.Board({
  io: new Raspi()
});

board.on("ready", function() {
    var strip = new pixel.Strip({
        board: this,
        controller: "I2CBACKPACK",
        strips: [144] // 3 physical strips on pins 0, 1 & 2 with lengths 4, 6 & 8.
    });
    strip.on("ready", function() {
		LEDObject.connected = true;
		LEDObject.strip = strip;
		strip.off();
		console.log('strip is on');
    });
});

board.on("error", function(err) {
	console.log('board error: POOP');
})

var WriteOnlyCharacteristic = function() {
  	WriteOnlyCharacteristic.super_.call(this, {
    	uuid: 'fffffffffffffffffffffffffffffff5',
    	properties: ['write', 'writeWithoutResponse']
  	});
};


util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);
var busy = false;
var callIndex = 0;
WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
	callIndex ++;
	// if (!busy) {
		// busy = true;
		var converted = data.toString('base64');
		var b = new Buffer(converted, 'base64');
		var result = b.toString();
		var expectation = digitalLedFunction(result, LEDObject, callIndex);
		Promise.resolve(expectation).then(()=> {
			busy = false;
			callback(this.RESULT_SUCCESS);
		})	
	 
};

var busy = false;
var digitalLedFunction = (data, LEDObject, passedCallIndex) => {
	if (data.indexOf('led:') > -1 && LEDObject.connected) {
		if (!busy) {
			busy = true;
			var expectation = digitalLED(data, LEDObject, passedCallIndex);
			Promise.resolve(expectation).then(()=> {
				busy = false;
			})
		}
	}
}

var lastLED;
var digitalLED = (data, LEDObject, passedCallIndex) => {
	if (passedCallIndex != callIndex) {
		console.log('dodged a failure');
		return;
	}
	var index = parseInt(data.split(":")[1])
	if (!lastLED) {
		try {
			lastLED = index;
			LEDObject.strip.pixel(index).color("rgb(0,50,0)");
			LEDObject.strip.show();	
		}
		catch(error) {
			console.log("my error: ", error);
		}
	}
	else {
		try {
			LEDObject.strip.pixel(lastLED).off()
			LEDObject.strip.pixel(index).color("rgb(0,50,0)");
			LEDObject.strip.show();	
			lastLED = index;
		}
		catch(error) {
			console.log("my error: ", error);
		}
	}
	return "done";
}






function SampleService() {
  	SampleService.super_.call(this, {
	    uuid: '00112233-4455-6677-8899-aabbccddeeff',
	    characteristics: [
      	new WriteOnlyCharacteristic(),
    	]
  	});
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.on('stateChange', function(state) {
  console.log('_My bleno_: on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('raspberrypi', ['fffffffffffffffffffffffffffffff0']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('_My bleno_: on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  	console.log('_My bleno_: on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  	console.log('_My bleno_: on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  	console.log('_My bleno_: on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  	console.log('_My bleno_: on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  	if (!error) {
    	bleno.setServices([
      		new SampleService()
    	]);
  	}
});

bleno.on('advertisingStop', function() {
	bleno.startAdvertising('raspberrypi', ['fffffffffffffffffffffffffffffff0']);
  	console.log('_My bleno_: on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {

  console.log('_My bleno_: on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});
