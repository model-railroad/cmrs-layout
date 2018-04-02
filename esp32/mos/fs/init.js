load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_rpc.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_http.js');
load('api_arduino_ssd1306.js');

let led = 25; // RM -- Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';

let jmriHost = "192.168.2.154:12080";

let oled = Adafruit_SSD1306.create_i2c(Cfg.get('app.ssd1306_reset_pin'), Adafruit_SSD1306.RES_128_64);
oled.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3C, true);


print('LED GPIO:', led, 'button GPIO:', button);


let displayCounter = 0;
let displayIP = "";
function updateDisplay() {
  oled.clearDisplay();
  oled.setTextColor(Adafruit_SSD1306.WHITE);
  // Note: display has one 5x8 font, and text size is a multiplier.
  // set cursor x, y
  oled.setTextSize(2);
  oled.setCursor(0, 0);
  oled.write("Turnout");

  oled.setTextSize(1);
  oled.setCursor(0, 16+4);
  oled.write("Button " + JSON.stringify(displayCounter));

  oled.setCursor(0, 16+4+8+4);
  oled.write("IP " + displayIP);

  oled.display();
}

function updateIP() {
    RPC.call(RPC.LOCAL, 'Sys.GetInfo', null, function(resp, ud) {
        print('Sys.GetInfo Response:', JSON.stringify(resp));
        print('MAC address:', resp.mac);
        displayIP = resp.wifi.sta_ip;
        updateDisplay();
        }, null);
}

function getInfo() {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram()
  });
};

// Using jQuery, this works:
// jmriurl="http://localhost:12080/json/turnouts/NT311"
// $.ajax({url: jmriurl, type: "POST", data: JSON.stringify({state: 4}), contentType: "application/json; charset=utf-8"})

let jmriTurnout = "NT311";
let jmriClosed = 2;
let jmriThrown = 4;        
let jmriUrl = "http://" + jmriHost + "/json/turnouts/" + jmriTurnout;
let turnoutState = 0;
function toggleTurnout() {
    let post_data = { state: (turnoutState ? jmriClosed : jmriThrown) };
    print("jmriUrl:", jmriUrl);
    print("post_data:", JSON.stringify(post_data));
    
    HTTP.query({
        url: jmriUrl,
        headers: { "Content-Type" : "application/json; charset=UTF-8" },
        data: JSON.stringify(post_data),
        success: function(body, full_http_msg) { 
            print("JMRI Success:", JSON.stringify(body)); 
        },
        error: function(err) { 
            print("JMRI Error:", JSON.stringify(err)); 
        },
    });
    
    turnoutState = 1 - turnoutState;
}

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
    displayCounter = displayCounter + 1;
    updateDisplay();
    toggleTurnout();
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
    updateIP();
  }
  print('== Net event:', ev, evs);
}, null);

updateDisplay();

