// ============================================================
//  TM TISATA — НАСТРОЙКИ МАГАЗИНА
//  Меняйте значения ниже. Кавычки не удаляйте.
// ============================================================

const CONFIG = {
  // Название бренда (показывается в шапке и заголовке вкладки)
  brand: "TISATA",
  tagline: "FOOTWEAR",

  // Контакты для заказа
  telegram: "tisata_shop",      // ваш username в Telegram БЕЗ символа @
  telegramName: "@tisata_shop", // как показывать на сайте
  instagram: "",                // username в Instagram БЕЗ @ (оставьте "" если нет)
  email: "",                    // почта (оставьте "" если не нужна)
  city: "Москва",               // город / зона доставки

  // Валюта
  currencySymbol: "₽",

  // Тексты на главном экране (hero)
  heroLine1: "TISATA",
  heroLine2: "SS / 26",
  heroSubtitle: "Обувь без компромиссов. Прямые поставки, честные цены.",

  // ---- Управление товарами через Google-таблицу ----
  // Вставьте сюда ссылку на ОПУБЛИКОВАННУЮ таблицу в формате CSV
  // (см. README, раздел «Управление товарами»). Пока поле пустое —
  // сайт берёт товары из файла products.js.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTc_MeHhzUNw5fTvpf4AEaC0o65GNtWF2IclKyaaVZb-mnnEB33MfTs_0npViz3yAFdfTiiXaeML_Z_/pub?output=csv",
};
