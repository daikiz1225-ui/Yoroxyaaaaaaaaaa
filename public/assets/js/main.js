"use strict";

const SEARCH_TEMPLATE = "https://duckduckgo.com/?q=%s";
const XOR_KEY = 2;

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");

function applyAutofocus() {
    if (!address) return;
    try {
        address.focus({ preventScroll: true });
    } catch {
        try { address.focus(); } catch {}
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAutofocus);
} else {
    applyAutofocus();
}

class Crypt {
    static encode(str) {
        return encodeURIComponent(
            String(str)
                .split("")
                .map((c, i) => (i % 2 ? String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY) : c))
                .join("")
        );
    }

    static decode(str) {
        return decodeURIComponent(
            String(str)
                .split("")
                .map((c, i) => (i % 2 ? String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY) : c))
                .join("")
        );
    }
}

function resolveInput(value) {
    const input = String(value || "").trim();
    if (!input) return "";

    try {
        const url = new URL(input);
        if (url.protocol === "http:" || url.protocol === "https:") {
            return url.toString();
        }
        return "";
    } catch {}

    try {
        const maybeUrl = new URL("http://" + input);
        if (maybeUrl.hostname && (maybeUrl.hostname.includes(".") || maybeUrl.hostname === "localhost")) {
            return maybeUrl.toString();
        }
    } catch {}

    return SEARCH_TEMPLATE.replace("%s", encodeURIComponent(input));
}

if ("serviceWorker" in navigator && form && address) {
    const proxySetting = "uv";

    const swMap = {
        uv: {
            file: "/uv/sw.js",
            config: globalThis.__uv$config
        }
    };

    const sw = swMap[proxySetting];

    if (!sw || !sw.config) {
        console.error("[Yoroxy] UV config not found");
    } else {
        navigator.serviceWorker
            .register(sw.file, { scope: sw.config.prefix })
            .then(() => navigator.serviceWorker.ready)
            .then(() => {
                const prefix = String(sw.config.prefix || "/");
                const safePrefix = prefix.endsWith("/") ? prefix : prefix + "/";

                const onSubmit = (e) => {
                    e.preventDefault();
                    try {
                        const resolved = resolveInput(address.value);
                        if (!resolved) return;
                        const encoded = safePrefix + Crypt.encode(resolved);
                        window.location.assign(encoded);
                    } catch (err) {
                        console.error("[Yoroxy] submit handler error:", err);
                    }
                };

                form.removeEventListener("submit", onSubmit);
                form.addEventListener("submit", onSubmit);
            })
            .catch((err) => {
                console.error("[Yoroxy] ServiceWorker failed:", err);
            });
    }
}
