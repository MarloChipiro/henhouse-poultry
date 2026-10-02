# Henhouse Poultry Hub: edits, offline APK and "Add new item"

Everything below is **already applied** in `index.html`.
This guide shows where each change sits so you can edit or re-apply it yourself. Line numbers are for `index.html`.

## 1. What was wrong with "Sell Products"

The Sell Products page had an add-product form (`#productModal`), but a later patch turned the
"Add a product" button into an "Ask the seller" button. Nothing opened the form any more, and new items were
only kept in memory, so they vanished on reload. The new code adds a real **＋ Add new item** button and
saves items on the phone.

## 2. Sections to edit

| # | Where | Line (approx.) | What to do |
|---|-------|----------------|------------|
| 1 | Main page `<head>` | 8 | Add the manifest and icon links (3A) |
| 2 | Main page script, function `network()` | 5321 | Add one line so the app knows it is offline (3B) |
| 3 | Main page script, just before `network();` | 5330 | Add the service worker registration (3C) |
| 4 | End of `module-seller` block, just before its closing `</script>` | ~4030 | Paste the "Add new item" code (4) |
| 5 | End of `module-buyer` block, just before its closing `</script>` | ~5200 | Paste the "online only" code (5) |
| 6 | New files next to `index.html` | - | `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png` (provided) |

## 3. Offline support (main page)

**3A. In `<head>`, after the `<title>` line:**

```html
<link rel="manifest" href="manifest.json" />
<link rel="apple-touch-icon" href="icon-192.png" />
<meta name="mobile-web-app-capable" content="yes" />
```

**3B. In `function network()`, add the last line:**

```js
function network() {
  let on = navigator.onLine;
  $("net").textContent = on ? "● Online" : "○ Offline";
  $("offline").classList.toggle("hide", on);
  document.body.classList.toggle("is-offline", !on);   // new
}
```

**3C. Just above `network();` at the bottom of the main script:**

```js
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
```

`sw.js` saves the app on the phone the first time it opens, so after that it opens with no internet.
**Every time you change `index.html`, change `henhouse-v1` to `henhouse-v2` (and so on) in `sw.js`**, otherwise
phones keep showing the old copy.

## 4. Seller: add new items (Sell Products)

Paste this at the very end of the `module-seller` block, just before its final `</script>` line.

> **Important:** inside the `module-...` blocks, `<script>` and `</script>` must be written as `<\script>` and
> `<\/script>`, otherwise the browser cuts the block short. The code below is already written that way.

```html
<\script>
  /* ===== ADD NEW ITEMS (Sell Products) ===== */
  (function () {
    var KEY = "henhouse_seller_products_v1";

    // 1) Load items the seller added earlier (kept on the device, works offline)
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (Array.isArray(saved) && saved.length) {
        products.length = 0;
        saved.forEach(function (p) {
          products.push(p);
        });
      }
    } catch (e) {}

    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(products));
      } catch (e) {}
    }

    // 2) "Add new item" button at the top of the catalog
    var addBtn = document.createElement("button");
    addBtn.id = "addItemBtn";
    addBtn.type = "button";
    addBtn.className = "primary";
    addBtn.textContent = "＋ Add new item";
    addBtn.style.margin = "0 10px";
    var listHead = document.querySelector(".listings .listhead");
    listHead.insertBefore(addBtn, document.querySelector("#filterTabs"));
    addBtn.onclick = function () {
      document.querySelector("#productModal").classList.add("open");
    };

    // 3) Save after an item is added (the form already adds it to the list)
    var form = document.querySelector("#productForm");
    var originalSubmit = form.onsubmit;
    form.onsubmit = function (e) {
      originalSubmit.call(form, e);
      var p = products[0];
      p.price = Number(p.price);
      p.stock = Number(p.stock);
      save();
      render();
    };

    // 4) Save after stock is edited
    var cardsBox = document.querySelector("#cards");
    var originalCards = cardsBox.onclick;
    cardsBox.onclick = function (e) {
      originalCards.call(cardsBox, e);
      save();
    };

    // 5) Questions to the seller can only be sent when online
    var askForm = document.querySelector("#askForm");
    var originalAsk = askForm.onsubmit;
    askForm.onsubmit = function (e) {
      if (!navigator.onLine) {
        e.preventDefault();
        toast("You are offline. Connect to the internet to send.");
        return;
      }
      originalAsk.call(askForm, e);
    };

    render();
  })();
<\/script>
```

What it does: adds the button, opens the existing form, saves every item in the phone's storage so it is still there
after closing the app, and blocks "Ask the seller" messages when offline.

## 5. Buyer: sending only when online

Paste at the end of the `module-buyer` block, just before its final `</script>` line (same escaping rule):

```html
<\script>
  /* ===== BUYER: sending needs internet ===== */
  (function () {
    var originalSend = send;
    send = function () {
      if (!navigator.onLine) {
        notify("You are offline. Connect to the internet to send messages.");
        return;
      }
      originalSend();
    };
    var originalOffer = offer;
    offer = function (id) {
      if (!navigator.onLine) {
        notify("You are offline. Connect to the internet to make an offer.");
        return;
      }
      originalOffer(id);
    };
  })();
<\/script>
```

Buyers can browse the whole marketplace offline. Sending a message or an offer shows
"You are offline" until the connection returns.

## 6. Make the APK (Capacitor, works fully offline)

You need on your Windows PC: Node.js (nodejs.org), Android Studio (developer.android.com/studio), which includes the JDK.

1. Create a folder `henhouse-app` and inside it a folder `www`. Put these 5 files in `www`:
   `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`
2. Open Command Prompt in `henhouse-app` and run:

```
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Henhouse Poultry Hub" com.henhouse.poultryhub --web-dir www
npx cap add android
npx cap sync
npx cap open android
```

3. Android Studio opens. Wait for Gradle to finish, then choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. The file is at `android\app\build\outputs\apk\debug\app-debug.apk`. Copy it to a phone and install it
   (allow "install unknown apps"). For Google Play you need a signed release build (**Build > Generate Signed Bundle / APK**).
5. After editing `index.html` later: copy it to `www`, run `npx cap sync`, and build again.

Capacitor serves the app from `https://localhost` inside the phone, which is what lets the service worker and saved
data work.

## 7. What still needs internet (important)

These load from the web, so they will not work offline unless you download them:

- **Maps:** Leaflet (`unpkg.com`) in Farm Management and Buyer, plus the map pictures from OpenStreetMap and ArcGIS.
- **Supabase** (`supabase-js` from `cdn.jsdelivr.net`, and your database): needs internet for live data.
- **Weather** (`open-meteo.com`): needs internet.

To make the screens open offline, download Leaflet and Supabase into `www/libs` and change the links:

```
curl -o www/libs/leaflet.js  https://unpkg.com/leaflet@1.9.4/dist/leaflet.js
curl -o www/libs/leaflet.css https://unpkg.com/leaflet@1.9.4/dist/leaflet.css
curl -o www/libs/supabase.js https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
```

(Create `www/libs` first. Also download the images folder from `unpkg.com/leaflet@1.9.4/dist/images/` into `www/libs/images/`.)
Then replace `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` with `libs/leaflet.js`, the `.css` link with
`libs/leaflet.css`, and the jsdelivr link with `libs/supabase.js`, in the Farm Management and Buyer blocks.
Map tiles and weather will still show only when online.

## 8. Not done yet

- Items added by a seller do **not** appear in the Buyer marketplace yet. They are saved on the phone only. Showing
  them to buyers needs shared storage (a Supabase table) and a Buyer page that reads from it. I can write that next.
- The sample "Ask the seller" and buyer messages are demo-only (they are not delivered anywhere), as the app's own notices say.
