# An ESP32 Mongoose OS app to toggle a JMRI Turnout

## Overview

An ESP32 Mongoose OS app to toggle a JMRI Turnout

## How to install this app

- Install and start [mos tool](https://mongoose-os.com/software.html)

Then:
$ mos build
$ mos flash
$ mos wifi   # -- configure WIFI first time as client (aka "STAtion")
$ mos put fs/init.js

- Manually reset ESP32 using reset button.
- Push PRG button to trigger turnout.

Demo parameters:
- JMRI server on 192.168.2.154:12080 (the web port).
- JSON Server must be started on JMRI side.
- Toggles turnout NT311.

These demo parameters can be modified in fs/init.js
