let db;
let items = [];
let current = 0;
let lastSavedPosition = 0;

const fileInput = document.getElementById("files");
const urlInput = document.getElementById("url");
const addUrlBtn = document.getElementById("addUrl");
const playlist = document.getElementById("playlist");
const audio = document.getElementById("audio");

window.onerror = function (message, source, lineno) {
    console.error(message, source, lineno);
};

const request = indexedDB.open("hybrid-player", 1);

request.onupgradeneeded = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains("items")) {
        db.createObjectStore("items", {
            keyPath: "id",
            autoIncrement: true
        });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    load();
};

request.onerror = (e) => {
    alert("IndexedDB failed to open");
    console.error(e);
};

/*
 * IMPORT LOCAL FILES
 */
fileInput.addEventListener("change", (e) => {

    const selectedFiles = Array.from(
        e.target.files || []
    );

    if (!selectedFiles.length) {
        return;
    }

    selectedFiles.forEach((file) => {

        const reader = new FileReader();

        reader.onload = () => {

            const tx = db.transaction(
                "items",
                "readwrite"
            );

            const store =
                tx.objectStore("items");

            store.add({
                type: "local",
                name: file.name,
                mimeType:
                    file.type ||
                    "audio/mpeg",
                data: reader.result
            });

            tx.oncomplete = () => {
                load();
            };

            tx.onerror = (e) => {
                console.error(e);
                alert(
                    "Failed importing " +
                    file.name
                );
            };
        };

        reader.onerror = () => {
            alert(
                "Failed reading file: " +
                file.name
            );
        };

        reader.readAsArrayBuffer(file);
    });

    fileInput.value = "";
});

/*
 * ADD STREAM URL
 */
addUrlBtn.addEventListener("click", () => {

    const value =
        urlInput.value.trim();

    if (!value) {
        return;
    }

    const tx = db.transaction(
        "items",
        "readwrite"
    );

    tx.objectStore("items").add({
        type: "stream",
        name:
            value.split("/").pop() ||
            value,
        url: value
    });

    tx.oncomplete = () => {
        urlInput.value = "";
        load();
    };
});

/*
 * LOAD PLAYLIST
 */
function load() {

    const req = db
        .transaction("items")
        .objectStore("items")
        .getAll();

    req.onsuccess = () => {

        items = req.result;

        renderPlaylist();

        const savedTrack =
            parseInt(
                localStorage.getItem(
                    "currentTrack"
                )
            );

        const savedPosition =
            parseFloat(
                localStorage.getItem(
                    "currentPosition"
                )
            ) || 0;

        if (
            !isNaN(savedTrack) &&
            items[savedTrack]
        ) {
            play(
                savedTrack,
                savedPosition,
                false
            );
        }
    };
}

/*
 * RENDER PLAYLIST
 */
function renderPlaylist() {

    playlist.innerHTML = "";

    items.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent =
                item.name +
                (item.type === "local"
                    ? " 📱"
                    : " 🌐");

            div.style.padding =
                "10px";

            div.style.cursor =
                "pointer";

            div.style.borderBottom =
                "1px solid #333";

            div.onclick = () =>
                play(index);

            playlist.appendChild(div);
        }
    );
}

/*
 * PLAY ITEM
 */
function play(
    index,
    startPosition = 0,
    autoplay = true
) {

    current = index;

    localStorage.setItem(
        "currentTrack",
        index
    );

    const item = items[index];

    if (!item) {
        return;
    }

    try {

        if (
            item.type === "local"
        ) {

            const blob =
                new Blob(
                    [item.data],
                    {
                        type:
                            item.mimeType ||
                            "audio/mpeg"
                    }
                );

            audio.src =
                URL.createObjectURL(
                    blob
                );

        } else {

            audio.src =
                item.url;
        }

        audio.onloadedmetadata =
            () => {

                if (
                    startPosition >
                    0
                ) {

                    audio.currentTime =
                        startPosition;
                }

                if (
                    autoplay
                ) {

                    audio.play()
                        .catch(
                            console.error
                        );
                }
            };

    } catch (err) {

        console.error(err);

        alert(
            "Playback failed"
        );
    }
}

/*
 * AUTO SAVE POSITION
 */
audio.addEventListener(
    "timeupdate",
    () => {

        if (
            Math.abs(
                audio.currentTime -
                lastSavedPosition
            ) >= 5
        ) {

            lastSavedPosition =
                audio.currentTime;

            localStorage.setItem(
                "currentPosition",
                audio.currentTime
            );

            localStorage.setItem(
                "currentTrack",
                current
            );
        }
    }
);

/*
 * AUTO NEXT TRACK
 */
audio.addEventListener(
    "ended",
    () => {

        if (
            current <
            items.length - 1
        ) {

            play(
                current + 1
            );
        }
    }
);