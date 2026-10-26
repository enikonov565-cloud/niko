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
		btn.addEventListener('click', () => choose(i));
		li.appendChild(btn);
		menu.appendChild(li);
		return btn;
	});

	// номера жанров над меню — как у слайдов на странице «Мой подход»; на компьютере номера и меню в одной колонке
	const dock = document.createElement('div');
	dock.className = 'svc__dock';
	const nums = document.createElement('nav');
	nums.className = 'svc__nums';
	nums.setAttribute('aria-label', 'Жанры по номерам');
	const bullets = data.map((s, i) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'svc__num';
		b.setAttribute('aria-label', s.title);
		b.innerHTML = `<span class="svc__num-text">${String(i + 1).padStart(2, '0')}</span><span class="svc__num-line"></span>`;
		b.addEventListener('click', () => choose(i));
		nums.appendChild(b);
		return b;
	});
	menu.before(dock);
	dock.append(nums, menu);

	menu.addEventListener('keydown', (ev) => {
		const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[ev.key];
		if (!step) return;
		ev.preventDefault();
		const next = (current + step + tabs.length) % tabs.length;
		choose(next);
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

	function fillPhotos(s, set = sets[shown]) {
		set.forEach((fig, k) => {
			const p = s.photos[k];
			const img = fig.querySelector('img');
			fig.classList.toggle('is-tall', p.h > p.w);
			img.width = p.w;
			img.height = p.h;
			img.src = p.src;
			img.alt = p.alt || '';
		});
		placePhotos(s, set);
	}

	// раскладка двух снимков: верхний слева, нижний правее и ниже — заходит только на угол верхнего,
	// главное в кадре не закрывает. Размер — самый крупный, что помещается между панелью и меню (на телефоне — в полосу снимков)
	const photosBox = root.querySelector('.svc__photos');
	const panel = root.querySelector('.svc__panel');
	const OVERLAP = 0.2;  // нижний снимок заходит на 20% ширины верхнего — на край, не на середину
	const DROP = 0.32;    // и начинается на 32% его высоты
	// два комплекта полароидов: при смене жанра старые уходят, а новые уже приходят — как слайды «Моего подхода»
	const sets = [frames, frames.map((fig) => photosBox.appendChild(fig.cloneNode(true)))];
	let shown = 0;
	if (gsap) gsap.set(sets[1], { autoAlpha: 0 });
	function placePhotos(s = data[current], set = sets[shown]) {
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
		place(set[0], x0, top, wA);
		place(set[1], x0 + wA * (1 - OVERLAP), top + (h + padY) * DROP, wB);
	}
	if (window.ResizeObserver) new ResizeObserver(() => placePhotos()).observe(root);

	// телефон и планшет: меню — внутри бирюзовой плашки, колонкой справа от описания (css/services.css);
	// на компьютере — отдельной карточкой справа внизу экрана
	const infoEl = root.querySelector('.svc__info');
	const narrow = window.matchMedia('(max-width: 1023px)');
	const moveMenu = () => {
		if (narrow.matches) {
			if (menu.parentElement !== infoEl) infoEl.appendChild(menu);
		} else if (menu.parentElement !== dock) {
			dock.append(nums, menu);
		}
	};
	moveMenu();
	narrow.addEventListener('change', () => { moveMenu(); placePhotos(); });

	// снимки следующих жанров — заранее, чтобы смена не ждала загрузки
	const preload = () => data.forEach((s) => s.photos.forEach((p) => { const im = new Image(); im.src = p.src; }));

	let current = -1;
	let busy = false; // идёт смена жанра — следующая начнётся после неё
	let want = 0;     // жанр, к которому прокрутили
	const settle = () => { busy = false; if (want !== current) select(want); };

	function select(i) {
		if (i === current || busy) return;
		const first = current < 0;
		const from = current;
		if (!first) {
			tabs[current].setAttribute('aria-pressed', 'false');
			bullets[current].classList.remove('is-current');
		}
		current = i;
		tabs[i].setAttribute('aria-pressed', 'true');
		bullets[i].classList.add('is-current');
		status.textContent = `${data[i].title}: ${data[i].price}`;

		if (first || !gsap || reduced) {
			fillInfo(data[i]);
			fillPhotos(data[i]);
			return;
		}

		// переход — тот же, что у слайдов блока «Мой подход» (js/approach.js): снимки уходят вверх (назад — вниз),
		// вытягиваясь, новые приходят с другой стороны; строки текста уезжают под маску и выплывают из-под неё по очереди
		busy = true;
		const s = i > from ? 1 : -1;
		const out = sets[shown];
		shown = 1 - shown;
		const inc = sets[shown];
		// новый комплект скрыт, пока не придёт его время, — иначе он висел бы у края экрана
		gsap.set(inc, { autoAlpha: 0, zIndex: 2 });
		gsap.set(out, { zIndex: 1 });
		fillPhotos(data[i], inc);
		// переход начинается, когда новые снимки готовы, — иначе на миг мелькнули бы кадры прошлого жанра
		const ready = inc.map((fig) => {
			const img = fig.querySelector('img');
			return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
		});
		Promise.race([Promise.all(ready), new Promise((r) => setTimeout(r, 700))]).then(() => play(i, s, out, inc));
	}

	function play(i, s, out, inc) {
		// строки описания: жанр, цена, текст и каждый пункт списка отдельно
		const lines = () => [info.name, info.price, info.text, ...info.list.children];
		const before = lines();
		// маска — clip-path на самой строке: видна только часть, что осталась в её прежней рамке
		const clip = (top, bottom) => `inset(${top}% 0% ${bottom}% 0%)`;
		const tl = gsap.timeline({
			onComplete: () => {
				gsap.set(out, { autoAlpha: 0 });
				gsap.set(lines(), { clearProps: 'clipPath,transform' });
				settle();
			},
		})
			// уходящие снимки — вверх (или вниз), вытягиваясь
			.to(out, { yPercent: -185 * s, scaleY: 1.5, duration: 1.2, ease: 'expo.inOut', stagger: 0.07 }, 0)
			// и гаснут на ходу — к приходу новых от прошлых снимков ничего не остаётся
			.to(out, { autoAlpha: 0, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, 0.2)
			.fromTo(before, { yPercent: 0, clipPath: clip(0, 0) },
				{ yPercent: -105 * s, clipPath: s > 0 ? clip(100, 0) : clip(0, 100), duration: 1, ease: 'power4.inOut', stagger: 0.05 }, 0)
			// новые снимки приходят с другой стороны; до своего начала не показываются
			.fromTo(inc, { yPercent: 150 * s, scaleY: 1.5, autoAlpha: 1 },
				{ yPercent: 0, scaleY: 1, duration: 1.3, ease: 'expo.out', stagger: 0.07, immediateRender: false }, 0.9)
			.add(() => {
				fillInfo(data[i]);
				tl.fromTo(lines(), { yPercent: 105 * s, clipPath: s > 0 ? clip(0, 100) : clip(100, 0) },
					{ yPercent: 0, clipPath: clip(0, 0), duration: 1.2, ease: 'power4.out', stagger: 0.07 }, 1.1);
			}, 1.1);
	}

	// компьютер: экран закреплён, жанр выбирает прокрутка — каждому жанру своя доля высоты блока (как «Мой подход»)
	root.style.setProperty('--svc-n', data.length);
	const desk = window.matchMedia('(min-width: 1024px)');
	const ST = window.ScrollTrigger;
	const n = data.length;
	const request = (i) => { want = i; if (!busy) select(want); };
	// у каждого жанра своя точка прокрутки: первый — в начале блока, последний — в конце
	const startY = () => root.getBoundingClientRect().top + window.scrollY;
	const span = () => root.offsetHeight - window.innerHeight;
	const pointY = (i) => startY() + (i / (n - 1)) * span();
	if (ST) {
		ST.create({
			trigger: root,
			start: 'top top',
			end: 'bottom bottom',
			onUpdate: (self) => { if (desk.matches) request(Math.round(self.progress * (n - 1))); },
		});
	}
	// прокрутка остановилась между жанрами — страница плавно доезжает до ближайшего, ничего не застревает на полпути
	if (window.lenis) {
		let snapTimer = 0;
		window.lenis.on('scroll', () => {
			clearTimeout(snapTimer);
			snapTimer = setTimeout(() => {
				if (!desk.matches) return;
				const y = window.scrollY;
				const p = (y - startY()) / span();
				if (p <= 0 || p >= 1) return;
				const target = pointY(Math.round(p * (n - 1)));
				if (Math.abs(target - y) > 2) window.lenis.scrollTo(target, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3) });
			}, 180);
		});
	}
	// клик по жанру или номеру: на компьютере — прокрутка к его точке, иначе — сразу смена
	function choose(i) {
		if (!desk.matches || !ST) { request(i); return; }
		if (window.lenis) window.lenis.scrollTo(pointY(i), { duration: 1.2 });
		else window.scrollTo({ top: pointY(i), behavior: 'smooth' });
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
