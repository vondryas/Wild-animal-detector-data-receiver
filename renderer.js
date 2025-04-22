let config = {
    broker: "",
    username: "",
    password: "",
}

window.onload = async () => {

    // Add placeholder row to table if it is empty
    const table = document.getElementById('data-body');
    if (table.children.length === 0) {
        const row = document.createElement('tr');
        row.id = "placeholder-row";
        row.innerHTML = `<td colspan="2" style="text-align:center; font-style:italic;">No data yet</td>`;
        table.appendChild(row);
    }

    const broker = localStorage.getItem("broker") || "";
    const username = localStorage.getItem("username") || "";
    
    // Try to load last used broker and username from localStorage to input fields
    document.getElementById("broker").value = broker;
    document.getElementById("username").value = username;

    // Try to load password from keytar
    const password = await window.passwordStore.load();

    document.getElementById("password").value = password || "";
    // If password, broker and username is not empty, set it to the password input field
    // and automatically connect to MQTT broker
    if (password && broker && username) {
        config = {
            broker: document.getElementById("broker").value.trim(),
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value.trim(),
        };
        disableConnectButton();
        window.mqttBridge.connect(config);
    }

    // Add event listener to the form
    document.getElementById("mqtt-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        // this will add mqtt:// or ws:// or wss:// to the broker url if not present
        let broker = document.getElementById("broker").value.trim();
        if (!broker.startsWith("mqtt://") && 
        !broker.startsWith("ws://") && 
        !broker.startsWith("wss://")) {
            broker = "mqtt://" + broker;
            document.getElementById("broker").value = broker;
        }

        config = {
            broker: broker,
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value.trim(),
        };
        // Store new config to localStorage
        localStorage.setItem("broker", config.broker);
        localStorage.setItem("username", config.username);
        window.passwordStore.save(config.password);
        // Connecting to MQTT
        disableConnectButton();
        document.getElementById("status").textContent = "🔄 Connecting...";
        window.mqttBridge.connect(config);
    });
};

// Add event listeners to mqtt connection so i can update status
window.addEventListener('mqtt-connected', () => {
    document.getElementById("status").textContent = "✅ Connected";
    enableConnectButton();
});

window.addEventListener('mqtt-close', () => {
    document.getElementById("status").textContent = "🔌 Disconnected";
    enableConnectButton();
});

window.addEventListener('mqtt-error', (e) => {
    document.getElementById("status").textContent = "❌ MQTT Error";
    enableConnectButton();
});

// Add event listener to mqtt message and add data to table
window.addEventListener('mqtt-message', (e) => {
    const payload = decodePayload(e.detail.payload);
    const time = formatCzechTime(e.detail.receivedAt);
    appendRow(time, payload);
});

// Disble connect button when connecting
function disableConnectButton() {
    const btn = document.querySelector('#mqtt-form button');
    btn.disabled = true;
    btn.classList.add('disabled');
}

// Enable connect button when status changes
function enableConnectButton() {
    const btn = document.querySelector('#mqtt-form button');
    btn.disabled = false;
    btn.classList.remove('disabled');
}

// Format time to czech format
function formatCzechTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('cs-CZ', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Will decode payload from base64 to string
// It automatically decodes from format of wild animal detection <type><count>
// this two tokens can repeat depends on detection of animals by the device
// both <type> and <count> are 1 byte long
// 0x00 - Doe
// 0x01 - Wild Boar
// else - Undefined
// example: 0x00 0x02 0x01 0x03 -> 2× Doe, 3× Wild Boar
function decodePayload(payloadBase64) {
    try {
        console.log("Decoding payload:", payloadBase64);
        console.log("Base64 decoded:", atob(payloadBase64));
        const bytes = Uint8Array.from(atob(payloadBase64), c => c.charCodeAt(0));
        let output = [];

        for (let i = 0; i < bytes.length; i += 2) {
            const type = bytes[i];
            const count = bytes[i + 1];
            const label = type === 0 ? "Doe" : type === 1 ? "Wild Boar" : "Undefined";
            output.push(`${count}× ${label}`);
        }

        return output.join(', ');
    } catch (e) {
        console.error("Error decoding payload:", e);
        return "Invalid payload";
    }
}

// Add row to table with new data
function appendRow(time, payload) {
    const table = document.getElementById('data-body');

    // Remove placeholder row if it exists
    const placeholderRow = document.getElementById('placeholder-row');
    if (placeholderRow) {
        placeholderRow.remove();
    }

    const row = document.createElement('tr');
    const decoded = payload;
    row.innerHTML = `<td>${time}</td><td>${decoded}</td>`;
    table.prepend(row);
}
