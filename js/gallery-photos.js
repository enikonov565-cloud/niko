// Фото для галереи-комнаты (четвёртый экран).
// Чтобы добавить снимок: положите файл в папку img/gallery/ и допишите строку в конец списка:
//     { src: 'img/gallery/имя-файла.jpg', alt: 'что на снимке', label: 'Название', genre: 'Пейзаж' },
// genre — раздел на этикетке: Портрет, Уличный портрет, Стрит-фото, Архитектура, Пейзаж — как в меню жанров на шестом экране.
// label — название на этикетке у рамки; если его нет, на этикетке будет alt (описание снимка).
// Размеры (w, h) можно не писать — страница узнает их сама. Фото не обрезаются:
// рамка подстраивается под пропорции снимка. Стены комнаты делят снимки между собой поровну.
window.GALLERY_PHOTOS = [
	{ src: 'img/gallery/sunbeams-forest.jpg', alt: 'Солнечные лучи сквозь листву', label: 'Свет сквозь сон', genre: 'Пейзаж', w: 1200, h: 1800 },
	{ src: 'img/gallery/swing-couple.jpg', alt: 'Пара на качелях под навесом', label: 'Двое и ветер', genre: 'Уличный портрет', w: 843, h: 1500 },
	{ src: 'img/genres/portrait/DSC04053.jpg', alt: 'Девушка держит флакон духов у лица', label: 'Тайна', genre: 'Портрет', w: 1334, h: 2000 },
	{ src: 'img/gallery/handrail-motion.jpg', alt: 'Поток людей у поручня, движение', label: 'Утро в метро', genre: 'Стрит-фото', w: 1500, h: 1103 },
	{ src: 'img/gallery/red-square-night.jpg', alt: 'Силуэты на парящем мосту на фоне собора', label: 'Сказка ночи', genre: 'Стрит-фото', w: 1217, h: 1500 },
	{ src: 'img/gallery/birches.jpg', alt: 'Две пожилые женщины гуляют у пруда среди берёз', label: 'Вечная прогулка', genre: 'Уличный портрет', w: 428, h: 640 },
	{ src: 'img/gallery/cathedral-birds.jpg', alt: 'Храм Христа Спасителя в сумерках, птицы', label: 'Голуби, несущие свет', genre: 'Архитектура', w: 1500, h: 1444 },
	{ src: 'img/gallery/bench.jpg', alt: 'Пара на скамейке в парке', label: 'Тишина вдвоём', genre: 'Уличный портрет', w: 426, h: 640 },
	{ src: 'img/gallery/lake.jpg', alt: 'Силуэт человека у озера в сумерках', label: 'Думы о будущем', genre: 'Пейзаж', w: 1304, h: 640 },
	{ src: 'img/gallery/walk.jpg', alt: 'Семья идёт по солнечной аллее', label: 'Солнечная сторона', genre: 'Стрит-фото', w: 958, h: 640 },
	{ src: 'img/gallery/pine-glade.jpg', alt: 'Поляна среди сосен в утреннем свете', label: 'Шёпот сосен', genre: 'Пейзаж', w: 1500, h: 1125 },
	{ src: 'img/gallery/squirrel-cafe.jpg', alt: 'Кормушка «Беличье кафе» на дереве', label: 'Беличье кафе', genre: 'Стрит-фото', w: 960, h: 640 },
	{ src: 'img/genres/architecture/arch-sunset.jpg', alt: 'Арка с видом на колесо обозрения на закате', label: 'Окно в закат', genre: 'Архитектура', w: 1280, h: 960 },
	{ src: 'img/gallery/forest-stream.jpg', alt: 'Лесная речка среди деревьев', label: 'Зелёная тишина', genre: 'Пейзаж', w: 1500, h: 1009 },
	{ src: 'img/gallery/highrise-storm.jpg', alt: 'Высотка под грозовым небом', label: 'Спор с небом', genre: 'Архитектура', w: 1500, h: 2000 },
	{ src: 'img/genres/portrait/DSC04026.jpg', alt: 'Девушка с флаконом духов в руках', label: 'Нежность в ладонях', genre: 'Портрет', w: 1334, h: 2000 },
	{ src: 'img/gallery/railing.jpg', alt: 'Кованая ограда набережной, город в дымке', label: 'Дымка', genre: 'Архитектура', w: 960, h: 640 },
	{ src: 'img/gallery/willow-alley.jpg', alt: 'Аллея старых ив в вечернем свете', label: 'Ивы помнят', genre: 'Пейзаж', w: 870, h: 1280 },
	{ src: 'img/gallery/tunnel-light.jpg', alt: 'Силуэт человека в кирпичном тоннеле подземной реки Неглинки', label: 'Неглинка — река под Москвой', genre: 'Архитектура', w: 1125, h: 1125 },
	{ src: 'img/gallery/foggy-tree.jpg', alt: 'Дерево в рассветном тумане у реки', label: 'Утро в молоке', genre: 'Пейзаж', w: 1085, h: 1500 },
	{ src: 'img/gallery/cat-window.jpg', alt: 'Кошка в светящемся окне ночью', label: 'Ждёт', genre: 'Стрит-фото', w: 1327, h: 2000 },
	{ src: 'img/gallery/bridge.jpg', alt: 'Мостик над прудом в весеннем парке, сепия', label: 'Вчерашний день', genre: 'Пейзаж', w: 960, h: 640 },
	{ src: 'img/genres/architecture/kremlin-towers.jpg', alt: 'Башни кремля на закате', label: 'Застывший закат', genre: 'Архитектура', w: 960, h: 1280 },
	{ src: 'img/gallery/snow-path.jpg', alt: 'Тропа в заснеженном лесу на закате', label: 'Тропа к солнцу', genre: 'Пейзаж', w: 1121, h: 1280 },
	{ src: 'img/gallery/arbat-artist.jpg', alt: 'Уличный художник на Арбате', label: 'Лица Арбата', genre: 'Уличный портрет', w: 1125, h: 1500 },
	{ src: 'img/gallery/birch-railway.jpg', alt: 'Железная дорога среди осенних берёз', label: 'Осень уходит', genre: 'Пейзаж', w: 1280, h: 959 },
	{ src: 'img/gallery/pigeon-cafe.jpg', alt: 'Голубь на мокром столике уличного кафе', label: 'Дождливый гость', genre: 'Стрит-фото', w: 1500, h: 2000 },
	{ src: 'img/gallery/tram-greenery.jpg', alt: 'Трамвай в зелёном тоннеле деревьев', label: 'Трамвай в лето', genre: 'Стрит-фото', w: 1001, h: 1500 },
	{ src: 'img/gallery/moscow-city-contrast.jpg', alt: 'Сталинский дом и башня Москва-Сити', label: 'Вчера и завтра', genre: 'Архитектура', w: 1602, h: 2000 },
	{ src: 'img/gallery/pond-arch.jpg', alt: 'Ветви ив над прудом на закате', label: 'Закат в ветвях', genre: 'Пейзаж', w: 1125, h: 844 },
];
