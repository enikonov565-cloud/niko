// Переворот экрана «Вход в галерею» при входе в галерею-комнату и возвращении из неё (главная).
// Движение — по мотивам codrops/KineticTypePageTransition (MIT): слой поворачивается на −90° и растёт в 2,7 раза.
// Поворачивается только экран входа: при входе он уходит поворотом, а зал спокойно проступает из темноты —
// картины не двигаются; при возвращении наверх зал гаснет, экран входа возвращается обратным поворотом.
// «Мой подход» и прокрутка между залом и ним не затронуты.
(() => {
	const gsap = window.gsap;
	const backdrop = document.querySelector('.gt');
	const room = document.querySelector('.room');
	const entry = document.querySelector('.ge');
	const pin = entry && entry.querySelector('.ge__pin');
	if (!gsap || !backdrop || !room || !pin) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const roomTop = () => room.getBoundingClientRect().top + window.scrollY;
	// граница: зал показался примерно на треть — входим; ушли выше — возвращаемся ко входу
	const zoneOf = (y) => (y < roomTop() - window.innerHeight * 0.7 ? 'before' : 'room');
	let zone = zoneOf(window.scrollY);
	let busy = false;

	const jump = (y) => {
		if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
		else window.scrollTo(0, y);
	};
	const hold = (on) => { if (window.lenis) window.lenis[on ? 'stop' : 'start'](); };

	// поворот вокруг середины окна, где бы ни стоял закреплённый экран
	const centerOrigin = () => {
		const r = pin.getBoundingClientRect();
		return `50% ${Math.min(Math.max(window.innerHeight / 2 - r.top, 0), r.height)}px`;
	};

	function start() {
		busy = true;
		hold(true);
		gsap.set(backdrop, { autoAlpha: 0 });
	}
	function finish() {
		entry.classList.remove('is-flipping');
		gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
		gsap.set(backdrop, { autoAlpha: 0 });
		zone = zoneOf(window.scrollY);
		hold(false);
		busy = false;
	}

	// вход: экран с цитатой поворачивается и уходит, зал проступает из темноты на своём месте
	function enter() {
		start();
		entry.classList.add('is-flipping');
		gsap.set(pin, { transformOrigin: centerOrigin() });
		gsap.timeline({ onComplete: finish })
			.to(backdrop, { autoAlpha: 1, duration: 0.5, ease: 'power2.inOut' }, 0)
			.to(pin, { rotate: -90, scale: 2.7, duration: 1.4, ease: 'power2.inOut' }, 0)
			.to(pin, { autoAlpha: 0, duration: 0.6, ease: 'power1.in' }, 0.8)
			.add(() => {
				entry.classList.remove('is-flipping');
				gsap.set(pin, { clearProps: 'transform,transformOrigin,opacity,visibility' });
				jump(roomTop());
			}, 1.4)
			.to(backdrop, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 1.5);
	}

	// возвращение: зал гаснет на месте, экран входа выходит из поворота и встаёт
	function back() {
		start();
		gsap.timeline({ onComplete: finish })
			.to(backdrop, { autoAlpha: 1, duration: 0.6, ease: 'power2.inOut' }, 0)
			.add(() => {
				jump(roomTop() - window.innerHeight);
				entry.classList.add('is-flipping');
				gsap.set(pin, { transformOrigin: centerOrigin(), rotate: 90, scale: 2.7, autoAlpha: 0 });
			}, 0.65)
			.to(pin, { rotate: 0, scale: 1, duration: 1.4, ease: 'power2.inOut' }, 0.65)
			.to(pin, { autoAlpha: 1, duration: 0.6, ease: 'power1.out' }, 0.65)
			.to(backdrop, { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, 1.6);
	}

	const check = () => {
		if (busy) return;
		const next = zoneOf(window.scrollY);
		if (next === zone) return;
		zone = next;
		if (next === 'room') enter(); else back();
	};
	if (window.lenis) window.lenis.on('scroll', check);
	else window.addEventListener('scroll', check, { passive: true });
	window.addEventListener('resize', () => { if (!busy) zone = zoneOf(window.scrollY); });
})();
