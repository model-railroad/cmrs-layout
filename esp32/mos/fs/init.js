load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_arduino_ssd1306.js');

let led = 25; // RM -- Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';

print('LED GPIO:', led, 'button GPIO:', button);

let oled = Adafruit_SSD1306.create_i2c(Cfg.get('app.ssd1306_reset_pin'), Adafruit_SSD1306.RES_128_64);
oled.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3C, true);

function displayString(msg) {
  oled.clearDisplay();
  oled.setTextColor(Adafruit_SSD1306.WHITE);
  // Note: display has one 5x8 font, and text size is a multiplier.
  oled.setTextSize(2);
  oled.setCursor(1, 0);
  oled.write("Title ...");
  // ste cursor x, y
  oled.setCursor(1, 22);
  oled.setTextSize(1);
  oled.write(msg);
  oled.display();
}

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram()
  });
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(5*1000 /* 1 sec */, Timer.REPEAT, function() {
  let value = GPIO.toggle(led);
  print("TEST1", value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
let counter = 1;
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let value = GPIO.toggle(led);
  print("Button0");
  displayString("Button " + JSON.stringify(counter));
  counter = counter + 1;
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

displayString("Started " + "Now");





