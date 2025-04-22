const { contextBridge } = require('electron');
const keytar = require('keytar');
const mqtt = require('mqtt');

const SERVICE = "wild-animal-mqtt";
const ACCOUNT = "mqtt-password";


// Secure password storage using keytar
contextBridge.exposeInMainWorld('passwordStore', {
    // Save password to keytar
    save: async (password) => {
        // If password is empty, delete the password from keytar
        if (!password || password.trim() === "") {
            await keytar.deletePassword(SERVICE, ACCOUNT);
        }
        else {
            await keytar.setPassword(SERVICE, ACCOUNT, password);
        }
    },
    // Load password from keytar
    load: async () => {
        return await keytar.getPassword(SERVICE, ACCOUNT);
    },
    // Clear password from keytar
    clear: async () => {
        await keytar.deletePassword(SERVICE, ACCOUNT);
    }
});

// MQTT connection using mqtt.js
// callback function send event to renderer process
contextBridge.exposeInMainWorld('mqttBridge', {
    connect: (config) => {
        // connecting timeout is 10 seconds
        const client = mqtt.connect(config.broker, {
            username: config.username,
            password: config.password,
            clientId: 'electron-client-' + Math.random().toString(16).slice(2),
            reconnectPeriod: 0,
            connectTimeout: 10000 
        });

        window.mqttClient = client;

        // automatically subscribe to uplink messages to receive data from all devices in the application
        client.on('connect', () => {
            // Subscribe to data in uplink messages depending on the username
            client.subscribe("v3/" + config.username + "/devices/+/up");
            window.dispatchEvent(new CustomEvent('mqtt-connected'));
        });

        // Will send json parsed data to renderer process
        client.on('message', (topic, message) => {
            const json = JSON.parse(message.toString());
            const receivedAt = json.received_at;
            const payload = json.uplink_message.frm_payload;
            window.dispatchEvent(new CustomEvent('mqtt-message', {
                detail: { receivedAt, payload }
            }));
        });
        
        // send error to renderer process
        client.on('error', (err) => {
            console.error("MQTT error:", err);
            window.dispatchEvent(new CustomEvent('mqtt-error', { detail: err }));
        });

        // send close event to renderer process
        client.on('close', () => {
            window.dispatchEvent(new Event('mqtt-close'));
        });
    }
});
