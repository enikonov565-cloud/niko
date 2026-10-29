// Карточка снимка: нажатие на фото — справа выезжает панель, снимок перелетает в неё крупно и целиком;
// подпись (раздел, название, описание в две строки) — мелко, внизу слева, не отвлекает от снимка;
// нажатие мимо панели, «закрыть» или Esc — всё в обратном порядке. По мотивам joffreysp/draggable-grid (Codrops, MIT).
// Подпись берётся из js/gallery-photos.js по адресу снимка: раздел (genre), название (label), описание (alt).
// Открыть из кода: window.photoCard.open(src, элемент-откуда).
(() => {
	const gsap = window.gsap;
	if (!gsap) return;
	const photos = window.GALLERY_PHOTOS || [];
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const EASE = 'power3.inOut';
	const D = reduced ? 0 : 1.5; // перелёт снимка и выезд панели — медленно и плавно

	const root = document.createElement('div');
	root.className = 'pc';
	root.setAttribute('aria-hidden', 'true');
	root.innerHTML = `
		<div class="pc__backdrop"></div>
		<aside class="pc__panel" role="dialog" aria-modal="true" aria-labelledby="pc-title">
			<button class="pc__close" type="button">закрыть</button>
			<div class="pc__thumb"><img alt="" data-pc="img"></div>
			<div class="pc__caption">
				<p class="pc__genre"><span class="pc__mask"><span class="pc__line" data-pc="genre"></span></span></p>
				<h2 class="pc__title" id="pc-title" data-pc="title"></h2>
				<p class="pc__desc"><span class="pc__mask"><span class="pc__line" data-pc="desc"></span></span></p>
				<!-- как «связаться со мной» в шапке: Telegram с готовым сообщением про этот снимок -->
				<span class="pc__mask pc__contact-mask"><a class="pc__contact pc__line" data-pc="contact" href="https://t.me/Nikonovevgeny" target="_blank" rel="noopener">связаться с&nbsp;автором</a></span>
			</div>
		</aside>`;
	document.body.appendChild(root);
	const $ = (s) => root.querySelector(`[data-pc="${s}"]`);
	const backdrop = root.querySelector('.pc__backdrop');
	const panel = root.querySelector('.pc__panel');
	const thumb = root.querySelector('.pc__thumb');
	const img = $('img');
	// сдвиг из CSS (translateX 100%) снимаем: дальше панель двигает только xPercent
	root.classList.add('is-ready');
	gsap.set(panel, { x: 0, xPercent: 100 });

	let open = false, busy = false, from = null, fly = null;
	const lenis = () => window.lenis;

	// неразрывный пробел после коротких слов — без висячих предлогов
	const nb = (s) => String(s || '').replace(/(^|\s)([а-яёa-z]{1,2})\s/giu, '$1$2 ');
	const find = (src) => photos.find((p) => src && (src === p.src || src.endsWith('/' + p.src) || src.includes(p.src)));

	// название — по буквам в «окне»: буквы поднимаются снизу
	function setTitle(text) {
		const t = $('title');
		t.innerHTML = text.split(' ').map((w) => `<span class="pc__word">${[...w].map((ch) => `<span class="pc__ch">${ch}</span>`).join('')}</span>`).join(' ');
		return t.querySelectorAll('.pc__ch');
	}

	// снимок в панели — крупно и целиком, по его пропорциям; на телефоне ниже — место под подпись
	function fitThumb(p) {
		const r = p.w && p.h ? p.w / p.h : 1.5;
		const phone = window.innerWidth < 768;
		const pad = parseFloat(getComputedStyle(panel).paddingLeft) || 0;
		const maxW = phone ? panel.clientWidth - pad * 2 : panel.clientWidth * 0.7;
		const maxH = window.innerHeight * (phone ? 0.6 : 0.84);
		const w = Math.min(maxW, maxH * r);
		thumb.style.width = `${w}px`;
		thumb.style.height = `${w / r}px`;
	}

	function show(src, el) {
		if (open || busy) return;
		const p = find(src) || { src, alt: (el && el.getAttribute('aria-label')) || '', label: '', genre: '' };
		busy = true; open = true;
		from = el || null;
		$('genre').textContent = p.genre || 'Снимок';
		const chars = setTitle(p.label || p.alt || 'Без названия');
		$('desc').textContent = nb(p.alt ? `${p.alt.replace(/[.\s]+$/, '')}.` : '');
		const what = p.label ? `«${p.label}»` : '';
		$('contact').href = `https://t.me/Nikonovevgeny?text=${encodeURIComponent(`Здравствуйте! На сайте понравился снимок ${what}${p.genre ? ` (${p.genre.toLowerCase()})` : ''} — хочу обсудить съёмку.`)}`;
		img.src = p.src;
		img.alt = p.alt || '';
		root.classList.add('is-open');
		root.setAttribute('aria-hidden', 'false');
		document.documentElement.classList.add('pc-open');
		if (lenis()) lenis().stop();

		// где снимок окажется в панели — замер в конечном положении
		gsap.set(panel, { xPercent: 0 });
		fitThumb(p);
		const to = thumb.getBoundingClientRect();
		gsap.set(panel, { xPercent: 100 });
		gsap.set(img, { opacity: 0 });

		const lines = root.querySelectorAll('.pc__line');
		gsap.set(chars, { yPercent: 110 });
		gsap.set(lines, { yPercent: 110 });
		const tl = gsap.timeline({ onComplete: () => { busy = false; } });
		tl.to(backdrop, { opacity: 1, duration: D, ease: EASE }, 0)
			.to(panel, { xPercent: 0, duration: D, ease: EASE }, 0)
			.to(chars, { yPercent: 0, duration: reduced ? 0 : 1.1, ease: EASE, stagger: reduced ? 0 : 0.02 }, reduced ? 0 : 0.5)
			.to(lines, { yPercent: 0, duration: reduced ? 0 : 1.1, ease: EASE, stagger: reduced ? 0 : 0.05 }, reduced ? 0 : 0.6);

		// снимок перелетает со своего места в панель (копия поверх всего — страница не сдвигается)
		const a = el && el.getBoundingClientRect();
		if (a && a.width && !reduced) {
			fly = document.createElement('img');
			fly.className = 'pc__fly';
			fly.src = p.src;
			fly.alt = '';
			Object.assign(fly.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
			root.appendChild(fly);
			tl.to(fly, {
				left: to.left, top: to.top, width: to.width, height: to.height, duration: D, ease: EASE,
				onComplete: () => { gsap.set(img, { opacity: 1 }); if (fly) { fly.remove(); fly = null; } },
			}, 0);
		} else {
			tl.to(img, { opacity: 1, duration: reduced ? 0 : 1.2, ease: 'sine.inOut' }, reduced ? 0 : 0.4);
		}
	}

	function hide() {
		if (!open || busy) return;
		busy = true;
		const chars = root.querySelectorAll('.pc__ch');
		const lines = root.querySelectorAll('.pc__line');
		const tl = gsap.timeline({
			onComplete: () => {
				root.classList.remove('is-open');
				root.setAttribute('aria-hidden', 'true');
				document.documentElement.classList.remove('pc-open');
				if (lenis() && !document.documentElement.classList.contains('wv-open')) lenis().start();
				if (fly) { fly.remove(); fly = null; }
				gsap.set(img, { opacity: 0 });
				open = false; busy = false;
			},
		});
		tl.to(chars, { yPercent: 110, duration: reduced ? 0 : 0.6, ease: EASE, stagger: { amount: reduced ? 0 : 0.02, from: 'end' } }, 0)
			.to(lines, { yPercent: 110, duration: reduced ? 0 : 0.6, ease: EASE, stagger: reduced ? 0 : 0.05 }, 0)
			.to(panel, { xPercent: 100, duration: D, ease: EASE }, reduced ? 0 : 0.3)
			.to(backdrop, { opacity: 0, duration: D, ease: EASE }, reduced ? 0 : 0.3);
		// снимок возвращается на своё место, если оно видно на экране
		const b = from && from.getBoundingClientRect();
		const visible = b && b.width && b.bottom > 0 && b.top < window.innerHeight;
		if (visible && !reduced) {
			const t = thumb.getBoundingClientRect();
			fly = document.createElement('img');
			fly.className = 'pc__fly';
			fly.src = img.src;
			fly.alt = '';
			Object.assign(fly.style, { left: `${t.left}px`, top: `${t.top}px`, width: `${t.width}px`, height: `${t.height}px` });
			root.appendChild(fly);
			gsap.set(img, { opacity: 0 });
			tl.to(fly, { left: b.left, top: b.top, width: b.width, height: b.height, duration: D, ease: EASE }, 0.3)
				.to(fly, { opacity: 0, duration: 0.5, ease: 'sine.inOut' }, 0.3 + D - 0.25);
		}
	}

	backdrop.addEventListener('click', hide);
	panel.addEventListener('click', (e) => { if (e.target === panel) hide(); });
	root.querySelector('.pc__close').addEventListener('click', hide);
	document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { e.stopImmediatePropagation(); hide(); } }, true);
	// какие снимки на страницах открываются карточкой: «Мои работы» на главной, плёнки «Моментов»,
	// полароиды «Кадра под настроение» и всё с атрибутом data-card (просмотр раздела вызывает photoCard.open сам)
	const PHOTOS = '.wa__item img, .film__frame img, .svc__polaroid img, [data-card]';
	document.addEventListener('click', (e) => {
		const el = e.target.closest(PHOTOS);
		if (!el || open) return;
		const pic = el.tagName === 'IMG' ? el : el.querySelector('img') || el;
		const src = el.dataset.card || pic.getAttribute('src');
		if (!src) return;
		e.preventDefault();
		show(src, pic);
	});
	window.addEventListener('resize', () => { if (open && !busy) fitThumb(find(img.getAttribute('src')) || {}); });

	window.photoCard = { open: show, close: hide, get isOpen() { return open; } };
})();
