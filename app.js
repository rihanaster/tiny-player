let db;
let items = [];
let current = 0;

const fileInput = document.getElementById("files");
const urlInput = document.getElementById("url");
const addUrlBtn = document.getElementById("addUrl");
const playlist = document.getElementById("playlist");
const audio = document.getElementById("audio");

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

fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
        alert("No files selected");
        return;
    }

    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");

    for (const file of files) {
        const buffer = await file.arrayBuffer();

        store.add({
            type: "local",
            name: file.name,
            blob: new Blob([buffer], {
                type: file.type || "audio/mpeg"
            })
        });
    }

    tx.oncomplete = () => {
        alert(files.length + " file(s) imported");
        load();
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

            div.onclick = () => play(index);

            playlist.appendChild(div);
        });
    };
}

function play(index) {
    current = index;

    const item = items[index];

    if (item.type === "local") {
        audio.src = URL.createObjectURL(item.blob);
    } else {
        audio.src = item.url;
    }

    audio.play();
}