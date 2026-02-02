"use strict";

/* ===============================
   DOM references
=============================== */

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");

/* ===============================
   Autofocus
=============================== */

function applyAutofocus() {
    if (!address) return;
    try {
        address.focus({ preventScroll: true });
    } catch {
        address.focus();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAutofocus);
} else {
    applyAutofocus();
}

/* ===============================
   URL / Search resolver
=============================== */

function resolveInput(value) {
    const input = value.trim();
    const searchTemplate = "http://duckduckgo.com/?q=%s";

    if (!input) return "";

    try {
        return new URL(input).toString();
    } catch {}

    try {
        const url = new URL("http://" + input);
        if (url.hostname.includes(".")) {
            return url.toString();
        }
    } catch {}

    return searchTemplate.replace("%s", encodeURIComponent(input));
}

/* ===============================
   Service Worker
=============================== */

if ("serviceWorker" in navigator && form && address) {
    const proxySetting = "uv";

    const swMap = {
        uv: {
            file: "/uv/sw.js",
            config: self.__uv$config
        }
    };

    const sw = swMap[proxySetting];
    if (!sw || !sw.config) {
        console.error("[Yoroxy] UV config not found");
    } else {
        navigator.serviceWorker
            .register(sw.file, { scope: sw.config.prefix })
            .then(() => {
                console.log("[Yoroxy] ServiceWorker registered");

                form.addEventListener("submit", (e) => {
                    e.preventDefault();

                    const resolved = resolveInput(address.value);
                    if (!resolved) return;

                    const encoded =
                        sw.config.prefix + encodeURIComponent(resolved);

                    window.location.href = encoded;
                });
            })
            .catch((err) => {
                console.error("[Yoroxy] ServiceWorker failed:", err);
            });
    }
}
