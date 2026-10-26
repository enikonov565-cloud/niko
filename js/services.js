// «Что снимаем»: меню жанров, описание с ценой и два снимка-полароида из списка js/services-data.js,
// плюс приглушённая плёнка на фоне. Клик по жанру (или стрелки ↑ ↓ ← → в меню) меняет описание и снимки.
(() => {
	const data = window.SERVICES || [];
	const root = document.querySelector('.svc');
	if (!root || !data.length) return;

	const gsap = window.gsap;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const menu = root.querySelector('.svc__menu');
	const status = root.querySelector('[data-svc="status"]');
	const info = {
		name: root.querySelector('[data-svc="name"]'),
		text: root.querySelector('[data-svc="text"]'),
		price: root.querySelector('[data-svc="price"]'),
		list: root.querySelector('[data-svc="list"]'),
	};
	const frames = [...root.querySelectorAll('.svc__polaroid')];
	const cta = root.querySelector('[data-svc="cta"]');
	const tgBase = cta ? cta.href.split('?')[0] : '';

	// короткие предлоги и союзы не остаются в конце строки
	const glue = (t) => t.replace(/(?<=^|[\s(«])(в|во|на|у|с|со|к|ко|о|об|от|из|до|по|за|под|над|при|без|для|про|и|а|но|или|не|ни|я|что)\s+/gi, '$1 ');

	// ---------- плёнки на фоне: в каждой шесть одинаковых наборов кадров — лента длиннее плёнки и едет без шва ----------
	// у второй плёнки кадры в обратном порядке — ленты не повторяют друг друга
	const film = window.SERVICES_FILM || [];
	root.querySelectorAll('.svc__film-track').forEach((track, n) => {
		if (!film.length) return;
		const frames = n ? [...film].reverse() : film;
		for (let k = 0; k < 6; k++) {
			const set = document.createElement('div');
			set.className = 'svc__film-set';
			frames.forEach((src) => {
				const img = document.createElement('img');
				img.src = src;
				img.alt = '';
				img.loading = 'lazy';
				img.decoding = 'async';
				set.appendChild(img);
			});
			track.appendChild(set);
		}
	});

	// ---------- меню ----------
	const tabs = data.map((s, i) => {
		const li = document.createElement('li');
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'svc__tab';
		// линия у выбранного — как у слайдов на странице «Мой подход»
		const line = document.createElement('span');
		line.className = 'svc__tab-line';
		line.setAttribute('aria-hidden', 'true');
		const name = document.createElement('span');
		name.textContent = s.title;
		btn.append(line, name);
		btn.setAttribute('aria-pressed', 'false');
		btn.addEventListener('click', () => select(i));
		li.appendChild(btn);
		menu.appendChild(li);
		return btn;
	});

	menu.addEventListener('keydown', (ev) => {
		const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
		if (!step) return;
		ev.preventDefault();
		const next = (current + step + tabs.length) % tabs.length;
		select(next);
		tabs[next].focus();
	});

	// ---------- описание и снимки ----------
	function fillInfo(s) {
		// Telegram сразу с сообщением про выбранный жанр — человеку остаётся нажать «отправить»
		if (cta) {
			const msg = `Здравствуйте! Хочу заказать съёмку: ${s.title.toLowerCase()} (${s.price}). Какие даты свободны?`;
			cta.href = `${tgBase}?text=${encodeURIComponent(msg)}`;
			cta.setAttribute('aria-label', `Заказать съёмку: ${s.title}, ${s.price}`);
		}
		info.name.textContent = s.title;
		info.text.textContent = glue(s.text);
		// цена — крупная цифра, «от» и «₽» мельче (css: .svc__price-pre / -unit)
		const m = s.price.match(/^(от)\s+(.+?)\s*(₽)$/);
		info.price.textContent = '';
		if (m) {
			const pre = document.createElement('span');
			pre.className = 'svc__price-pre';
			pre.textContent = m[1];
			const unit = document.createElement('span');
			unit.className = 'svc__price-unit';
			unit.textContent = m[3];
			info.price.append(pre, m[2], unit);
		} else {
			info.price.textContent = s.price;
		}
		info.list.textContent = '';
		s.includes.forEach((t) => {
			const li = document.createElement('li');
			li.textContent = glue(t);
			info.list.appendChild(li);
		});
	}

	function fillPhotos(s) {
		frames.forEach((fig, k) => {
			const p = s.photos[k];
			const img = fig.querySelector('img');
			fig.classList.toggle('is-tall', p.h > p.w);
			img.width = p.w;
			img.height = p.h;
			img.src = p.src;
			img.alt = p.alt || '';
		});
		placePhotos(s);
	}

	// раскладка двух снимков: верхний слева, нижний правее и ниже — заходит только на угол верхнего,
	// главное в кадре не закрывает. Размер — самый крупный, что помещается между панелью и меню (на телефоне — в полосу снимков)
	const photosBox = root.querySelector('.svc__photos');
	const panel = root.querySelector('.svc__panel');
	const OVERLAP = 0.2;  // нижний снимок заходит на 20% ширины верхнего — на край, не на середину
	const DROP = 0.32;    // и начинается на 32% его высоты
	function placePhotos(s = data[current]) {
		if (!s || !photosBox) return;
		const box = photosBox.getBoundingClientRect();
		const W = box.width;
		const H = box.height;
		let left, right, top, bottom;
		if (window.innerWidth >= 1024) {
			const head = root.querySelector('.svc__head');
			// слева — сразу за текстом панели (снимок может заходить на её край), справа — до меню
			left = root.querySelector('.svc__info').getBoundingClientRect().right - box.left + W * 0.015;
			right = menu.getBoundingClientRect().left - box.left - W * 0.012;
			top = head.offsetTop + head.offsetHeight + Math.max(28, W * 0.025);
			bottom = H; // нижний может касаться края экрана, как в макете
		} else {
			left = W * 0.05;
			right = W * 0.95;
			top = H * 0.05;
			bottom = H * 0.97;
		}
		const cs = getComputedStyle(frames[0]);
		const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
		const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
		const [a, b] = s.photos.map((p) => p.w / p.h);
		// высота фото внутри рамки: по ширине и по высоте свободного места
		const byW = (right - left - padX * (2 - OVERLAP)) / (a * (1 - OVERLAP) + b);
		const byH = (bottom - top) / (1 + DROP) - padY;
		const h = Math.max(80, Math.min(byW, byH));
		const wA = h * a + padX;
		const wB = h * b + padX;
		// оба снимка — по центру свободного места
		const used = wA * (1 - OVERLAP) + wB;
		const x0 = left + Math.max(0, (right - left - used) / 2);
		const place = (fig, x, y, w) => Object.assign(fig.style, { left: `${x}px`, top: `${y}px`, width: `${w}px` });
		place(frames[0], x0, top, wA);
		place(frames[1], x0 + wA * (1 - OVERLAP), top + (h + padY) * DROP, wB);
	}
	if (window.ResizeObserver) new ResizeObserver(() => placePhotos()).observe(root);

	// телефон и планшет: меню — внутри бирюзовой плашки, колонкой справа от описания (css/services.css);
	// на компьютере — отдельной карточкой справа внизу экрана
	const infoEl = root.querySelector('.svc__info');
	const narrow = window.matchMedia('(max-width: 1023px)');
	const moveMenu = () => {
		if (narrow.matches) {
			if (menu.parentElement !== infoEl) infoEl.appendChild(menu);
		} else if (menu.parentElement !== root) {
			root.insertBefore(menu, status);
		}
	};
	moveMenu();
	narrow.addEventListener('change', () => { moveMenu(); placePhotos(); });

	// снимки следующих жанров — заранее, чтобы смена не ждала загрузки
	const preload = () => data.forEach((s) => s.photos.forEach((p) => { const im = new Image(); im.src = p.src; }));

	let current = -1;
	function select(i) {
		if (i === current) return;
		const first = current < 0;
		if (!first) tabs[current].setAttribute('aria-pressed', 'false');
		current = i;
		tabs[i].setAttribute('aria-pressed', 'true');
		status.textContent = `${data[i].title}: ${data[i].price}`;

		const parts = root.querySelectorAll('.svc__swap');
		if (first || !gsap || reduced) {
			fillInfo(data[i]);
			fillPhotos(data[i]);
			return;
		}

		gsap.killTweensOf([parts, frames]);
		gsap.timeline()
			.to(parts, { autoAlpha: 0, y: -10, duration: 0.25, ease: 'power2.in', stagger: 0.03 }, 0)
			// снимки «уносит» в сторону, новые ложатся сверху
			.to(frames, { autoAlpha: 0, x: 60, y: -30, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, 0)
			.add(() => { fillInfo(data[i]); fillPhotos(data[i]); })
			.fromTo(parts, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 })
			.fromTo(frames, { autoAlpha: 0, x: -50, y: 40 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, '<');
	}

	// снимки — под строкой заголовка: её высота зависит от того, в сколько строк лёг подзаголовок
	const head = root.querySelector('.svc__head');
	const measureHead = () => {
		if (head) root.style.setProperty('--head-b', `${head.offsetTop + head.offsetHeight}px`);
	};
	measureHead();
	// высота строки заголовка зависит от шрифта — пересчёт, когда он загрузится
	if (document.fonts) document.fonts.ready.then(() => { measureHead(); placePhotos(); });
	window.addEventListener('resize', measureHead);
	if (head && window.ResizeObserver) new ResizeObserver(measureHead).observe(head);

	select(0);
	window.addEventListener('load', preload, { once: true });
})();
