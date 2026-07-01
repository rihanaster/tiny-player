let db;
let items = [];
let current = 0;

const fileInput = document.getElementById("files");
const urlInput = document.getElementById("url");
const addUrlBtn = document.getElementById("addUrl");
const playlist = document.getElementById("playlist");
const audio = document.getElementById("audio");

window.onerror = function(message, source, lineno) {
    alert("JS Error: " + message + " (line " + lineno + ")");
};

const request = indexedDB.open("hybrid-player", 1);

request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore("items", {
        keyPath: "id",
        autoIncrement: true
    });
};

request.onsuccess = (e) => {
    db = e.target.result;
    load();
};

fileInput.addEventListener("change", (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) {
        alert("No files selected");
        return;
    }

    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");

    selectedFiles.forEach((file) => {
        store.add({
            type: "local",
            name: file.name,
            blob: file
        });
    });

    tx.oncomplete = () => {
        alert(selectedFiles.length + " file(s) imported");
        load();
    };

    tx.onerror = (e) => {
        alert("Import failed");
        console.error(e);
    };
});

addUrlBtn.addEventListener("click", () => {
    const value = urlInput.value.trim();

    if (!value) {
        return;
    }

    const tx = db.transaction("items", "readwrite");

    tx.objectStore("items").add({
        type: "stream",
        name: value.split("/").pop(),
        url: value
    });

    tx.oncomplete = () => {
        urlInput.value = "";
        load();
    };
});

function load() {
    const req = db.transaction("items")
        .objectStore("items")
        .getAll();

    req.onsuccess = () => {
        items = req.result;

        playlist.innerHTML = "";

        items.forEach((item, index) => {
            const div = document.createElement("div");

            div.textContent =
                item.name +
                (item.type === "local" ? " 📱" : " 🌐");

            div.style.cursor = "pointer";
            div.style.padding = "8px";

            div.onclick = () => play(index);

            playlist.appendChild(div);
        });
    };
}

function play(index) {
    current = index;

    const item = items[index];

    try {
        if (item.type === "local") {
            const objectUrl = URL.createObjectURL(item.blob);

            audio.src = objectUrl;
            audio.load();

            audio.play().catch((err) => {
                alert("Play failed: " + err.message);
            });
        } else {
            audio.src = item.url;

            audio.play().catch((err) => {
                alert("Play failed: " + err.message);
            });
        }
    } catch (err) {
        alert("Playback error: " + err.message);
    }
}