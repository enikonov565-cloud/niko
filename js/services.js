// «Выбирайте по душе»: стена с рамками и карточка выбранного жанра из списка js/services-data.js.
// Клик по рамке или этикетке (или стрелки ← → на стене) выбирает жанр: над рамкой зажигается свет,
// карточка слева мягко сменяет текст.
(() => {
	const data = window.SERVICES || [];
	const root = document.querySelector('.svc');
	if (!root || !data.length) return;

	const gsap = window.gsap;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const wall = root.querySelector('.svc__wall');
	const card = {
		name: root.querySelector('[data-svc="name"]'),
		text: root.querySelector('[data-svc="text"]'),
		price: root.querySelector('[data-svc="price"]'),
		list: root.querySelector('[data-svc="list"]'),
	};
	const status = root.querySelector('[data-svc="status"]');

	// короткие предлоги и союзы не остаются в конце строки
	const glue = (t) => t.replace(/(?<=^|[\s(«])(в|во|на|у|с|со|к|ко|о|об|от|из|до|по|за|под|над|при|без|для|про|и|а|но|или|не|ни|я|что)\s+/gi, '$1 ');

	// ---------- стена ----------
	const items = data.map((s, i) => {
		const li = document.createElement('li');
		li.className = 'svc__item';

		const light = document.createElement('span');
		light.className = 'svc__light';
		light.setAttribute('aria-hidden', 'true');

		const frame = document.createElement('button');
		frame.type = 'button';
		frame.className = 'svc__frame';
		frame.setAttribute('aria-pressed', 'false');
		frame.setAttribute('aria-label', `${s.title}, ${s.price}`);
		const img = document.createElement('img');
		img.src = s.photo.src;
		img.alt = s.photo.alt || '';
		img.width = s.photo.w;
		img.height = s.photo.h;
		img.loading = 'lazy';
		img.decoding = 'async';
		frame.appendChild(img);

		const label = document.createElement('p');
		label.className = 'svc__label';
		label.setAttribute('aria-hidden', 'true');
		label.innerHTML = `<b></b><span></span>`;
		label.querySelector('b').textContent = s.title;
		label.querySelector('span').textContent = s.price;

		li.append(light, frame, label);
		wall.appendChild(li);

		frame.addEventListener('click', () => select(i));
		label.addEventListener('click', () => { select(i); frame.focus({ preventScroll: true }); });
		return { li, frame };
	});

	// стрелки на стене — соседний жанр
	wall.addEventListener('keydown', (ev) => {
		if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
		ev.preventDefault();
		const next = (current + (ev.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
		select(next);
		items[next].frame.focus();
	});

	// ---------- карточка ----------
	function fill(s) {
		card.name.textContent = s.title;
		card.text.textContent = glue(s.text);
		card.price.textContent = s.price;
		card.list.textContent = '';
		s.includes.forEach((t) => {
			const li = document.createElement('li');
			li.textContent = glue(t);
			card.list.appendChild(li);
		});
	}

	let current = -1;
	function select(i) {
		if (i === current) return;
		const first = current < 0;
		if (!first) {
			items[current].li.classList.remove('is-current');
			items[current].frame.setAttribute('aria-pressed', 'false');
		}
		current = i;
		items[i].li.classList.add('is-current');
		items[i].frame.setAttribute('aria-pressed', 'true');
		status.textContent = `${data[i].title}: ${data[i].price}`;

		const parts = root.querySelectorAll('.svc__swap');
		if (first || !gsap || reduced) {
			fill(data[i]);
			return;
		}
		gsap.killTweensOf(parts);
		gsap.timeline()
			.to(parts, { autoAlpha: 0, y: -10, duration: 0.25, ease: 'power2.in', stagger: 0.03 })
			.add(() => fill(data[i]))
			.fromTo(parts, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
	}

	// стартовый жанр — стрит-фото, как в середине стены
	const start = Math.min(2, items.length - 1);
	select(start);

	// телефон и планшет: стена — лента, выбранная рамка должна быть видна сразу
	const showInWall = (i) => {
		if (wall.scrollWidth <= wall.clientWidth) return;
		const pad = parseFloat(getComputedStyle(wall).paddingLeft) || 0;
		wall.scrollLeft = items[i].li.offsetLeft - pad;
	};
	showInWall(start);
	window.addEventListener('load', () => showInWall(start), { once: true });

	// над светлым экраном шапка тёмная и без затемнения под ней (класс на <html>, стили — css/services.css)
	const topbar = document.querySelector('.topbar');
	if (topbar && window.ScrollTrigger) {
		const edge = () => topbar.getBoundingClientRect().bottom + 8;
		window.ScrollTrigger.create({
			trigger: root,
			start: () => `top ${edge()}px`,
			end: () => `bottom ${topbar.getBoundingClientRect().top}px`,
			toggleClass: { targets: document.documentElement, className: 'is-light-top' },
		});
	}
})();
