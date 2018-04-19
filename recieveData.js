'use strict';


var Gpio = require('pigpio').Gpio
var green = new Gpio(17, {mode: Gpio.OUTPUT})
var red = new Gpio(27, {mode: Gpio.OUTPUT})
var blue = new Gpio(22, {mode: Gpio.OUTPUT})

  green.pwmWrite(150);


var handleTheData = (data) =>{
	if (data == 'invert') {
		invert = !invert;
		return;
	}
  var number = Number(data)
  number = Math.floor(number);
  console.log("number coming in: ", number);
  convertValue(number);
}

var invert = false

var convertValue = (value) => {
  console.log("inside covert value: ", value);
  var rgbColor = hslToRgb((value/360), 1, 0.5)
  console.log("should be rgb: ", rgbColor);
  uploadRGBValues(rgbColor)
}

var uploadRGBValues = (RGBValues) => {
  	console.log("RGB: ",RGBValues);
  	if (invert) {
		RGBValues[0] = Math.abs(RGBValues[0] - 255);
		RGBValues[1] = Math.abs(RGBValues[1] - 255);
		RGBValues[2] = Math.abs(RGBValues[2] - 255);
  	}
  	red.pwmWrite(RGBValues[0]);
  	green.pwmWrite(RGBValues[1]);
  	blue.pwmWrite(RGBValues[2]);
}




function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

module.exports.handleTheData = handleTheData;
