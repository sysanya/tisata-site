# Деплой tisata.ru + обновления

Схема: **GitHub → Netlify → tisata.ru**. Пуш в GitHub = сайт обновился за ~1 мин.

---

## Один раз: настройка

### 1. GitHub

```bash
cd ~/Documents/tisata-site
git add .
git commit -m "Initial TISATA site"
```

На https://github.com/new создай репозиторий **tisata-site** (private или public).

```bash
git remote add origin git@github.com:ТВОЙ_USERNAME/tisata-site.git
git push -u origin main
```

### 2. Netlify

1. https://app.netlify.com → **Add new site** → **Import an existing project**
2. **GitHub** → репозиторий `tisata-site`
3. Настройки (подставятся из `netlify.toml`):
   - Build command: *(пусто или echo)*
   - Publish directory: **`.`** (корень)
4. **Deploy site** → получишь `random-name.netlify.app`

### 3. Домен tisata.ru (reg.ru / nic.ru)

**В Netlify:** Site → **Domain management** → **Add domain** → `tisata.ru` и `www.tisata.ru`

**В reg.ru** (если NS остаются на reg.ru):

| Тип | Имя | Значение |
|-----|-----|----------|
| **A** | `@` | `75.2.60.5` |
| **CNAME** | `www` | `твой-сайт.netlify.app` |

*(IP Netlify для apex — проверь в Netlify → Domain settings → DNS, если изменился.)*

**Альтернатива:** в reg.ru сменить NS на Netlify DNS — тогда всё в одной панели Netlify.

SSL (HTTPS) Netlify включит сам после проверки DNS (до 24 ч, обычно 15–30 мин).

### 4. Проверка

- [ ] https://tisata.ru открывается
- [ ] С телефона: товар → «Оформить» → открывается **@tisata_shop** с текстом заказа
- [ ] `config.js` → `telegram: "tisata_shop"`

---

## Каждое обновление сайта

```bash
cd ~/Documents/tisata-site
# правишь файлы, фото в images/, config.js, products.js и т.д.
git add .
git commit -m "описание изменения"
git push
```

Netlify сам пересоберёт и выложит. Статус: Netlify dashboard → **Deploys**.

### Товары без перезаливки (рекомендуется)

Подключи Google-таблицу в `assets/js/config.js` → `sheetCsvUrl` (см. README).
Тогда цены/размеры меняешь в таблице — **git push не нужен**.

Новые **фото** — положить в `images/` и сделать `git push`.

---

## Если что-то сломалось

- **Deploy failed** — Netlify → Deploys → лог ошибки
- **Домен не открывается** — проверь A/CNAME в reg.ru, подожди до 24 ч
- **Заказ не в TG** — проверь `telegram` в `config.js`

---

## Альтернатива: Vercel

Тот же GitHub-репо → https://vercel.com → Import → root directory `.` → добавить домен tisata.ru в настройках.
