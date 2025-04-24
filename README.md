# Wild Animal Detection TTN Data Receiver

A desktop application built with Electron to receive and display data from a photo trap connected via [The Things Network (TTN)](https://www.thethingsnetwork.org/), using MQTT. It is used to monitor wildlife detection events (e.g., does and wild boars) sent by the device. Device code is available in [ESP32-wild-animal-detector](https://github.com/vondryas/ESP32-wild-animal-detector) repository.

---

## Requirements

- [Node.js](https://nodejs.org/) (recommended version: 20+) with npm
- [Git](https://git-scm.com/)
- [The Things Stack account](https://console.thethingsnetwork.org/) and have created application
- MQTT access from TTN (see below)


---

## Installation and Running

Tested on Windows 11 on other systems see electron documentation.

Clone the repository:

```bash
git clone https://github.com/vondryas/Wild-animal-detector-data-receiver.git
```

Inside root folder of the project:

```bash
## will install all dependencies
npm install
## will start the app
npm start
```

### Build .exe (installer + portable)

```bash
npm run dist
```

This will generate .exe files with installer and portable .exe application.

Outputs are in the `dist/` folder.

Should generate application for linux and macOS as well, but it is not tested.

---

## 📡 What the app does

- Connects to TTN MQTT broker and listens for uplink messages
- Parses animal detection data (`1x Doe, 2x Wild Boar`)
- Displays live updates in a clean table UI
- Remebers the last used MQTT credentials and automatically fills them and connects to the broker

Show only data that are received after the app is started. The app does not store any data except credentials.

---

## How to log in to MQTT

1. Open the app
2. Enter:
   - **MQTT Broker**: e.g., `mqtts://eu1.cloud.thethings.network`
   - **Username**: `application-id@tenant-id` (e.g., `photo-trap@ttn`)
   - **Password**: Your TTN **API Key** with permission `Read application traffic`
3. Click **Connect**

> The password is stored securely using your operating system's credential store via `keytar`.

Credentials of your application are in TTN console under **Other integrations** → **MQTT**. You can generate a new API key with the required permissions and copy it to the clipboard.


If successful, the app will display connected status and start receiving data.

---

## Creating a TTN Application

1. Sign in at [TTN Console](https://console.thethingsnetwork.org/)
2. Click **Create application**
   - Fill in `Application ID`, `Name`, `Region`
3. Add a device (e.g., `esp32-s3-eye-photo-trap`) that sends uplink messages
   - Fill in EUI, Join EUI, etc.
   - This part is covered in the device code repository [ESP32-wild-animal-detector](https://github.com/vondryas/ESP32-wild-animal-detector)


---

## Payload Format

The device sends data in this format:

```
<type><count> <type><count> ...
```

each token is 1 byte long. The first byte is the type of animal, the second byte is the count of sightings. The data is sent as a string of bytes and from TTN are received in Base64 encoding.

Where:
- `type` = `0x00` (Doe), `0x01` (Wild Boar)
- `count` = number of sightings

Example: `00 02 01 03` → 2× Doe, 3× Wild Boar

---

## Used Technologies

- Electron
- MQTT.js
- keytar (secure password storage)
- HTML + CSS + JS
- The Things Stack MQTT

---

## Author

**Štěpán Vondráček**  
GitHub: [@xvondr27](https://github.com/vondryas)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

