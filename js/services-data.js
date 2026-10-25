// Шестой экран «Что снимаем»: жанры съёмки с ценами — список жанров как в макете Figma.
// Из этого списка js/services.js строит меню жанров, описание с ценой и два снимка-полароида.
// Чтобы поменять цену, текст или снимок — правьте здесь.
// photos: два снимка жанра — верхний и нижний; w, h — размеры, рамка повторяет пропорции снимка.
window.SERVICES = [
	{
		title: 'Портрет',
		text: 'Характер, свет и настроение человека.',
		price: 'от 6 000 ₽',
		includes: ['1 час съёмки', '15 кадров в ретуши', 'помогу с образом и позированием'],
		photos: [
			{ src: 'img/genres/portrait/DSC04053.jpg', alt: 'Девушка держит флакон духов у лица', w: 1334, h: 2000 },
			{ src: 'img/genres/portrait/DSC04026.jpg', alt: 'Девушка с флаконом духов в руках', w: 1334, h: 2000 },
		],
	},
	{
		title: 'Уличный портрет',
		text: 'Естественный свет и живой город вокруг героя.',
		price: 'от 5 000 ₽',
		includes: ['1 час на локации', '20 кадров в обработке', 'подберу место и время света'],
		photos: [
			{ src: 'img/gallery/bench.jpg', alt: 'Пара на скамейке в парке', w: 426, h: 640 },
			{ src: 'img/gallery/birches.jpg', alt: 'Две пожилые женщины гуляют у пруда среди берёз', w: 428, h: 640 },
		],
	},
	{
		title: 'Стрит-фото',
		text: 'Случайные моменты, которые больше не повторятся.',
		price: 'от 4 000 ₽',
		includes: ['прогулка по городу 1,5 часа', '25 кадров в обработке', 'готовые файлы за 7 дней'],
		photos: [
			{ src: 'img/gallery/handrail-motion.jpg', alt: 'Поток людей у поручня, движение', w: 1500, h: 1103 },
			{ src: 'img/gallery/red-square-night.jpg', alt: 'Силуэты на парящем мосту на фоне собора', w: 1217, h: 1500 },
		],
	},
	{
		title: 'Архитектура',
		text: 'Здания, интерьеры, линии города и свет.',
		price: 'от 2 000 ₽',
		includes: ['съёмка здания или интерьера', '15 кадров с выверенной перспективой', 'готовые файлы за 7 дней'],
		photos: [
			{ src: 'img/genres/architecture/arch-sunset.jpg', alt: 'Арка с видом на колесо обозрения на закате', w: 1280, h: 960 },
			{ src: 'img/gallery/highrise-storm.jpg', alt: 'Высотка под грозовым небом', w: 1500, h: 2000 },
		],
	},
	{
		title: 'Пейзаж',
		text: 'Туман, рассветы и тишина природы.',
		price: 'от 3 000 ₽',
		includes: ['выезд на рассвет или закат', '10 кадров в обработке', 'готовые файлы за 7 дней'],
		photos: [
			{ src: 'img/gallery/forest-stream.jpg', alt: 'Лесная речка среди деревьев', w: 1500, h: 1009 },
			{ src: 'img/gallery/snow-path.jpg', alt: 'Тропа в заснеженном лесу на закате', w: 1121, h: 1280 },
		],
	},
];

// кадры приглушённой плёнки на фоне экрана
window.SERVICES_FILM = [
	'img/gallery/lake.jpg',
	'img/gallery/tram-greenery.jpg',
	'img/gallery/cathedral-birds.jpg',
	'img/gallery/pine-glade.jpg',
	'img/gallery/swing-couple.jpg',
	'img/gallery/railing.jpg',
	'img/gallery/willow-alley.jpg',
	'img/gallery/pigeon-cafe.jpg',
];
