// «Мои работы» (works.html): пять разделов ступеньками. Под снимком — только название раздела.
// Карточка раздела открывает просмотр её снимков (по мотивам codrops GridViewSwitch, MIT),
// кнопка «все работы» — просмотр всех снимков. Снимки и разделы берутся из js/gallery-photos.js
// (genre у каждого снимка) и js/services-data.js (названия и порядок разделов).
// На главной (блок «Выбор за вами» между «Моим подходом» и «Кадром под настроение») — только ступеньки:
// карточка и кнопка ведут на works.html к снимкам раздела или ко всем снимкам.
(() => {
	const gsap = window.gsap;
	const photos = window.GALLERY_PHOTOS || [];
	const services = window.SERVICES || [];
	const stairs = document.querySelector('.wk__stairs');
	if (!stairs) return;
	const onPage = !!document.querySelector('.wv'); // works.html — просмотр на этой же странице; иначе блок на главной
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// адрес раздела: works.html#portrait и т. п.
	const SLUGS = {
		'Портрет': 'portrait',
		'Уличный портрет': 'street-portrait',
		'Стрит-фото': 'street',
		'Архитектура': 'architecture',
		'Пейзаж': 'landscape',
	};
	// обложка раздела на ступеньке — вертикальные кадры, под портретную рамку; если снимка нет — первый снимок раздела
	const COVERS = {
		'Портрет': 'img/genres/portrait/DSC04053.jpg',
		'Уличный портрет': 'img/gallery/bench.jpg',
		'Стрит-фото': 'img/gallery/cat-window.jpg',
		'Архитектура': 'img/genres/architecture/kremlin-towers.jpg',
		'Пейзаж': 'img/gallery/sunbeams-forest.jpg',
	};
	// порядок на ступеньках: портрет — в центре; светлый пейзаж — первым, тёмное стрит-фото — последним
	const STAIRS = ['Пейзаж', 'Уличный портрет', 'Портрет', 'Архитектура', 'Стрит-фото'];

	const genres = services.map((s, i) => ({
		title: s.title,
		slug: SLUGS[s.title] || `g${i + 1}`,
		photos: photos.filter((p) => p.genre === s.title),
	}));
	const bySlug = (slug) => genres.find((g) => g.slug === slug);

	// ---------- ступеньки ----------
	const stairsOrder = [...genres].sort((a, b) => STAIRS.indexOf(a.title) - STAIRS.indexOf(b.title));
	stairsOrder.forEach((g, i) => {
		const cover = g.photos.find((p) => p.src === COVERS[g.title]) || g.photos[0];
		const li = document.createElement('li');
		li.className = 'wk-card';
		li.style.setProperty('--i', i);
		li.innerHTML = `
			<a class="wk-card__link" href="${onPage ? '' : 'works.html'}#${g.slug}" data-genre="${g.slug}">
				<div class="wk-card__media">${cover ? `<img src="${cover.src}" alt="${cover.alt}" width="${cover.w || ''}" height="${cover.h || ''}" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async">` : ''}</div>
				<span class="wk-card__name">${g.title}</span>
			</a>`;
		stairs.appendChild(li);
	});
	// карточки выплывают снизу по очереди, когда ступеньки показались на экране (CSS: .wk__stairs.is-in)
	if ('IntersectionObserver' in window && !reduced) {
		stairs.classList.add('is-ready');
		new IntersectionObserver(([e], io) => {
			if (!e.isIntersecting) return;
			stairs.classList.add('is-in');
			io.disconnect();
		}, { threshold: 0.15 }).observe(stairs);
	}

	// ---------- схематичные рисунки: фотоаппарат и плёнка — тонкие линии в стиле сайта ----------
	const svg = (cls, vb, parts) => `<svg class="wa__sketch wa__sketch--${cls}" viewBox="${vb}" aria-hidden="true">${parts.join('')}</svg>`;
	// фотоаппарат-дальномер: корпус, выступ, видоискатель, кнопка спуска, объектив
	const camera = svg('camera', '0 0 160 100', [
		'<rect x="8" y="28" width="144" height="62" rx="9"/>',
		'<path d="M8 44 H152"/>',
		'<path d="M26 28 V20 H58 V28"/>',
		'<rect x="40" y="12" width="12" height="8" rx="2"/>',
		'<rect x="114" y="34" width="26" height="14" rx="3"/>',
		'<circle cx="78" cy="62" r="24"/>',
		'<circle cx="78" cy="62" r="16"/>',
		'<circle cx="78" cy="62" r="6"/>',
		'<path d="M69 54 A12 12 0 0 1 84 51"/>',
	]);
	// плёнка: кассета и лента с перфорацией и кадрами
	const holes = [];
	for (let x = 50; x <= 130; x += 10) holes.push(`<rect x="${x}" y="30" width="5" height="4" rx="1"/>`, `<rect x="${x}" y="66" width="5" height="4" rx="1"/>`);
	const film = svg('film', '0 0 140 100', [
		'<rect x="6" y="20" width="34" height="60" rx="7"/>',
		'<path d="M6 30 H40 M6 70 H40"/>',
		'<rect x="17" y="10" width="12" height="10" rx="2"/>',
		'<path d="M40 26 H136 M40 74 H136"/>',
		...holes,
		'<rect x="52" y="38" width="34" height="24" rx="2"/>',
		'<rect x="94" y="38" width="34" height="24" rx="2"/>',
	]);

	// ---------- «Мои работы» на главной: все снимки в шахматном порядке ----------
	// колонки через одну опущены (CSS); каждый кадр — в самую короткую колонку, в своих пропорциях, без обрезки.
	// Рисунки — на пустых местах над опущенными колонками
	const allGrid = document.querySelector('.wa__grid');
	if (allGrid) {
		const colsAll = () => (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 600 ? 3 : 2);
		let builtCols = 0;
		const buildAll = () => {
			const n = colsAll();
			if (n === builtCols) return;
			builtCols = n;
			const cols = Array.from({ length: n }, () => ({ h: 0, html: '' }));
			photos.forEach((p) => {
				const r = p.w && p.h ? p.h / p.w : 1.25;
				let c = 0;
				for (let i = 1; i < n; i++) if (cols[i].h < cols[c].h) c = i;
				cols[c].h += r;
				cols[c].html += `<figure class="wa__item"><img src="${p.src}" alt="${p.alt}" ${p.w ? `width="${p.w}" height="${p.h}"` : ''} loading="lazy" decoding="async"></figure>`;
			});
			// над опущенными колонками — фотоаппарат и плёнка по очереди
			const tops = [camera, film];
			let k = 0;
			const html = cols.map((c, i) => {
				const top = i % 2 ? `<div class="wa__spot wa__spot--top">${tops[k++ % tops.length]}</div>` : '';
				return `<div class="wa__col">${top}${c.html}</div>`;
			});
			allGrid.innerHTML = html.join('');
			// кадры и рисунки проявляются при прокрутке — медленно и плавно
			const items = allGrid.querySelectorAll('.wa__item, .wa__sketch');
			if ('IntersectionObserver' in window && !reduced) {
				const io = new IntersectionObserver((entries) => entries.forEach((e) => {
					if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
				}), { rootMargin: '0px 0px -8% 0px' });
				items.forEach((el) => io.observe(el));
			} else items.forEach((el) => el.classList.add('is-in'));
		};
		buildAll();
		window.addEventListener('resize', buildAll);
		// «все работы» — сразу к этому блоку, без долгой прокрутки через «Кадр под настроение»
		const toAll = () => {
			const y = document.querySelector('#all-works').getBoundingClientRect().top + window.scrollY;
			if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
			else window.scrollTo(0, y);
		};
		document.addEventListener('click', (e) => {
			const a = e.target.closest('a[href="#all-works"]');
			if (!a) return;
			e.preventDefault();
			toAll();
		});
		// пришли со страницы работ (index.html#all-works) — сразу к блоку, когда страница догрузилась
		if (location.hash === '#all-works') {
			toAll();
			window.addEventListener('load', () => requestAnimationFrame(toAll), { once: true });
		}
	}

	// на главной — только ступеньки, ссылки ведут на works.html
	if (!onPage) return;

	// ---------- просмотр раздела — по мотивам codrops GridViewSwitch (MIT) ----------
	// Сетка из шести колонок снимков раздела, уменьшенная до 0,4. «Один кадр»: колонки уезжают вверх и вниз,
	// сетка вырастает, главный кадр (GSAP Flip) раскрывается на весь экран, соседний уходит влево, снизу — миниатюры. Переключатель вида — сверху, «закрыть» — справа.
	const Flip = window.Flip;
	if (gsap && Flip) gsap.registerPlugin(Flip);
	const wv = document.querySelector('.wv');
	let lenis = null;
	if (window.Lenis && !reduced) {
		lenis = new window.Lenis();
		window.lenis = lenis; // меню и карточка снимка останавливают прокрутку через него
		const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
		requestAnimationFrame(raf);
	}

	const COLS = 6, ROWS = 5; // как в демо: 6 колонок по 5 кадров
	const FLIP_AT = [3, 0];   // главный кадр — первый в четвёртой колонке (едет вниз и встаёт в центр)
	const PUSH_AT = [2, 4];   // соседний — последний в третьей колонке (едет вверх и встаёт слева)
	// уменьшенная копия снимка (800 px по длинной стороне, img/thumbs/…) — для сетки и миниатюр:
	// 28 полноразмерных снимков видеокарта отрисовывает с рывками. На весь экран и в карточке — полный размер
	const small = (src) => src.replace(/^img\//, 'img/thumbs/');
	const bg = (p) => `background-image:url('${small(p.src)}')`;
	const esc = (s) => String(s).replace(/"/g, '&quot;');

	let state = null; // открытый раздел: элементы, режим, текущий кадр
	let busy = false;

	function build(slug) {
		const g = bySlug(slug);
		const list = g ? g.photos : photos;
		const title = g ? g.title : 'Все работы';
		const cover = (g && list.find((p) => p.src === COVERS[g.title])) || list[0];
		const rest = list.filter((p) => p !== cover);
		// снимков мало — в сетку идут все, вместе с главным
		const pool = rest.length >= 3 ? rest : list;
		const n = pool.length;
		// 30 мест в сетке: главный кадр и соседний — на своих местах; остальные — так, чтобы у соседей
		// по горизонтали и вертикали снимки были разными (сдвиг на 2 по колонкам и на 1 по рядам; из двух — шахматкой)
		const at = (c, r) => pool[(n >= 3 ? c * 2 + r : c + r) % n];
		const cell = (c, r) => {
			if (c === FLIP_AT[0] && r === FLIP_AT[1]) return { p: cover, cls: ' wv__wrap--flip' };
			if (c === PUSH_AT[0] && r === PUSH_AT[1]) {
				// соседний с главным — не такой, как снимки вокруг него
				const near = [at(c - 1, r), at(c + 1, r), at(c, r - 1)];
				return { p: pool.find((p) => p !== cover && !near.includes(p)) || pool.find((p) => p !== cover) || cover, cls: ' wv__wrap--push' };
			}
			return { p: at(c, r), cls: '' };
		};
		let cols = '';
		for (let c = 0; c < COLS; c++) {
			let items = '';
			for (let r = 0; r < ROWS; r++) {
				const { p, cls } = cell(c, r);
				// главный кадр раскроется на весь экран — сразу в полном размере; остальные — уменьшенные копии
				const src = cls.includes('flip') ? p.src : small(p.src);
				items += `<figure class="wv__item"><div class="wv__wrap${cls}"><img class="wv__img" src="${src}" data-src="${p.src}" alt="${esc(p.alt)}" decoding="async"></div></figure>`;
			}
			cols += `<div class="wv__col wv__col--${c % 2 ? 'down' : 'up'}"><div class="wv__inner">${items}</div></div>`;
		}
		const thumbs = [cover, ...rest];
		wv.innerHTML = `
			<div class="wv__columns">${cols}</div>
			<div class="wv__veil" aria-hidden="true"></div>
			<div class="wv__content">
				<div class="wv__main"></div>
				<nav class="wv__nav" aria-label="Снимки раздела">${thumbs.map((p, i) => `<button class="wv__thumb${i ? '' : ' is-current'}" type="button" data-i="${i}" style="${bg(p)}" aria-label="${esc(p.alt)}"></button>`).join('')}</nav>
			</div>
			<div class="wv__switch" role="group" aria-label="Вид">
				<span class="wv__switch-text">выберите вид</span>
				<button class="wv__switch-btn wv__switch-btn--grid" type="button" aria-label="Сеткой"><svg width="20" height="20" viewBox="0 0 45 45" aria-hidden="true"><rect width="20" height="20"/><rect x="25" width="20" height="20"/><rect y="25" width="20" height="20"/><rect x="25" y="25" width="20" height="20"/></svg></button>
				<button class="wv__switch-btn wv__switch-btn--list" type="button" aria-label="Один кадр"><svg width="22" height="20" viewBox="0 0 22 24" aria-hidden="true"><path d="M0,0 L22,0 L22,18 L0,18 Z M0,20 L4,20 L4,24 L0,24 Z M6,20 L10,20 L10,24 L6,24 Z M12,20 L16,20 L16,24 L12,24 Z M18,20 L22,20 L22,24 L18,24 Z"/></svg></button>
			</div>
			<button class="wv__close" type="button">закрыть</button>`;
		const q = (s) => wv.querySelector(s);
		const flip = q('.wv__wrap--flip');
		state = {
			slug: g ? slug : 'all', thumbs, cur: 0, mode: 'grid',
			grid: q('.wv__columns'), veil: q('.wv__veil'),
			up: wv.querySelectorAll('.wv__col--up > .wv__inner'),
			down: wv.querySelectorAll('.wv__col--down > .wv__inner'),
			content: q('.wv__content'), main: q('.wv__main'),
			nav: q('.wv__nav'), navItems: wv.querySelectorAll('.wv__thumb'),
			flip, flipParent: flip.parentNode, flipImg: flip.querySelector('.wv__img'),
			push: q('.wv__wrap--push'),
			btn: { grid: q('.wv__switch-btn--grid'), list: q('.wv__switch-btn--list') },
			// что загрузить заранее: снимки сетки (как они в ней стоят) и копии для миниатюр
			srcs: [...new Set([...[...wv.querySelectorAll('.wv__img')].map((im) => im.getAttribute('src')), ...thumbs.map((p) => small(p.src))])],
		};
		state.btn.grid.classList.add('is-current');
	}

	// снимки раздела загружаются и декодируются заранее, пока проявляется слой, —
	// иначе декодирование крупных кадров идёт посреди анимации и она дёргается
	const decode = (src) => {
		const im = new Image();
		im.src = src;
		return im.decode ? im.decode().catch(() => {}) : Promise.resolve();
	};
	const ready = (srcs, max) => Promise.race([
		Promise.all(srcs.map(decode)),
		new Promise((r) => setTimeout(r, max)), // медленная сеть — не ждём бесконечно
	]);
	const frames = (n) => new Promise((r) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : r()); f(); });

	// темп просмотра: всё движется медленно и мягко — плавный разгон и плавное торможение, без резких стартов
	const T = reduced
		? { bg: 0, veil: 0, pause: 0, grid: 0, flip: 0, nav: 0, navStep: 0, out: 0, in: 0, close: 0 }
		: { bg: 0.7, veil: 1.2, pause: 0.35, grid: 2.2, flip: 1.5, nav: 1.1, navStep: 0.06, out: 0.7, in: 1.2, close: 1.1 };
	const SMOOTH = 'power3.inOut'; // сетка, колонки, главный кадр
	const SOFT = 'sine.inOut';     // проявление и затухание

	// главный кадр переезжает между сеткой и экраном (GSAP Flip): размерами, не масштабом — снимок не растягивается;
	// поле вокруг снимка и скругление меняются плавно вместе с ним, без скачка в первый кадр
	function morph(s, to, ease) {
		const st = Flip.getState(s.flip, { props: 'padding' });
		const r0 = getComputedStyle(s.flipImg).borderRadius;
		to.appendChild(s.flip);
		const r1 = getComputedStyle(s.flipImg).borderRadius;
		Flip.from(st, { duration: T.flip, ease, props: 'padding' });
		gsap.fromTo(s.flipImg, { borderRadius: r0 }, { borderRadius: r1, duration: T.flip, ease, clearProps: 'borderRadius' });
	}

	// «один кадр»: колонки разъезжаются, главный кадр раскрывается на весь экран, миниатюры выезжают
	const showList = () => {
		const s = state;
		return gsap.timeline({ defaults: { duration: T.grid, ease: SMOOTH }, onStart: () => s.content.classList.add('is-current') })
			.addLabel('start', 0)
			.fromTo(s.grid, { scale: 0.4 }, { scale: 1 }, 'start')
			.to(s.up, { y: '-200vh' }, 'start')
			.to(s.down, { y: '200vh' }, 'start')
			// главный кадр начинает раскрываться чуть раньше, чем колонки остановятся, — движение перетекает, без паузы
			.addLabel('flip', T.grid * 0.85)
			// колонки не прячем: в одной из них соседний снимок — он на экране слева и плавно уезжает влево
			.add(() => {
				morph(s, s.main, SMOOTH);
				gsap.set(s.nav, { opacity: 1 });
			}, 'flip')
			.to(s.push, { duration: T.flip, ease: SMOOTH, xPercent: -100 }, 'flip')
			// миниатюры выплывают снизу по одной, когда главный кадр уже почти раскрылся
			.fromTo(s.navItems, { yPercent: 120, opacity: 0 }, { duration: T.nav, ease: 'power2.out', stagger: T.navStep, yPercent: 0, opacity: 1 }, `flip+=${T.flip * 0.45}`);
	};

	// «сеткой»: всё возвращается обратно
	const showGrid = () => {
		const s = state;
		return gsap.timeline({ defaults: { duration: T.grid, ease: SMOOTH }, onStart: () => s.content.classList.remove('is-current') })
			// миниатюры тонут вниз по одной, затем главный кадр возвращается в сетку
			.to(s.navItems, { duration: T.out, ease: 'power2.in', stagger: -T.navStep, yPercent: 120, opacity: 0 }, 0)
			.addLabel('flip', T.out * 0.6)
			.to(s.push, { duration: T.flip, xPercent: 0 }, 'flip')
			.add(() => morph(s, s.flipParent, SMOOTH), 'flip')
			.addLabel('columns', `flip+=${T.flip * 0.15}`)
			.to([s.down, s.up], { y: 0 }, 'columns')
			.to(s.grid, { scale: 0.4 }, 'columns');
	};

	function toggle(mode) {
		const s = state;
		if (!s || busy || s.mode === mode) return;
		busy = true;
		s.btn[s.mode].classList.remove('is-current');
		s.btn[mode].classList.add('is-current');
		s.mode = mode;
		const tl = mode === 'list' ? showList() : showGrid();
		if (reduced) tl.timeScale(20);
		tl.then(() => { busy = false; });
	}

	// миниатюра: главный кадр плавно меняется на выбранный
	function pick(i) {
		const s = state;
		if (!s || i === s.cur || s.mode !== 'list') return;
		s.navItems[s.cur].classList.remove('is-current');
		s.navItems[i].classList.add('is-current');
		s.cur = i;
		const p = s.thumbs[i];
		// новый кадр декодируется, пока старый гаснет, — смена без рывка
		const loaded = decode(p.src);
		gsap.to(s.flipImg, {
			opacity: 0, duration: T.out, ease: 'sine.in',
			onComplete: () => loaded.then(() => {
				if (s.cur !== i) return; // за это время выбрали другой кадр
				s.flipImg.src = p.src;
				s.flipImg.dataset.src = p.src;
				s.flipImg.alt = p.alt;
				// проявляется, когда сам элемент декодировал кадр (вне основного потока)
				const shown = s.flipImg.decode ? s.flipImg.decode().catch(() => {}) : Promise.resolve();
				shown.then(() => {
					// новый кадр проявляется и чуть приближается к зрителю — «выплывает»
					if (s.cur === i) gsap.fromTo(s.flipImg, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: T.in, ease: 'power2.out', clearProps: 'scale' });
				});
			}),
		});
	}

	function open(slug) {
		if (busy || !gsap || !Flip) return;
		busy = true;
		build(slug);
		wv.style.pointerEvents = ''; // на случай, если открыли во время невидимого прогрева сетки
		history.replaceState(null, '', `#${state.slug}`);
		if (lenis) lenis.stop();
		document.documentElement.classList.add('wv-open');
		wv.classList.add('is-open');
		wv.setAttribute('aria-hidden', 'false');
		gsap.set(state.grid, { scale: 0.4 });
		const s = state;
		// Проявление без рывков, в два шага. Сначала поверх страницы проявляется тёмный фон слоя (сетка под
		// сплошной тёмной «вуалью»), пока снимки раздела декодируются. Затем вуаль плавно уходит и открывает сетку.
		// Прозрачность меняется только у однотонных слоёв: смешивать полупрозрачную сетку из крупных снимков
		// со страницей видеокарта не успевает — отсюда были рывки
		gsap.set(wv, { autoAlpha: 0 });
		gsap.set(s.veil, { autoAlpha: 1 });
		const fadeBg = new Promise((r) => gsap.to(wv, { autoAlpha: 1, duration: T.bg, ease: SOFT, onComplete: r }));
		Promise.all([fadeBg, ready(s.srcs, 1500)])
			// под полностью непрозрачной вуалью браузер сетку не рисует — откладывает до снятия вуали, и тогда рывки.
			// Поэтому вуаль чуть-чуть прозрачная (глазу незаметно), и несколько кадров сетка отрисовывается под ней
			.then(() => { if (state === s) gsap.set(s.veil, { opacity: 0.985 }); return frames(20); })
			.then(() => new Promise((r) => {
				if (state !== s) return r();
				gsap.to(s.veil, { autoAlpha: 0, duration: T.veil, ease: SOFT, onComplete: r });
			}))
			.then(() => {
				// «один кадр» — когда слой проявился
				if (state !== s) return;
				busy = false;
				gsap.delayedCall(T.pause, () => toggle('list'));
			});
	}

	function close() {
		if (!state || busy) return;
		busy = true;
		const s = state;
		// в виде «сеткой» сначала вуаль закрывает сетку, потом уходит тёмный фон — как при открытии, в обратном порядке
		const veiled = s.mode === 'grid'
			? new Promise((r) => gsap.to(s.veil, { autoAlpha: 1, duration: T.out, ease: SOFT, onComplete: r }))
				.then(() => { s.grid.style.visibility = 'hidden'; })
			: Promise.resolve();
		veiled.then(() => gsap.to(wv, {
			autoAlpha: 0, duration: s.mode === 'grid' ? T.bg : T.close, ease: SOFT,
			onComplete: () => {
				wv.classList.remove('is-open');
				wv.setAttribute('aria-hidden', 'true');
				wv.innerHTML = '';
				state = null;
				document.documentElement.classList.remove('wv-open');
				if (lenis) lenis.start();
				history.replaceState(null, '', location.pathname);
				busy = false;
			},
		}));
	}

	document.addEventListener('click', (e) => {
		const a = e.target.closest('.wk-card__link');
		if (a) { e.preventDefault(); open(a.dataset.genre); return; }
		if (!state) return;
		// снимок — карточкой с описанием (js/photo-card.js)
		const ph = !busy && e.target.closest('.wv__main .wv__img, .wv__columns .wv__img');
		if (ph && window.photoCard) { window.photoCard.open(ph.dataset.src, ph); return; }
		if (e.target.closest('.wv__switch-btn--grid')) toggle('grid');
		else if (e.target.closest('.wv__switch-btn--list')) toggle('list');
		else if (e.target.closest('.wv__close')) close();
		else {
			const t = e.target.closest('.wv__thumb');
			if (t) pick(+t.dataset.i);
		}
	});
	document.addEventListener('keydown', (e) => {
		if (!state || (window.photoCard && window.photoCard.isOpen)) return;
		if (e.key === 'Escape') close();
		else if (state.mode === 'list' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
			const n = state.thumbs.length;
			pick((state.cur + (e.key === 'ArrowRight' ? 1 : n - 1)) % n);
		}
	});

	// пришли по ссылке с разделом (works.html#street, с главной) — сразу просмотр раздела
	const start = location.hash.slice(1);
	if (start === 'all' || bySlug(start)) window.addEventListener('load', () => open(start), { once: true });
	else {
		if (location.hash) history.replaceState(null, '', location.pathname);
		// страница загрузилась и браузер свободен — заранее подгружаем уменьшенные копии (около 3 МБ)
		// и главные снимки разделов, а затем на несколько кадров собираем сетку «всех работ» невидимой
		// (прозрачность 0,2 %, нажатия проходят сквозь неё): видеокарта один раз отрисовывает снимки
		// и запоминает их — первое открытие раздела идёт так же плавно, как повторное
		const warm = () => {
			const list = [...new Set([...photos.map((p) => small(p.src)), ...Object.values(COVERS)])];
			list.reduce((chain, src) => chain.then(() => decode(src)), Promise.resolve()) // по одному, не мешая странице
				.then(() => {
					if (state || busy || !gsap) return;
					build('all');
					const s = state;
					wv.style.pointerEvents = 'none';
					gsap.set(wv, { autoAlpha: 0.002 });
					gsap.set(s.grid, { scale: 0.4 });
					return frames(6).then(() => {
						if (state !== s) return; // за это время открыли раздел — он уже на месте
						gsap.set(wv, { autoAlpha: 0 });
						wv.style.pointerEvents = '';
						wv.innerHTML = '';
						state = null;
					});
				});
		};
		const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
		window.addEventListener('load', () => setTimeout(() => idle(warm, { timeout: 2000 }), 1200), { once: true });
	}
})();
