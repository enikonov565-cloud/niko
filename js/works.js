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

	// ---------- «Мои работы» на главной: все снимки в шахматном порядке ----------
	// колонки через одну опущены (CSS); каждый кадр — в самую короткую колонку, в своих пропорциях, без обрезки
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
			allGrid.innerHTML = cols.map((c) => `<div class="wa__col">${c.html}</div>`).join('');
			// кадры проявляются при прокрутке — медленно и плавно
			if ('IntersectionObserver' in window && !reduced) {
				const io = new IntersectionObserver((entries) => entries.forEach((e) => {
					if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
				}), { rootMargin: '0px 0px -8% 0px' });
				allGrid.querySelectorAll('.wa__item').forEach((el) => io.observe(el));
			} else allGrid.querySelectorAll('.wa__item').forEach((el) => el.classList.add('is-in'));
		};
		buildAll();
		window.addEventListener('resize', buildAll);
		// «все работы» на главной — плавно к этому блоку
		document.addEventListener('click', (e) => {
			const a = e.target.closest('a[href="#all-works"]');
			if (!a) return;
			e.preventDefault();
			const target = document.querySelector('#all-works');
			if (window.lenis) window.lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 3) });
			else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
		});
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
		const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
		requestAnimationFrame(raf);
	}

	const COLS = 6, ROWS = 5; // как в демо: 6 колонок по 5 кадров
	const FLIP_AT = [3, 0];   // главный кадр — первый в четвёртой колонке (едет вниз и встаёт в центр)
	const PUSH_AT = [2, 4];   // соседний — последний в третьей колонке (едет вверх и встаёт слева)
	const bg = (p) => `background-image:url('${p.src}')`;
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
				items += `<figure class="wv__item"><div class="wv__wrap${cls}"><div class="wv__img" style="${bg(p)}" role="img" aria-label="${esc(p.alt)}"></div></div></figure>`;
			}
			cols += `<div class="wv__col wv__col--${c % 2 ? 'down' : 'up'}"><div class="wv__inner">${items}</div></div>`;
		}
		const thumbs = [cover, ...rest];
		wv.innerHTML = `
			<div class="wv__columns">${cols}</div>
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
			grid: q('.wv__columns'),
			up: wv.querySelectorAll('.wv__col--up > .wv__inner'),
			down: wv.querySelectorAll('.wv__col--down > .wv__inner'),
			content: q('.wv__content'), main: q('.wv__main'),
			nav: q('.wv__nav'), navItems: wv.querySelectorAll('.wv__thumb'),
			flip, flipParent: flip.parentNode, flipImg: flip.querySelector('.wv__img'),
			push: q('.wv__wrap--push'),
			btn: { grid: q('.wv__switch-btn--grid'), list: q('.wv__switch-btn--list') },
		};
		state.btn.grid.classList.add('is-current');
	}

	// «один кадр»: колонки разъезжаются, главный кадр раскрывается на весь экран, миниатюры выезжают
	const showList = () => {
		const s = state;
		return gsap.timeline({ defaults: { duration: 1.7, ease: 'power2.inOut' }, onStart: () => s.content.classList.add('is-current') })
			.addLabel('start', 0)
			.fromTo(s.grid, { scale: 0.4 }, { scale: 1 }, 'start')
			.to(s.up, { y: '-200vh' }, 'start')
			.to(s.down, { y: '200vh' }, 'start')
			.addLabel('flip', 1.7)
			.add(() => {
				const st = Flip.getState(s.flip);
				s.main.appendChild(s.flip);
				Flip.from(st, { duration: 1, ease: 'power4' });
				gsap.set(s.nav, { opacity: 1 });
			}, 'flip')
			.to(s.push, { duration: 1, ease: 'power4', xPercent: -100 }, 'flip')
			.fromTo(s.navItems, { yPercent: 200, opacity: 0 }, { duration: 0.7, ease: 'power4', stagger: 0.03, yPercent: 0, opacity: 1 }, 'flip');
	};

	// «сеткой»: всё возвращается обратно
	const showGrid = () => {
		const s = state;
		return gsap.timeline({ defaults: { duration: 1.7, ease: 'power2.inOut' }, onStart: () => s.content.classList.remove('is-current') })
			.addLabel('flip', 0)
			.to(s.navItems, { duration: 0.7, stagger: -0.03, yPercent: 200, opacity: 0 }, 'flip')
			.to(s.push, { duration: 1, xPercent: 0 }, 'flip')
			.add(() => {
				const st = Flip.getState(s.flip);
				s.flipParent.appendChild(s.flip);
				Flip.from(st, { duration: 1, ease: 'power2.inOut' });
			}, 'flip')
			.addLabel('columns', 1)
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
		gsap.to(s.flipImg, {
			opacity: 0, duration: reduced ? 0 : 0.6, ease: 'sine.in',
			onComplete: () => {
				s.flipImg.style.backgroundImage = `url('${p.src}')`;
				s.flipImg.setAttribute('aria-label', p.alt);
				gsap.to(s.flipImg, { opacity: 1, duration: reduced ? 0 : 0.8, ease: 'sine.out' });
			},
		});
	}

	function open(slug) {
		if (busy || !gsap || !Flip) return;
		busy = true;
		build(slug);
		history.replaceState(null, '', `#${state.slug}`);
		if (lenis) lenis.stop();
		document.documentElement.classList.add('wv-open');
		wv.classList.add('is-open');
		wv.setAttribute('aria-hidden', 'false');
		gsap.set(state.grid, { scale: 0.4 });
		gsap.fromTo(wv, { autoAlpha: 0 }, {
			autoAlpha: 1, duration: reduced ? 0 : 0.9, ease: 'sine.inOut',
			onComplete: () => { busy = false; gsap.delayedCall(reduced ? 0 : 0.25, () => toggle('list')); },
		});
	}

	function close() {
		if (!state || busy) return;
		busy = true;
		gsap.to(wv, {
			autoAlpha: 0, duration: reduced ? 0 : 0.9, ease: 'sine.inOut',
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
		});
	}

	document.addEventListener('click', (e) => {
		const a = e.target.closest('.wk-card__link');
		if (a) { e.preventDefault(); open(a.dataset.genre); return; }
		if (!state) return;
		if (e.target.closest('.wv__switch-btn--grid')) toggle('grid');
		else if (e.target.closest('.wv__switch-btn--list')) toggle('list');
		else if (e.target.closest('.wv__close')) close();
		else {
			const t = e.target.closest('.wv__thumb');
			if (t) pick(+t.dataset.i);
		}
	});
	document.addEventListener('keydown', (e) => {
		if (!state) return;
		if (e.key === 'Escape') close();
		else if (state.mode === 'list' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
			const n = state.thumbs.length;
			pick((state.cur + (e.key === 'ArrowRight' ? 1 : n - 1)) % n);
		}
	});

	// пришли по ссылке с разделом (works.html#street, с главной) — сразу просмотр раздела
	const start = location.hash.slice(1);
	if (start === 'all' || bySlug(start)) window.addEventListener('load', () => open(start), { once: true });
	else if (location.hash) history.replaceState(null, '', location.pathname);
})();
