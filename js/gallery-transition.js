// Вход в галерею-комнату и выход из неё (главная) — как в codrops/KineticTypePageTransition (MIT):
// нажатие — элементы экрана гаснут, слой поворачивается на −90° и растёт в 2,7 раза, под ним открывается новый экран;
// «назад» — тот же путь в обратном порядке.
// Порядок: «Я фотограф» — обычная прокрутка → экран «Добро пожаловать!» с пишущейся цитатой →
// нажатие на приглашение (или прокрутка вниз) — полёт камеры по сцене с переворотом экрана → зал.
// Прокрутка из зала вверх — обратный полёт с переворотом к цитате, дальше снова обычная прокрутка.
// Зал не поворачивается (картины на месте), «Мой подход» не затронут.
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
	let zone = zoneNow();
	let busy = false;
	let arrivedAt = 0; // когда страница встала на экран с цитатой — полёт не начнётся тем же жестом прокрутки

	const jump = (y) => {
		if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
		else window.scrollTo(0, y);
	};
	const hold = (on) => { if (window.lenis) window.lenis[on ? 'stop' : 'start'](); };
	const flight = () => (window.galleryEntry && window.galleryEntry.flight) || { p: 0 };
	const FLY = 0.72; // докуда долетает камера по пути облёта (js/gallery-entry.js)

	function done(next) {
		entry.classList.remove('is-flipping');
		gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
		gsap.set(backdrop, { autoAlpha: 0 });
		zone = next;
		if (next === 'entry') arrivedAt = performance.now();
		hold(false);
		busy = false;
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
			.to(f, { p: FLY, duration: 4.2, ease: 'sine.inOut' }, 0)
			.to(backdrop, { autoAlpha: 1, duration: 1.6, ease: 'sine.inOut' }, 2.0)
			.to(pin, { rotate: -90, scale: 2.7, duration: 2.6, ease: 'sine.inOut' }, 1.8)
			.to(pin, { autoAlpha: 0, duration: 1.2, ease: 'sine.in' }, 3.2)
			.add(() => {
				entry.classList.remove('is-flipping');
				gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
				f.p = 0;
				jump(top(room));
			}, 4.45)
			.to(backdrop, { autoAlpha: 0, duration: 1.6, ease: 'sine.inOut' }, 4.5);
	}

	// назад: зал гаснет, экран с цитатой возвращается из поворота, камера летит обратно к плоской странице
	function back() {
		if (busy || zone !== 'room') return;
		busy = true;
		hold(true);
		if (reduced) { jump(top(entry)); done('entry'); return; }
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
			.to(f, { p: 0, duration: 4.0, ease: 'sine.inOut' }, 1.8);
	}

	if (invite) invite.addEventListener('click', enter);

	// с «Я фотограф» вниз — страница доезжает до экрана с цитатой и встаёт на нём
	function arrive() {
		busy = true;
		const settle = () => { zone = 'entry'; arrivedAt = performance.now(); busy = false; };
		if (window.lenis) window.lenis.scrollTo(top(entry), { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3), lock: true, force: true, onComplete: settle });
		else { jump(top(entry)); settle(); }
	}

	// прокрутка: на экране цитаты новый жест вниз — тот же вход, что и нажатие; из зала вверх — обратный путь
	let lastSeen = window.scrollY;
	const check = () => {
		if (busy) return;
		if (performance.now() - resizedAt < 600) { zone = zoneNow(); return; }
		// скачок прокрутки больше экрана за раз — не жест (браузер вернул прокрутку после перезагрузки, переход по ссылке)
		const jumpBy = Math.abs(window.scrollY - lastSeen);
		lastSeen = window.scrollY;
		if (jumpBy > vh() * 1.2) { zone = zoneNow(); return; }
		const y = window.scrollY;
		const et = top(entry);
		if (zone === 'pre') {
			if (y > et - vh() * 0.5) arrive();
		} else if (zone === 'entry') {
			if (y < et - vh() * 0.5) zone = 'pre';
			else if (y > et + vh() * 0.12) {
				if (performance.now() - arrivedAt > 900) enter();
				else if (window.lenis) window.lenis.scrollTo(et, { duration: 1, easing: (t) => 1 - Math.pow(1 - t, 3), force: true }); // тот же жест, которым приехали, — мягко возвращаем
			}
		} else if (zone === 'room' && y < top(room) - vh() * 0.12) back();
	};
	if (window.lenis) window.lenis.on('scroll', check);
	else window.addEventListener('scroll', check, { passive: true });
	// изменение размера окна сдвигает прокрутку — это не жест, переход не запускаем
	let resizedAt = 0;
	window.addEventListener('resize', () => { resizedAt = performance.now(); if (!busy) zone = zoneNow(); });
	// после загрузки (браузер мог вернуть прежнюю прокрутку, высоты экранов уже точные) — где мы на самом деле
	window.addEventListener('load', () => { if (!busy) zone = zoneNow(); });
})();
