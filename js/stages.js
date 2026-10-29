// «Как рождается кадр» (главная, после «Выбора за вами») — по макету Figma 648:33.
// Компьютер: снимок мальчика слева на всю высоту; скрипт ставит его так, чтобы глаз оказался в просвете между
// парами шагов (там, где в макете). Телефон: снимок фоном под текстами, глаз — крупно в просвете под названием.
// Шаги и кнопка медленно проявляются по очереди при прокрутке, снимок медленно приближается к глазу.
// Стили — css/stages.css
(() => {
	const root = document.querySelector('.st');
	if (!root) return;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const wide = window.matchMedia('(min-width: 900px)');
	const steps = [...root.querySelectorAll('.st__step')];
	const cta = root.querySelector('.st__cta');
	const img = root.querySelector('.st__photo img');

	// ---------- снимок: глаз — в просвете между парами шагов ----------
	const IMG = 1280 / 853;
	const EYE = { x: 0.461, y: 0.563 }; // где глаз на снимке (доли ширины и высоты)
	function placePhoto() {
		if (!img) return;
		const sec = root.getBoundingClientRect();
		const sw = sec.width, sh = sec.height;
		if (!wide.matches || steps.length < 3) {
			// телефон: глаз — по центру просвета между названием и первым шагом, крупно (снимок в 2,6 раза шире экрана)
			const title = root.querySelector('.st__title');
			if (!title || !steps.length) { img.removeAttribute('style'); return; }
			const ty = (title.getBoundingClientRect().bottom + steps[0].getBoundingClientRect().top) / 2 - sec.top;
			const iw = sw * 2.6, ih = iw / IMG;
			Object.assign(img.style, {
				left: `${sw * 0.5 - EYE.x * iw}px`, top: `${ty - EYE.y * ih}px`, width: `${iw}px`, height: `${ih}px`,
				transformOrigin: `${EYE.x * iw}px ${EYE.y * ih}px`,
			});
			return;
		}
		const s2 = steps[1].getBoundingClientRect(), s3 = steps[2].getBoundingClientRect();
		const tx = sw * 0.389;                                    // как в макете: 746 из 1920
		const ty = (s2.bottom + s3.top) / 2 - sec.top;            // середина просвета между парами
		// снимок закрывает блок по высоте и левый край; если глаз до цели не дотягивается — снимок чуть крупнее
		let ih = Math.max(sh, (sw * 0.843) / IMG, ty / EYE.y, (sh - ty) / (1 - EYE.y));
		let iw = ih * IMG;
		if (iw < tx / EYE.x) { iw = tx / EYE.x; ih = iw / IMG; }
		const left = Math.min(0, tx - EYE.x * iw);
		const top = Math.min(0, Math.max(sh - ih, ty - EYE.y * ih));
		Object.assign(img.style, {
			left: `${left}px`, top: `${top}px`, width: `${iw}px`, height: `${ih}px`,
			transformOrigin: `${EYE.x * iw}px ${EYE.y * ih}px`,
		});
	}

	// ---------- прокрутка ----------
	// шаг проявляется, когда его верх поднялся до 88 % высоты окна, кнопка — до 96 %
	let ticking = false;
	function update() {
		ticking = false;
		const vh = window.innerHeight;
		steps.forEach((s) => s.classList.toggle('is-in', reduced || s.getBoundingClientRect().top < vh * 0.88));
		if (cta) cta.classList.toggle('is-in', reduced || cta.getBoundingClientRect().top < vh * 0.96);
		// снимок медленно приближается к глазу, пока блок проходит экран
		if (img && !reduced) {
			const sr = root.getBoundingClientRect();
			const q = Math.min(1, Math.max(0, (vh - sr.top) / (sr.height + vh)));
			img.style.setProperty('--z', (1.1 - 0.1 * q).toFixed(4));
		}
	}
	const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
	const layout = () => { placePhoto(); update(); };

	layout();
	window.addEventListener('scroll', onScroll, { passive: true });
	let rt = 0;
	window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
	if (document.fonts) document.fonts.ready.then(layout);
	window.addEventListener('load', layout, { once: true });
})();
