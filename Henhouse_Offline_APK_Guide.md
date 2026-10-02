# Henhouse Poultry Hub: offline + APK (for the index (8) build)

All edits below are **already applied** in `Henhouse_index8_OFFLINE_READY.html`. Rename that file to `index.html` before you upload it.
Line numbers refer to `Henhouse_index8_OFFLINE_READY.html`.

## 1. What this build already had

- `<link rel="manifest" href="./manifest.json" />` at line 477 (in the head).
- Service worker registration for `./service-worker.js` near the end of the file.
- An "Offline mode" banner and an Online/Offline label in the header.
- Seller listings and Farm Management records are saved on the phone, so they open offline.

**What was missing:** the `service-worker.js` file itself (so nothing was being saved for offline use), and the rule that
sending needs internet. Those are the two things added.

## 2. Sections to edit

| # | Where | What to do |
|---|-------|------------|
| 1 | New file `service-worker.js` next to `index.html` | Add it (provided). Without it the app will not open offline |
| 2 | `manifest.json` | Replace with the provided one (colours now match this build) |
| 3 | Buyer block (`module-buyer`), function `offer(id)` | Add the offline check (code 3A) |
| 4 | Buyer block, function `send()` | Add the offline check (code 3B) |
| 5 | Buyer block, the "Send message" button | Add `id="sendBtn"` (code 3C) |
| 6 | End of the Buyer block, just before its closing `</script>` | Paste the button-state code (3D) |

## 3. Code

**3A. Top of `function offer(id) {`**

```js
if (!navigator.onLine) {
  notify("You are offline. Connect to the internet to make an offer.");
  return;
}
```

**3B. Top of `function send() {`**

```js
if (!navigator.onLine) {
  notify("You are offline. Connect to the internet to send messages.");
  return;
}
```

**3C. The button**

```html
<button id="sendBtn" onclick="send()">Send message</button>
```

**3D. End of the Buyer block (inside the block, write `<\script>` and `<\/script>` with the backslash, as the other blocks do)**

```html
<script>
  function updateSendState() {
    var b = document.getElementById("sendBtn");
    if (!b) return;
    b.disabled = !navigator.onLine;
    b.textContent = navigator.onLine ? "Send message" : "Offline: connect to send";
  }
  addEventListener("online", updateSendState);
  addEventListener("offline", updateSendState);
  updateSendState();
</script>
```

Result: buyers can browse products, read saved messages and reviews offline. "Send message" is greyed out and offers
show "You are offline" until the connection returns.

## 4. Important: sending is still a demo

In this build, messages and offers are only saved on the phone. The app itself says "Demo message saved locally; not delivered".
So even online, nothing reaches the seller. The offline rule is in place, but real delivery needs a backend, for example a
Supabase table (you already use Supabase in Farm Management). Ask me and I'll write that.

## 5. Put it online, then build the APK

1. In your GitHub repo, upload: `index.html` (renamed), `service-worker.js`, `manifest.json`. Keep `icon-192.png` and `icon-512.png`.
   You can delete the old `sw.js`, it is no longer used.
2. Let Render redeploy.
3. **Test offline first:** on your phone, open `https://henhouse-poultry-hub.onrender.com` in Chrome with internet on, wait about 10 seconds,
   then turn on airplane mode and reload. It should still open.
4. Go to **pwabuilder.com**, paste the Render address, click **Package For Stores**, then **Android**.
   Package ID `com.henhouse.poultryhub`, keep signing key on **New**, click **Generate**.
   (If you already built one, reuse your saved signing key so the new APK can update the old one: choose **Use existing** and upload it.)
5. Unzip, install the APK on the phone. Open it once with internet, then test in airplane mode.
6. To remove the address bar at the top: put the zip's `assetlinks.json` in your repo at `.well-known/assetlinks.json`, redeploy, then reinstall the APK.

## 6. Every time you update the app

In `service-worker.js` change `henhouse-v1` to `henhouse-v2` (then v3, and so on), otherwise phones keep showing the old copy.
The APK itself does not need rebuilding for page changes, because it opens your hosted site.

## 7. What still needs internet

- **Map pictures** (OpenStreetMap and satellite tiles) and **weather**: the map frame opens, but the picture tiles and forecast need a connection.
- **Supabase** (database in Farm Management): needs internet. Records you type while offline are kept on the phone.
- The map and database *libraries* are now saved by the service worker on first load, so these screens open offline.
