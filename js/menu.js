// Меню и футер — общие для всех страниц сайта.
// Бургер в шапке открывает всплывающее окно с разделами: окно раскрывается из угла у бургера, пункты поднимаются
// по очереди; бургер становится крестиком. Закрыть — крестик, Esc или нажатие мимо окна.
// Футер (<footer data-footer>) собирается из того же списка разделов. Ссылки — здесь, в одном месте.
(() => {
	const gsap = window.gsap;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const onHome = !!document.querySelector('.parallax');
	// имя страницы без .html — на хостинге адрес бывает и с расширением, и без
	const page = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');

	// разделы сайта: на главной — якоря экранов, на других страницах — ссылки на главную к этим экранам
	const SECTIONS = [
		{ id: 'top', title: 'Главная' },
		{ id: 'about', title: 'Я фотограф' },
		{ id: 'gallery-entry', title: 'Галерея' },
		{ id: 'approach', title: 'Мой подход', page: 'approach.html' },
		{ id: 'works', title: 'Выбор за вами', page: 'works.html' },
		{ id: 'services', title: 'Кадр под настроение' },
		{ id: 'all-works', title: 'Мои работы' },
	];
	const CONTACTS = [
		{ title: 'Telegram', href: 'https://t.me/nikonovphoto', note: '@nikonovphoto' },
		{ title: 'ВКонтакте', href: 'https://vk.com/nikonovphoto' },
	];
	const DOCS = [
		{ title: 'Политика конфиденциальности', href: 'privacy.html' },
		{ title: 'Публичная оферта', href: 'offer.html' },
	];
	const hrefOf = (s) => (onHome ? `#${s.id}` : `index.html#${s.id}`);
	const isCurrent = (s) => !onHome && s.page && s.page.replace(/\.html$/, '') === page;
	const pad = (i) => String(i + 1).padStart(2, '0');
	const ext = 'target="_blank" rel="noopener"';

	// на главной — сразу к экрану (без долгой прокрутки через закреплённые экраны)
	function go(id) {
		const el = document.getElementById(id);
		if (!el) return;
		const y = el.getBoundingClientRect().top + window.scrollY;
		if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
		else window.scrollTo(0, y);
	}

	// ---------- меню ----------
	const burger = document.querySelector('.topbar__burger');
	if (burger) {
		const root = document.createElement('div');
		root.className = 'mn';
		root.id = 'site-menu';
		root.setAttribute('aria-hidden', 'true');
		root.innerHTML = `
			<div class="mn__backdrop"></div>
			<nav class="mn__card" aria-label="Меню сайта">
				<p class="mn__label">Меню</p>
				<ol class="mn__list">${SECTIONS.map((s, i) => `
					<li class="mn__item"><a class="mn__link${isCurrent(s) ? ' is-current' : ''}" href="${hrefOf(s)}" data-id="${s.id}"${isCurrent(s) ? ' aria-current="page"' : ''}>
						<span class="mn__num">${pad(i)}</span><span class="mn__line" aria-hidden="true"></span><span class="mn__title">${s.title}</span>
					</a></li>`).join('')}
				</ol>
				<div class="mn__foot mn__item">
					<a class="mn__contact" href="https://t.me/nikonovphoto" ${ext}>связаться со&nbsp;мной</a>
					<p class="mn__social">${CONTACTS.map((c) => `<a href="${c.href}" ${ext}>${c.title}</a>`).join('')}</p>
				</div>
			</nav>`;
		document.body.appendChild(root);
		burger.setAttribute('aria-controls', 'site-menu');
		burger.setAttribute('aria-expanded', 'false');
		const card = root.querySelector('.mn__card');
		const backdrop = root.querySelector('.mn__backdrop');
		const items = root.querySelectorAll('.mn__item');
		let open = false;
		let tl = null;

		const lock = (on) => {
			document.documentElement.classList.toggle('mn-open', on);
			if (window.lenis && !document.documentElement.classList.contains('ge-hold')) window.lenis[on ? 'stop' : 'start']();
		};

		function show() {
			if (open) return;
			open = true;
			root.classList.add('is-open');
			root.setAttribute('aria-hidden', 'false');
			burger.setAttribute('aria-expanded', 'true');
			burger.setAttribute('aria-label', 'Закрыть меню');
			lock(true);
			if (tl) tl.kill();
			if (!gsap || reduced) { root.classList.add('is-shown'); return; }
			// окно раскрывается из угла у бургера, пункты поднимаются по очереди — медленно и плавно
			tl = gsap.timeline()
				.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'sine.out' }, 0)
				.fromTo(card, { opacity: 0, scale: 0.94, y: -12 }, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0)
				.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 }, 0.15);
		}

		function hide(then) {
			if (!open) return;
			open = false;
			burger.setAttribute('aria-expanded', 'false');
			burger.setAttribute('aria-label', 'Открыть меню');
			const end = () => {
				root.classList.remove('is-open', 'is-shown');
				root.setAttribute('aria-hidden', 'true');
				lock(false);
				if (then) then();
			};
			if (tl) tl.kill();
			if (!gsap || reduced) { end(); return; }
			tl = gsap.timeline({ onComplete: end })
				.to(items, { opacity: 0, y: -8, duration: 0.35, ease: 'power2.in', stagger: 0.02 }, 0)
				.to(card, { opacity: 0, scale: 0.96, y: -8, duration: 0.5, ease: 'power2.in' }, 0.1)
				.to(backdrop, { opacity: 0, duration: 0.5, ease: 'sine.in' }, 0.15);
		}

		burger.addEventListener('click', () => (open ? hide() : show()));
		backdrop.addEventListener('click', () => hide());
		document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) hide(); });
		root.addEventListener('click', (e) => {
			const a = e.target.closest('.mn__link');
			if (!a) return;
			if (!onHome) { hide(); return; } // переход на другую страницу — браузер сам
			e.preventDefault();
			hide(() => go(a.dataset.id));
		});
	}

	// ---------- футер ----------
	const footer = document.querySelector('[data-footer]');
	if (footer) {
		footer.innerHTML = `
			<div class="ft__top">
				<h2 class="ft__title">Поймаем ваш кадр?</h2>
				<a class="topbar__contact ft__cta" href="https://t.me/nikonovphoto" ${ext}>заказать съёмку</a>
			</div>
			<div class="ft__grid">
				<!-- слева: логотип, под ним цитата в две строки, автор — в строку после неё -->
				<div class="ft__brand">
					<a class="ft__logo" href="${onHome ? '#top' : 'index.html'}" aria-label="nikonovphoto — ${onHome ? 'наверх' : 'на главную'}"><img src="img/hero/logo.png" alt="" width="628" height="353" loading="lazy"></a>
					<figure class="ft__quote">
						<blockquote><p><span>«Фотография помогает</span> <span>людям увидеть» <cite class="ft__author">— Энн Геддес</cite></span></p></blockquote>
					</figure>
				</div>
				<!-- разделы -->
				<nav class="ft__col ft__col--nav" aria-label="Разделы">
					<p class="ft__label">Разделы</p>
					<ul class="ft__list">${SECTIONS.map((s) => `<li><a href="${hrefOf(s)}" data-id="${s.id}">${s.title}</a></li>`).join('')}</ul>
				</nav>
				<!-- документы -->
				<div class="ft__col">
					<p class="ft__label">Документы</p>
					<ul class="ft__list">${DOCS.map((d) => `<li><a href="${d.href}"${page === d.href.replace(/.html$/, '') ? ' aria-current="page"' : ''}>${d.title}</a></li>`).join('')}</ul>
				</div>
				<!-- контакты — как «связаться со мной», друг под другом -->
				<div class="ft__col">
					<p class="ft__label">Контакты</p>
					<div class="ft__btns">${CONTACTS.map((c) => `<a class="ft__btn" href="${c.href}" ${ext}>${c.title}</a>`).join('')}</div>
				</div>
			</div>
			<!-- логотип — контуром шрифтом Tupik, в правом нижнем углу (макет Figma 947:90) -->
			<div class="ft__markrow">
				<a class="ft__mark" href="${onHome ? '#top' : 'index.html'}" aria-label="nikonovphoto — ${onHome ? 'наверх' : 'на главную'}">NIKONOVPHOTO</a>
			</div>
			<div class="ft__bottom">
				<span>© ${new Date().getFullYear()} nikonovphoto. Все права защищены.</span>
				<div class="ft__end">
				<p class="ft__social">${CONTACTS.map((c) => `<a href="${c.href}" ${ext}>${c.title === 'ВКонтакте' ? 'VK' : c.title}</a>`).join('')}</p>
				<!-- наверх — круглой кнопкой со стрелкой -->
				<a class="ft__up" href="#top" aria-label="Наверх"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></a>
				</div>
			</div>`;
		footer.addEventListener('click', (e) => {
			const a = e.target.closest('a[data-id], .ft__up, .ft__mark, .ft__logo');
			if (!a) return;
			const id = a.dataset.id || (a.classList.contains('ft__up') || (onHome && (a.classList.contains('ft__mark') || a.classList.contains('ft__logo'))) ? 'top' : null);
			if (!id) return;
			if (a.classList.contains('ft__up') && !onHome) {
				e.preventDefault();
				if (window.lenis) window.lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			if (!onHome) return;
			e.preventDefault();
			go(id);
		});
	}
})();
