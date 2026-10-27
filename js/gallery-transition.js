// Вход в галерею-комнату и выход из неё (главная) — как в codrops/KineticTypePageTransition (MIT):
// нажатие — элементы экрана гаснут, слой поворачивается на −90° и растёт в 2,7 раза, под ним открывается новый экран;
// «назад» — тот же путь в обратном порядке.
// Порядок: «Я фотограф» — обычная прокрутка → экран «Добро пожаловать!» с пишущейся цитатой →
// нажатие на приглашение (или новый жест прокрутки вниз) — полёт камеры по сцене с переворотом экрана → зал.
// Прокрутка из зала вверх — обратный полёт с переворотом к цитате, дальше снова обычная прокрутка.
// Зал не поворачивается (картины на месте), «Мой подход» не затронут.
//
// На экране с цитатой страница стоит (прокрутка Lenis остановлена), а жесты ловятся напрямую — колесо, касание,
// клавиши. Полёт запускает только НОВЫЙ жест: хвост инерции того жеста, которым сюда приехали, его не запускает —
// иначе ручка не успевала бы написать цитату, а полёт начинался сам.
(() => {
	const gsap = window.gsap;
	const backdrop = document.querySelector('.gt');
	const room = document.querySelector('.room');
	const entry = document.querySelector('.ge');
	const pin = entry && entry.querySelector('.ge__pin');
	const invite = entry && entry.querySelector('.ge__invite');
	if (!gsap || !backdrop || !room || !pin) return;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const top = (el) => el.getBoundingClientRect().top + window.scrollY;
	const vh = () => window.innerHeight;
	// где мы: выше экрана с цитатой («Я фотограф»), на нём или в зале и ниже
	const zoneNow = () => {
		const y = window.scrollY;
		if (y < top(entry) - vh() * 0.5) return 'pre';
		return y < top(room) - vh() * 0.5 ? 'entry' : 'room';
	};
	let zone = 'pre';
	let busy = false;
	let lastY = window.scrollY;

	const jump = (y) => {
		if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
		else window.scrollTo(0, y);
	};
	const hold = (on) => {
		if (window.lenis) window.lenis[on ? 'stop' : 'start']();
		document.documentElement.classList.toggle('ge-hold', on);
	};
	const flight = () => (window.galleryEntry && window.galleryEntry.flight) || { p: 0 };
	const FLY = 0.72; // докуда долетает камера по пути облёта (js/gallery-entry.js)

	// ---------- жесты на экране с цитатой ----------
	// колесо: новый жест — первое событие после паузы 300 мс (инерция тачпада и мыши идёт без пауз);
	// касание: направление — по сдвигу пальца больше 40 px; клавиши — стрелки, PageUp/PageDown, пробел
	let lastWheel = 0;
	let stoodAt = 0; // когда встали на цитату: первые 1,2 с жесты не считаются — страница только что доехала
	let touchY = null;
	const act = (dir) => { if (zone !== 'entry' || busy) return; if (dir > 0) enter(); else leaveUp(); };
	window.addEventListener('wheel', (e) => {
		if (zone !== 'entry') return;
		e.preventDefault();
		const now = performance.now();
		const gap = now - lastWheel;
		lastWheel = now;
		if (gap >= 300 && now - stoodAt > 1200 && Math.abs(e.deltaY) >= 4) act(Math.sign(e.deltaY));
	}, { passive: false, capture: true });
	window.addEventListener('touchstart', (e) => { if (zone === 'entry') touchY = e.touches[0].clientY; }, { passive: true });
	window.addEventListener('touchmove', (e) => {
		if (zone !== 'entry') return;
		e.preventDefault();
		if (touchY == null) return;
		const dy = touchY - e.touches[0].clientY;
		if (Math.abs(dy) > 40) { touchY = null; act(Math.sign(dy)); }
	}, { passive: false });
	window.addEventListener('touchend', () => { touchY = null; }, { passive: true });
	window.addEventListener('keydown', (e) => {
		if (zone !== 'entry' || busy || (e.target.closest && e.target.closest('input, textarea'))) return;
		if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); act(1); }
		else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); act(-1); }
	});

	// встали на экран с цитатой: страница стоит, ждём новый жест
	function standOnEntry() {
		zone = 'entry';
		jump(top(entry));
		hold(true);
		lastWheel = stoodAt = performance.now(); // хвост инерции прошлого жеста не считается
		touchY = null;
	}

	function done(next) {
		entry.classList.remove('is-flipping');
		gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
		gsap.set(backdrop, { autoAlpha: 0 });
		busy = false;
		if (next === 'entry') standOnEntry();
		else { zone = next; hold(false); }
		lastY = window.scrollY;
	}

	// вход: приглашение гаснет, камера летит по сцене, экран поворачивается и, увеличиваясь, улетает — открывается зал
	function enter() {
		if (busy || zone !== 'entry') return;
		busy = true;
		hold(true);
		jump(top(entry)); // экран с цитатой — ровно в кадре
		if (reduced) { jump(top(room)); done('room'); return; }
		const f = flight();
		entry.classList.add('is-flipping');
		gsap.set(pin, { transformOrigin: '50% 50%' });
		gsap.set(backdrop, { autoAlpha: 0 });
		// медленно и плавно: мягкий разгон и торможение, части движения перетекают одна в другую
		gsap.timeline({ onComplete: () => done('room') })
			// облёт сцены — долго, чтобы её успели рассмотреть; переворот и уход — в самом конце
			.to(f, { p: FLY, duration: 9, ease: 'sine.inOut' }, 0)
			.to(pin, { rotate: -90, scale: 2.7, duration: 2.6, ease: 'sine.inOut' }, 7.0)
			.to(backdrop, { autoAlpha: 1, duration: 1.6, ease: 'sine.inOut' }, 7.4)
			.to(pin, { autoAlpha: 0, duration: 1.2, ease: 'sine.in' }, 8.4)
			.add(() => {
				entry.classList.remove('is-flipping');
				gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
				f.p = 0;
				jump(top(room));
			}, 9.65)
			.to(backdrop, { autoAlpha: 0, duration: 1.6, ease: 'sine.inOut' }, 9.7);
	}

	// назад: зал гаснет, экран с цитатой возвращается из поворота, камера летит обратно к плоской странице
	function back() {
		if (busy || zone !== 'room') return;
		busy = true;
		hold(true);
		if (reduced) { done('entry'); return; }
		const f = flight();
		gsap.set(backdrop, { autoAlpha: 0 });
		gsap.timeline({ onComplete: () => done('entry') })
			.to(backdrop, { autoAlpha: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
			.add(() => {
				jump(top(entry));
				f.p = FLY;
				entry.classList.add('is-flipping');
				gsap.set(pin, { transformOrigin: '50% 50%', rotate: -90, scale: 2.7, autoAlpha: 0 });
			}, 1.45)
			.to(pin, { autoAlpha: 1, duration: 1.2, ease: 'sine.out' }, 1.45)
			.to(pin, { rotate: 0, scale: 1, duration: 2.6, ease: 'sine.inOut' }, 1.45)
			.to(backdrop, { autoAlpha: 0, duration: 1.6, ease: 'sine.inOut' }, 2.2)
			.to(f, { p: 0, duration: 8, ease: 'sine.inOut' }, 1.8); // обратный облёт — так же неторопливо
	}

	// с цитаты вверх — снова обычная прокрутка к «Я фотограф»
	function leaveUp() {
		if (busy || zone !== 'entry') return;
		zone = 'pre';
		busy = true; // пока страница уезжает вверх, обратно на цитату её не тянет
		hold(false);
		const y = Math.max(0, top(entry) - vh() * 0.7);
		const free = () => { busy = false; lastY = window.scrollY; };
		if (window.lenis) window.lenis.scrollTo(y, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3), force: true, lock: true, onComplete: free });
		else { window.scrollTo(0, y); free(); }
	}

	if (invite) invite.addEventListener('click', enter);

	// с «Я фотограф» вниз — страница доезжает до экрана с цитатой и встаёт на нём
	function arrive() {
		busy = true;
		const settle = () => { busy = false; standOnEntry(); };
		if (window.lenis) window.lenis.scrollTo(top(entry), { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, force: true, onComplete: settle });
		else { jump(top(entry)); settle(); }
	}

	// ---------- прокрутка вне экрана с цитатой ----------
	let widthAt = window.innerWidth;
	let resizedAt = 0;
	const check = () => {
		if (busy || zone === 'entry') return;
		const y = window.scrollY;
		if (performance.now() - resizedAt < 600) { lastY = y; return; }
		// скачок прокрутки больше экрана за раз — не жест (браузер вернул прокрутку после перезагрузки, переход по ссылке)
		const jumpBy = Math.abs(y - lastY);
		lastY = y;
		if (jumpBy > vh() * 1.2) { zone = zoneNow(); if (zone === 'entry') standOnEntry(); return; }
		if (zone === 'pre') {
			if (y > top(entry) - vh() * 0.5) arrive();
		} else if (zone === 'room' && y < top(room) - vh() * 0.12) back();
	};
	if (window.lenis) window.lenis.on('scroll', check);
	else window.addEventListener('scroll', check, { passive: true });
	// меняется только ширина — поворот экрана или другое окно; панель адреса на телефоне меняет лишь высоту
	// и переходы не трогает, иначе прокрутка вверх в зале не запускала бы обратный путь
	window.addEventListener('resize', () => {
		if (window.innerWidth === widthAt) return;
		widthAt = window.innerWidth;
		resizedAt = performance.now();
		if (busy) return;
		if (zone === 'entry') jump(top(entry));
		else { zone = zoneNow(); if (zone === 'entry') standOnEntry(); }
	});
	// после загрузки (браузер мог вернуть прежнюю прокрутку, высоты экранов уже точные) — где мы на самом деле
	const sync = () => { if (busy) return; zone = zoneNow(); lastY = window.scrollY; if (zone === 'entry') standOnEntry(); };
	sync();
	window.addEventListener('load', sync, { once: true });
})();
