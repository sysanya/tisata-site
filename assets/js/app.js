// ============================================================
//  TM TISATA — логика магазина
//  build: 2026-06-19a (cache-bust: refresh CDN object)
// ============================================================

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const state = {
    filter: "all",
    cart: loadCart(),
    modalProduct: null,
    modalSize: null,
    modalColor: null,
  };

  const CAT_LABEL = { women: "ЖЕНСКОЕ", men: "МУЖСКОЕ", unisex: "UNISEX" };

  // Текущий список товаров. По умолчанию — локальный products.js,
  // при наличии Google-таблицы заменяется данными из неё.
  let CATALOG = (typeof PRODUCTS !== "undefined" && Array.isArray(PRODUCTS)) ? PRODUCTS.slice() : [];

  // Товар в наличии?
  function inStock(p) {
    return p.inStock !== false && Array.isArray(p.sizes) && p.sizes.length > 0;
  }

  // ---------- Загрузка товаров из Google-таблицы ----------
  async function loadProducts() {
    const url = (CONFIG.sheetCsvUrl || "").trim();
    if (!url) return; // таблица не подключена — работаем на локальных данных
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const parsed = parseSheet(await res.text());
      if (parsed.length) CATALOG = parsed;
    } catch (e) {
      console.warn("TISATA: не удалось загрузить таблицу товаров, использую локальные данные.", e);
    }
  }

  // простой и надёжный парсер CSV (учитывает кавычки и запятые внутри ячеек)
  function parseCSV(text) {
    const rows = []; let row = []; let cur = ""; let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") { row.push(cur); cur = ""; }
        else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (c === "\r") { /* пропускаем */ }
        else cur += c;
      }
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function normCategory(v) {
    const s = (v || "").toString().trim().toLowerCase();
    if (/^жен|^women/.test(s)) return "women";
    if (/^муж|^men/.test(s)) return "men";
    if (/уни|unisex/.test(s)) return "unisex";
    return "unisex";
  }
  function normStock(v) {
    const s = (v || "").toString().trim().toLowerCase();
    if (s === "") return true;
    if (/^(нет|no|0|false|out|sold)/.test(s)) return false;
    return true; // да / yes / 1 / в наличии / true
  }
  function splitList(v) {
    return (v || "").toString().split(/[;,]/).map((x) => x.trim()).filter(Boolean);
  }
  function toInt(v) {
    const n = parseInt((v || "").toString().replace(/[^\d]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }

  function parseSheet(csvText) {
    const rows = parseCSV(csvText).filter((r) => r.some((c) => c && c.trim() !== ""));
    if (rows.length < 2) return [];
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (names) => {
      for (const n of names) { const i = header.indexOf(n); if (i !== -1) return i; }
      return -1;
    };
    const col = {
      id: idx(["id", "ид"]),
      name: idx(["название", "name", "наименование"]),
      category: idx(["категория", "category", "пол"]),
      price: idx(["цена", "price"]),
      oldPrice: idx(["старая цена", "oldprice", "old price"]),
      badge: idx(["бейдж", "метка", "badge"]),
      sizes: idx(["размеры", "sizes", "размер"]),
      colors: idx(["цвета", "цвет", "colors", "color"]),
      images: idx(["фото", "images", "изображения"]),
      description: idx(["описание", "description"]),
      inStock: idx(["наличие", "instock", "в наличии"]),
    };
    const get = (r, i) => (i >= 0 && i < r.length ? r[i] : "");
    const out = [];
    rows.slice(1).forEach((r, n) => {
      const name = get(r, col.name).trim();
      if (!name) return;
      const sizesRaw = splitList(get(r, col.sizes));
      out.push({
        id: toInt(get(r, col.id)) || (n + 1),
        name,
        category: normCategory(get(r, col.category)),
        price: toInt(get(r, col.price)),
        oldPrice: toInt(get(r, col.oldPrice)),
        badge: get(r, col.badge).trim(),
        sizes: sizesRaw.map((s) => (/^\d+$/.test(s) ? Number(s) : s)),
        colors: splitList(get(r, col.colors)),
        images: splitList(get(r, col.images)),
        description: get(r, col.description).trim(),
        inStock: normStock(get(r, col.inStock)),
      });
    });
    return out;
  }

  // ---------- Инициализация текстов из config ----------
  function applyConfig() {
    document.title = `${CONFIG.brand} — ${CONFIG.tagline}`;
    $("#logo").textContent = CONFIG.brand;
    $("#heroLine1").textContent = CONFIG.heroLine1;
    $("#heroLine2").textContent = CONFIG.heroLine2;
    $("#heroSubtitle").textContent = CONFIG.heroSubtitle;
    $("#footerBig").textContent = CONFIG.brand;
    $("#footerCity").textContent = CONFIG.city ? `Доставка: ${CONFIG.city} и вся РФ` : "";
    $("#year").textContent = new Date().getFullYear();

    const tg = $("#footerTg");
    if (CONFIG.telegram) { tg.href = `https://t.me/${CONFIG.telegram}`; tg.textContent = CONFIG.telegramName || "Telegram"; }
    else tg.style.display = "none";

    const ig = $("#footerIg");
    if (CONFIG.instagram) { ig.href = `https://instagram.com/${CONFIG.instagram}`; }
    else ig.style.display = "none";
  }

  // ---------- Деньги ----------
  function money(n) {
    return n.toLocaleString("ru-RU") + " " + CONFIG.currencySymbol;
  }

  // ---------- Плейсхолдер для отсутствующих фото ----------
  function mediaHTML(product, cls) {
    const img = product.images && product.images[0];
    if (img) {
      return `<img src="${img}" alt="${product.name}" loading="lazy"
        onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'ph\\'><span>${product.name}</span></div>')">`;
    }
    return `<div class="ph"><span>${product.name}</span></div>`;
  }

  // ---------- Рендер каталога ----------
  function renderCatalog() {
    const grid = $("#grid");
    const list = CATALOG.filter((p) => state.filter === "all" || p.category === state.filter);

    if (!list.length) {
      grid.innerHTML = `<div style="padding:60px 22px;grid-column:1/-1;color:#8a8a8a;letter-spacing:.1em;">ТОВАРОВ В ЭТОЙ КАТЕГОРИИ ПОКА НЕТ</div>`;
      return;
    }

    grid.innerHTML = list.map((p) => {
      const available = inStock(p);
      const badgeText = available ? p.badge : "SOLD OUT";
      const badge = badgeText
        ? `<div class="card__badge${available ? "" : " card__badge--out"}">${badgeText}</div>`
        : "";
      const price = p.oldPrice
        ? `<s>${money(p.oldPrice)}</s>${money(p.price)}`
        : money(p.price);
      return `
        <article class="card${available ? "" : " card--out"}" data-id="${p.id}">
          <div class="card__media">
            ${mediaHTML(p)}
            ${badge}
            <div class="card__quick">${available ? "БЫСТРЫЙ ПРОСМОТР" : "НЕТ В НАЛИЧИИ"}</div>
          </div>
          <div class="card__info">
            <div>
              <div class="card__name">${p.name}</div>
              <div class="card__cat">${CAT_LABEL[p.category] || ""}</div>
            </div>
            <div class="card__price">${price}</div>
          </div>
        </article>`;
    }).join("");

    $$(".card").forEach((c) =>
      c.addEventListener("click", () => openProduct(Number(c.dataset.id)))
    );
  }

  // ---------- Фильтры ----------
  function initFilters() {
    $$(".filters__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".filters__btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        state.filter = btn.dataset.filter;
        renderCatalog();
      });
    });
  }

  // ---------- Карточка товара (модалка) ----------
  function openProduct(id) {
    const p = CATALOG.find((x) => x.id === id);
    if (!p) return;
    const available = inStock(p);
    state.modalProduct = p;
    state.modalSize = null;
    state.modalColor = (p.colors && p.colors.length === 1) ? p.colors[0] : null;

    const price = p.oldPrice
      ? `<s>${money(p.oldPrice)}</s>${money(p.price)}`
      : money(p.price);

    const sizes = (p.sizes || []).map((s) =>
      `<button class="pm__opt" data-size="${s}">${s}</button>`).join("");
    const colors = (p.colors || []).map((c) =>
      `<button class="pm__opt${c === state.modalColor ? " is-active" : ""}" data-color="${c}">${c}</button>`).join("");

    $("#modalBody").innerHTML = `
      <div class="pm__gallery">${galleryHTML(p)}</div>
      <div class="pm__content">
        <div class="pm__name">${p.name}</div>
        <div class="pm__cat">${CAT_LABEL[p.category] || ""}</div>
        <div class="pm__price">${price}</div>
        ${available ? "" : `<div class="pm__soldout">НЕТ В НАЛИЧИИ</div>`}
        <p class="pm__desc">${p.description || ""}</p>
        ${available && p.colors && p.colors.length ? `<div class="pm__label">ЦВЕТ</div><div class="pm__opts" id="pmColors">${colors}</div>` : ""}
        ${available && p.sizes && p.sizes.length ? `<div class="pm__label">РАЗМЕР</div><div class="pm__opts" id="pmSizes">${sizes}</div>` : ""}
        <button class="pm__add" id="pmAdd" disabled>ВЫБЕРИТЕ РАЗМЕР</button>
      </div>`;

    $$("#pmSizes .pm__opt").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#pmSizes .pm__opt").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        state.modalSize = b.dataset.size;
        updateAddBtn();
      }));
    $$("#pmColors .pm__opt").forEach((b) =>
      b.addEventListener("click", () => {
        $$("#pmColors .pm__opt").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        state.modalColor = b.dataset.color;
        updateAddBtn();
      }));

    $("#pmAdd").addEventListener("click", addCurrentToCart);
    initGallery();
    updateAddBtn();
    openOverlay("#productModal");
  }

  // ---------- Галерея фото в карточке ----------
  function galleryHTML(p) {
    const imgs = (p.images && p.images.length) ? p.images : [];
    state.galleryImgs = imgs;
    state.galleryIndex = 0;
    if (!imgs.length) {
      return `<div class="pm__main"><div class="ph"><span>${p.name}</span></div></div>`;
    }
    const nav = imgs.length > 1 ? `
      <button class="pm__nav pm__nav--prev" id="pmPrev" aria-label="Предыдущее фото">‹</button>
      <button class="pm__nav pm__nav--next" id="pmNext" aria-label="Следующее фото">›</button>
      <div class="pm__counter" id="pmCounter">1 / ${imgs.length}</div>` : "";
    const main = `<div class="pm__main" id="pmMain">
      <img id="pmMainImg" src="${imgs[0]}" alt="${p.name}"
        onerror="this.style.display='none';this.parentNode.insertAdjacentHTML('afterbegin','<div class=\\'ph\\'><span>${p.name}</span></div>')">
      ${nav}
    </div>`;
    const thumbs = imgs.length > 1
      ? `<div class="pm__thumbs">${imgs.map((src, i) =>
          `<button class="pm__thumb${i === 0 ? " is-active" : ""}" data-i="${i}">
             <img src="${src}" alt="" loading="lazy">
           </button>`).join("")}</div>`
      : "";
    return main + thumbs;
  }

  function setGalleryImage(i) {
    const imgs = state.galleryImgs || [];
    if (!imgs.length) return;
    state.galleryIndex = (i + imgs.length) % imgs.length;
    const img = $("#pmMainImg");
    if (img) img.src = imgs[state.galleryIndex];
    const c = $("#pmCounter");
    if (c) c.textContent = (state.galleryIndex + 1) + " / " + imgs.length;
    const thumbs = $$(".pm__thumb");
    thumbs.forEach((b, idx) => b.classList.toggle("is-active", idx === state.galleryIndex));
    const active = thumbs[state.galleryIndex];
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function initGallery() {
    const prev = $("#pmPrev"), next = $("#pmNext");
    if (prev) prev.addEventListener("click", () => setGalleryImage(state.galleryIndex - 1));
    if (next) next.addEventListener("click", () => setGalleryImage(state.galleryIndex + 1));
    $$(".pm__thumb").forEach((btn) =>
      btn.addEventListener("click", () => setGalleryImage(Number(btn.dataset.i))));

    // свайп на телефоне
    const main = $("#pmMain");
    if (main) {
      let x0 = null;
      main.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
      main.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) setGalleryImage(state.galleryIndex + (dx < 0 ? 1 : -1));
        x0 = null;
      }, { passive: true });
    }
  }

  function updateAddBtn() {
    const btn = $("#pmAdd");
    if (!btn) return;
    if (!inStock(state.modalProduct)) { btn.disabled = true; btn.textContent = "НЕТ В НАЛИЧИИ"; return; }
    const needSize = state.modalProduct.sizes && state.modalProduct.sizes.length;
    const needColor = state.modalProduct.colors && state.modalProduct.colors.length;
    const ok = (!needSize || state.modalSize) && (!needColor || state.modalColor);
    btn.disabled = !ok;
    btn.textContent = ok ? "ДОБАВИТЬ В КОРЗИНУ" : (!state.modalSize && needSize ? "ВЫБЕРИТЕ РАЗМЕР" : "ВЫБЕРИТЕ ЦВЕТ");
  }

  function addCurrentToCart() {
    const p = state.modalProduct;
    const key = `${p.id}-${state.modalSize}-${state.modalColor}`;
    const existing = state.cart.find((i) => i.key === key);
    if (existing) existing.qty += 1;
    else state.cart.push({
      key, id: p.id, name: p.name, price: p.price,
      size: state.modalSize, color: state.modalColor,
      image: (p.images && p.images[0]) || "", qty: 1,
    });
    saveCart();
    renderCart();
    closeOverlay("#productModal");
    toast("ДОБАВЛЕНО В КОРЗИНУ");
    openOverlay("#cartDrawer");
  }

  // ---------- Корзина ----------
  function renderCart() {
    const count = state.cart.reduce((s, i) => s + i.qty, 0);
    $("#cartCount").textContent = count;

    const items = $("#cartItems");
    if (!state.cart.length) {
      items.innerHTML = `<div class="cart-drawer__empty">КОРЗИНА ПУСТА</div>`;
    } else {
      items.innerHTML = state.cart.map((i) => {
        const media = i.image
          ? `<img src="${i.image}" alt="${i.name}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph'}))">`
          : `<div class="ph"></div>`;
        const meta = [i.color, i.size ? `р. ${i.size}` : ""].filter(Boolean).join(" · ");
        return `
          <div class="ci">
            <div class="ci__media">${media}</div>
            <div class="ci__main">
              <div class="ci__name">${i.name}</div>
              <div class="ci__meta">${meta}</div>
              <div class="ci__row">
                <div class="ci__qty">
                  <button data-dec="${i.key}">−</button>
                  <span>${i.qty}</span>
                  <button data-inc="${i.key}">+</button>
                </div>
                <div class="ci__price">${money(i.price * i.qty)}</div>
              </div>
              <button class="ci__remove" data-rm="${i.key}">УДАЛИТЬ</button>
            </div>
          </div>`;
      }).join("");
    }

    const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
    $("#cartTotal").textContent = money(total);
    $("#checkoutBtn").disabled = !state.cart.length;

    $$("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
    $$("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
    $$("[data-rm]").forEach((b) => b.addEventListener("click", () => removeItem(b.dataset.rm)));
  }

  function changeQty(key, delta) {
    const item = state.cart.find((i) => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter((i) => i.key !== key);
    saveCart();
    renderCart();
  }
  function removeItem(key) {
    state.cart = state.cart.filter((i) => i.key !== key);
    saveCart();
    renderCart();
  }

  // ---------- Оформление заказа в Telegram ----------
  function checkout() {
    if (!state.cart.length) return;
    const lines = [];
    lines.push(`Здравствуйте! Хочу заказать в ${CONFIG.brand}:`);
    lines.push("");
    let total = 0;
    state.cart.forEach((i, n) => {
      total += i.price * i.qty;
      const meta = [i.color, i.size ? `размер ${i.size}` : ""].filter(Boolean).join(", ");
      lines.push(`${n + 1}. ${i.name}${meta ? " — " + meta : ""} × ${i.qty} = ${money(i.price * i.qty)}`);
    });
    lines.push("");
    lines.push(`Итого: ${money(total)}`);
    lines.push("");
    lines.push("Моё имя: ");
    lines.push("Город / адрес доставки: ");
    lines.push("Телефон: ");

    const text = lines.join("\n");

    // копируем заказ в буфер обмена (в рамках клика — для прав доступа)
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch (e) { /* без буфера обмена — текст всё равно в подсказке */ }

    if (CONFIG.telegram) {
      // открываем прямой чат с магазином; заказ уже в буфере — вставить и отправить
      window.open("https://t.me/" + CONFIG.telegram, "_blank");
      toast(copied ? "ЗАКАЗ СКОПИРОВАН — ВСТАВЬТЕ В ЧАТ И ОТПРАВЬТЕ" : "ОТКРЫВАЕМ TELEGRAM…");
    } else {
      toast("TELEGRAM НЕ НАСТРОЕН");
    }
  }

  // ---------- Оверлеи ----------
  function openOverlay(sel) { $(sel).classList.add("is-open"); document.body.classList.add("no-scroll"); }
  function closeOverlay(sel) {
    $(sel).classList.remove("is-open");
    if (!$(".product-modal.is-open") && !$(".cart-drawer.is-open")) document.body.classList.remove("no-scroll");
  }

  function initOverlays() {
    $("#cartBtn").addEventListener("click", () => openOverlay("#cartDrawer"));
    $$("[data-close]").forEach((el) => el.addEventListener("click", () => closeOverlay("#productModal")));
    $$("[data-cart-close]").forEach((el) => el.addEventListener("click", () => closeOverlay("#cartDrawer")));
    $("#checkoutBtn").addEventListener("click", checkout);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeOverlay("#productModal"); closeOverlay("#cartDrawer"); }
      const modalOpen = $(".product-modal.is-open");
      if (modalOpen && state.galleryImgs && state.galleryImgs.length > 1) {
        if (e.key === "ArrowLeft") setGalleryImage(state.galleryIndex - 1);
        if (e.key === "ArrowRight") setGalleryImage(state.galleryIndex + 1);
      }
    });
    $("#menuBtn").addEventListener("click", () => {
      document.querySelector("#catalog").scrollIntoView({ behavior: "smooth" });
    });
  }

  // ---------- Хранилище корзины ----------
  function saveCart() { try { localStorage.setItem("tisata_cart", JSON.stringify(state.cart)); } catch (e) {} }
  function loadCart() { try { return JSON.parse(localStorage.getItem("tisata_cart")) || []; } catch (e) { return []; } }

  // ---------- Тост ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2200);
  }

  // ---------- Диагностика: показать ошибку прямо на странице ----------
  function showDebug(label, err) {
    try {
      var g = document.getElementById("grid");
      if (!g) return;
      var msg = (err && (err.message || err)) + "";
      var stack = (err && err.stack) ? ("\n\n" + err.stack) : "";
      g.innerHTML =
        '<div style="padding:30px 22px;grid-column:1/-1;color:#c0392b;font-size:13px;' +
        'line-height:1.5;white-space:pre-wrap;font-family:monospace;border:1px solid #c0392b;">' +
        "[DEBUG] " + label + ": " + msg + stack +
        "\n\nCONFIG: " + (typeof CONFIG !== "undefined" ? "ok" : "UNDEFINED") +
        "\nPRODUCTS: " + (typeof PRODUCTS !== "undefined" ? PRODUCTS.length : "UNDEFINED") +
        "</div>";
    } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    showDebug("window.error", e.error || e.message);
  });

  // ---------- Старт ----------
  try {
    applyConfig();
    initFilters();
    initOverlays();
    renderCart();
    renderCatalog(); // сразу показываем локальные данные
    loadProducts()
      .then(() => renderCatalog()) // затем обновляем из Google-таблицы, если подключена
      .catch((e) => showDebug("loadProducts", e));
  } catch (err) {
    showDebug("init", err);
  }
})();
