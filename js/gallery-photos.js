// Фото для галереи-комнаты (четвёртый экран).
// Чтобы добавить снимок: положите файл в папку img/gallery/ и допишите строку в конец списка:
//     { src: 'img/gallery/имя-файла.jpg', alt: 'что на снимке', genre: 'Пейзаж' },
// genre — раздел на этикетке: Портрет, Уличный портрет, Стрит-фото, Архитектура, Пейзаж, Рекламное фото.
// Текст alt подписан на этикетке у рамки; если подпись нужна другой — добавьте label: '…'.
// Размеры (w, h) можно не писать — страница узнает их сама. Фото не обрезаются:
// рамка подстраивается под пропорции снимка. Стены комнаты делят снимки между собой поровну.
window.GALLERY_PHOTOS = [
	{ src: 'img/gallery/sunbeams-forest.jpg', alt: 'Солнечные лучи сквозь листву', genre: 'Пейзаж', w: 1200, h: 1800 },
	{ src: 'img/gallery/swing-couple.jpg', alt: 'Пара на качелях под навесом', genre: 'Уличный портрет', w: 843, h: 1500 },
	{ src: 'img/genres/portrait/DSC04053.jpg', alt: 'Девушка держит флакон духов у лица', genre: 'Портрет', w: 1334, h: 2000 },
	{ src: 'img/gallery/handrail-motion.jpg', alt: 'Поток людей у поручня, движение', genre: 'Стрит-фото', w: 1500, h: 1103 },
	{ src: 'img/gallery/red-square-night.jpg', alt: 'Силуэты на парящем мосту на фоне собора', genre: 'Стрит-фото', w: 1217, h: 1500 },
	{ src: 'img/gallery/birches.jpg', alt: 'Две пожилые женщины гуляют у пруда среди берёз', genre: 'Стрит-фото', w: 428, h: 640 },
	{ src: 'img/gallery/cathedral-birds.jpg', alt: 'Храм Христа Спасителя в сумерках, птицы', genre: 'Архитектура', w: 1500, h: 1444 },
	{ src: 'img/gallery/bench.jpg', alt: 'Пара на скамейке в парке', genre: 'Уличный портрет', w: 426, h: 640 },
	{ src: 'img/gallery/lake.jpg', alt: 'Силуэт человека у озера в сумерках', genre: 'Пейзаж', w: 1304, h: 640 },
	{ src: 'img/gallery/walk.jpg', alt: 'Семья идёт по солнечной аллее', genre: 'Стрит-фото', w: 958, h: 640 },
	{ src: 'img/gallery/pine-glade.jpg', alt: 'Поляна среди сосен в утреннем свете', genre: 'Пейзаж', w: 1500, h: 1125 },
	{ src: 'img/gallery/squirrel-cafe.jpg', alt: 'Кормушка «Беличье кафе» на дереве', genre: 'Стрит-фото', w: 960, h: 640 },
	{ src: 'img/genres/architecture/arch-sunset.jpg', alt: 'Арка с видом на колесо обозрения на закате', genre: 'Архитектура', w: 1280, h: 960 },
	{ src: 'img/gallery/forest-stream.jpg', alt: 'Лесная речка среди деревьев', genre: 'Пейзаж', w: 1500, h: 1009 },
	{ src: 'img/gallery/highrise-storm.jpg', alt: 'Высотка под грозовым небом', genre: 'Архитектура', w: 1500, h: 2000 },
	{ src: 'img/genres/portrait/DSC04026.jpg', alt: 'Девушка с флаконом духов в руках', genre: 'Рекламное фото', w: 1334, h: 2000 },
	{ src: 'img/gallery/railing.jpg', alt: 'Кованая ограда набережной, город в дымке', genre: 'Архитектура', w: 960, h: 640 },
	{ src: 'img/gallery/willow-alley.jpg', alt: 'Аллея старых ив в вечернем свете', genre: 'Пейзаж', w: 870, h: 1280 },
	{ src: 'img/gallery/tunnel-light.jpg', alt: 'Силуэт человека в кирпичном тоннеле', genre: 'Уличный портрет', w: 1125, h: 1125 },
	{ src: 'img/gallery/foggy-tree.jpg', alt: 'Дерево в рассветном тумане у реки', genre: 'Пейзаж', w: 1085, h: 1500 },
	{ src: 'img/gallery/cat-window.jpg', alt: 'Кошка в светящемся окне ночью', genre: 'Стрит-фото', w: 1327, h: 2000 },
	{ src: 'img/gallery/bridge.jpg', alt: 'Мостик над прудом в весеннем парке, сепия', genre: 'Пейзаж', w: 960, h: 640 },
	{ src: 'img/genres/architecture/kremlin-towers.jpg', alt: 'Башни кремля на закате', genre: 'Архитектура', w: 960, h: 1280 },
	{ src: 'img/gallery/snow-path.jpg', alt: 'Тропа в заснеженном лесу на закате', genre: 'Пейзаж', w: 1121, h: 1280 },
	{ src: 'img/gallery/arbat-artist.jpg', alt: 'Уличный художник на Арбате', genre: 'Стрит-фото', w: 1125, h: 1500 },
	{ src: 'img/gallery/birch-railway.jpg', alt: 'Железная дорога среди осенних берёз', genre: 'Пейзаж', w: 1280, h: 959 },
	{ src: 'img/gallery/pigeon-cafe.jpg', alt: 'Голубь на мокром столике уличного кафе', genre: 'Стрит-фото', w: 1500, h: 2000 },
	{ src: 'img/gallery/tram-greenery.jpg', alt: 'Трамвай в зелёном тоннеле деревьев', genre: 'Стрит-фото', w: 1001, h: 1500 },
	{ src: 'img/gallery/moscow-city-contrast.jpg', alt: 'Сталинский дом и башня Москва-Сити', genre: 'Архитектура', w: 1602, h: 2000 },
	{ src: 'img/gallery/pond-arch.jpg', alt: 'Ветви ив над прудом на закате', genre: 'Пейзаж', w: 1125, h: 844 },
];
