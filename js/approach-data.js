// Страница «Мой подход»: слайды. На каждом — фраза, фон на весь экран и два снимка в рамках.
// Чтобы поменять снимок — замените путь в bg (фон) или в photos (левый и правый).
// Переносы по смыслу: знак | — на всех экранах, / — только на телефоне, ~ — только на планшете и компьютере.
// Предлоги и союзы к следующему слову приклеивает js/approach.js — обычных пробелов достаточно.
// Размеры (w, h) нужны только фону; рамки снимков сами подгоняют кадр.
window.APPROACH = [
	{
		text: 'Снимаю взглядом, | а не нажатием кнопки.',
		bg: { src: 'img/gallery/lake.jpg', w: 1304, h: 640 },
		photos: [
			{ src: 'img/gallery/tram-greenery.jpg', alt: 'Трамвай в зелёном тоннеле деревьев' },
			{ src: 'img/gallery/cat-window.jpg', alt: 'Кошка в светящемся окне ночью' },
		],
	},
	{
		text: 'Детали, свет и история | живут в каждом кадре.',
		bg: { src: 'img/gallery/pine-glade.jpg', w: 1500, h: 1125 },
		photos: [
			{ src: 'img/gallery/sunbeams-forest.jpg', alt: 'Солнечные лучи сквозь листву' },
			{ src: 'img/gallery/foggy-tree.jpg', alt: 'Дерево в рассветном тумане у реки' },
		],
	},
	{
		text: 'Ловлю настоящие эмоции, | а не идеальные улыбки.',
		bg: { src: 'img/gallery/bridge.jpg', w: 960, h: 640 },
		photos: [
			{ src: 'img/genres/portrait/DSC04053.jpg', alt: 'Девушка держит флакон духов у лица' },
			{ src: 'img/gallery/swing-couple.jpg', alt: 'Пара на качелях под навесом' },
		],
	},
	{
		text: 'Камера — только / способ ~ зафиксировать / то, что я вижу.',
		bg: { src: 'img/gallery/birch-railway.jpg', w: 1280, h: 959 },
		photos: [
			{ src: 'img/gallery/tunnel-light.jpg', alt: 'Силуэт человека в тоннеле подземной реки Неглинки' },
			{ src: 'img/gallery/moscow-city-contrast.jpg', alt: 'Сталинский дом и башня Москва-Сити' },
		],
	},
	{
		text: 'Я не отдаю всё подряд. | Только кадры со смыслом.',
		bg: { src: 'img/gallery/forest-stream.jpg', w: 1500, h: 1009 },
		photos: [
			{ src: 'img/gallery/willow-alley.jpg', alt: 'Аллея старых ив в вечернем свете' },
			{ src: 'img/gallery/pigeon-cafe.jpg', alt: 'Голубь на мокром столике уличного кафе' },
		],
	},
];
