// ============================================================
//  ТОВАРЫ TM TISATA
//  Импортировано из выгрузки Wildberries (2 модели).
//
//  Чтобы добавить модель — скопируйте блок { ... }, поменяйте
//  значения, не забудьте запятую между блоками.
//
//  Поля:
//   id        — уникальный номер (не повторять)
//   name      — название модели
//   category  — "women" | "men" | "unisex"
//   price     — цена (число, без пробелов)
//   oldPrice  — старая цена для зачёркивания (0 = нет скидки)
//   badge     — метка на карточке: "NEW", "ХИТ", "-20%" или ""
//   sizes     — список размеров
//   colors    — список цветов
//   images    — фото (файлы лежат в папке images/)
//   description — описание
// ============================================================

const PRODUCTS = [
  {
    id: 1,
    name: "LACE SNEAKER — WHITE / SILVER",
    category: "women",
    price: 25500,
    oldPrice: 0,
    badge: "NEW",
    inStock: true,
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
    colors: ["Белый / серебро"],
    images: [
      "images/white-silver-2.webp",
      "images/white-silver-3.webp",
      "images/white-silver-4.webp",
      "images/white-silver-5.webp",
      "images/white-silver-6.webp",
      "images/white-silver-7.webp",
    ],
    description:
      "Маломерят на 1 размер — берите на размер больше. Потёртости, винтажный эффект и неоднородное окрашивание подошвы — часть дизайна в стиле luxury sneakers, а не брак. Универсальная пара для города и повседневной носки.",
  },
  {
    id: 2,
    name: "LACE SNEAKER — GREY / PINK",
    category: "women",
    price: 25500,
    oldPrice: 0,
    badge: "ХИТ",
    inStock: true,
    sizes: [39],
    colors: ["Серый / розовый"],
    images: [
      "images/grey-pink-2.webp",
      "images/grey-pink-3.webp",
      "images/grey-pink-4.webp",
      "images/grey-pink-5.webp",
      "images/grey-pink-6.webp",
      "images/grey-pink-7.webp",
      "images/grey-pink-8.webp",
      "images/grey-pink-9.webp",
      "images/grey-pink-10.webp",
      "images/grey-pink-11.webp",
      "images/grey-pink-12.webp",
      "images/grey-pink-13.webp",
      "images/grey-pink-14.webp",
    ],
    description:
      "Большемерят на 1 размер — берите на размер меньше. Потёртости, винтажный эффект и асимметрия — часть дизайна в стиле luxury sneakers, а не брак. Яркий акцент для повседневных образов.",
  },
];
