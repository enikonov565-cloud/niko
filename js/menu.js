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
		// бриф на съёмку — страница появится позже: впишите href: 'brief.html' (или адрес формы) и уберите soon (пока пункт не ссылка)
		{ id: 'brief', title: 'Бриф на съёмку', soon: true },
	];
	const CONTACTS = [
		{ title: 'Telegram', href: 'https://t.me/Nikonovevgeny', note: '@Nikonovevgeny' },
	];
	// услуги — жанры «Кадра под настроение» (js/services-data.js); на главной ссылка открывает нужный жанр
	const SERVICES = ['Портрет', 'Уличный портрет', 'Стрит-фото', 'Архитектура', 'Пейзаж'];
	const DOCS = [
		{ title: 'Политика конфиденциальности', href: 'privacy.html' },
		{ title: 'Публичная оферта', href: 'offer.html' },
	];
	const hrefOf = (s) => s.href || (onHome ? `#${s.id}` : `index.html#${s.id}`);
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
			<nav class="mn__card" aria-label="Меню сайта" data-lenis-prevent>
				<!-- на широком экране — две колонки: разделы | услуги и контакты; на телефоне — друг под другом -->
				<div class="mn__cols">
					<div class="mn__col">
						<p class="mn__label">Меню</p>
						<ol class="mn__list">${SECTIONS.map((s, i) => s.soon ? `
							<li class="mn__item"><span class="mn__link is-soon" aria-disabled="true">
								<span class="mn__num">${pad(i)}</span><span class="mn__line" aria-hidden="true"></span><span class="mn__title">${s.title}</span>
							</span></li>` : `
							<li class="mn__item"><a class="mn__link${isCurrent(s) ? ' is-current' : ''}" href="${hrefOf(s)}"${s.href ? '' : ` data-id="${s.id}"`}${isCurrent(s) ? ' aria-current="page"' : ''}>
								<span class="mn__num">${pad(i)}</span><span class="mn__line" aria-hidden="true"></span><span class="mn__title">${s.title}</span>
							</a>${s.id === 'services' ? `
								<!-- на телефоне услуги — строкой под «Кадром под настроение» (отдельный блок «Услуги» там скрыт) -->
								<p class="mn__sub"><span class="mn__num" aria-hidden="true"></span><span class="mn__line" aria-hidden="true"></span><span class="mn__subtext">${SERVICES.map((t, k) => `<span class="mn__svc"><a class="mn__sublink" href="${onHome ? '#services' : 'index.html#services'}" data-service="${k}">${t}</a>${k < SERVICES.length - 1 ? '<span class="mn__dot" aria-hidden="true">·</span>' : ''}</span>`).join(' ')}</span></p>` : ''}</li>`).join('')}
						</ol>
					</div>
					<div class="mn__col">
						<p class="mn__label">Услуги</p>
						<ul class="mn__list">${SERVICES.map((t, i) => `
							<li class="mn__item"><a class="mn__link" href="${onHome ? '#services' : 'index.html#services'}" data-service="${i}">
								<span class="mn__line" aria-hidden="true"></span><span class="mn__title">${t}</span>
							</a></li>`).join('')}
						</ul>
						<div class="mn__item mn__contacts">
							<p class="mn__label">Контакты</p>
							<p class="mn__social">${CONTACTS.map((c) => `<a class="mn__btn" href="${c.href}" ${ext}>${c.title}</a>`).join('')}</p>
						</div>
					</div>
				</div>
				<div class="mn__foot mn__item">
					<a class="mn__contact" href="https://t.me/Nikonovevgeny" ${ext}>заказать съёмку</a>
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

		// пока меню открыто, страница не прокручивается: колесо и свайп мимо окна гасятся
		// (не через overflow: hidden — иначе пропадает полоса прокрутки и страница скачком сдвигается вбок)
		const block = (e) => { if (!e.target.closest('.mn__card')) e.preventDefault(); };
		const lock = (on) => {
			document.documentElement.classList.toggle('mn-open', on);
			const listen = on ? 'addEventListener' : 'removeEventListener';
			document[listen]('wheel', block, { passive: false });
			document[listen]('touchmove', block, { passive: false });
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
			const a = e.target.closest('.mn__link, .mn__sublink');
			if (!a) return;
			if (!onHome) { hide(); return; } // переход на другую страницу — браузер сам
			e.preventDefault();
			// услуга — к «Кадру под настроение» и сразу нужный жанр
			if (a.dataset.service) {
				hide(() => {
					go('services');
					const tab = document.querySelectorAll('.svc__tab')[+a.dataset.service];
					if (tab) setTimeout(() => tab.click(), 60);
				});
				return;
			}
			hide(() => go(a.dataset.id));
		});
	}

	// ---------- футер ----------
	const footer = document.querySelector('[data-footer]');
	if (footer) {
		footer.innerHTML = `
			<!-- приглашение на съёмку: фотограф в центре из темноты, фон — коридор со снимками (js/invite-tunnel.js) -->
			<section class="inv" aria-labelledby="inv-title">
				<img class="inv__hero" src="img/about/photographer.png" alt="" width="640" height="640" loading="lazy" aria-hidden="true">
				<div class="inv__body">
					<h2 class="inv__title" id="inv-title"><span>Ваш кадр —</span> <span>следующий</span></h2>
					<p class="inv__text"><span>Расскажите, какой момент хотите сохранить, —</span> <span>подберу место, свет и&nbsp;время.</span></p>
					<button class="inv__how" type="button" aria-haspopup="dialog" aria-controls="inv-steps">как проходит съёмка <span class="inv__plus" aria-hidden="true">+</span></button>
					<a class="inv__btn" href="https://t.me/Nikonovevgeny" ${ext}><span class="inv__btn-label">записаться на&nbsp;съёмку</span><span class="inv__btn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
				</div>
			</section>
			<div class="inv-dlg" id="inv-steps" role="dialog" aria-modal="true" aria-labelledby="inv-steps-title" aria-hidden="true">
				<div class="inv-dlg__backdrop"></div>
				<div class="inv-dlg__card">
					<button class="inv-dlg__close" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
					<h3 class="inv-dlg__title" id="inv-steps-title">Как проходит съёмка</h3>
					<p class="inv-dlg__lead">Четыре шага — от первого сообщения до готовых снимков.</p>
					<ol class="inv-dlg__steps">
						<li><b>Пишете</b><span>Коротко рассказываете, что хочется снять: жанр, настроение, примерные даты.</span></li>
						<li><b>Договариваемся</b><span>Предлагаю место и время под нужный свет, отвечаю на вопросы об образе и позах.</span></li>
						<li><b>Снимаем</b><span>Спокойно, без спешки: я подсказываю, а вы остаётесь собой.</span></li>
						<li><b>Получаете снимки</b><span>Отбираю лучшие кадры, обрабатываю и присылаю ссылку на готовые файлы.</span></li>
					</ol>
					<a class="inv__btn inv__btn--wide" href="https://t.me/Nikonovevgeny" ${ext}><span class="inv__btn-label">написать в&nbsp;telegram</span><span class="inv__btn-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
				</div>
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
					<ul class="ft__list">${SECTIONS.map((s) => s.soon ? `<li><span class="ft__soon" aria-disabled="true">${s.title}</span></li>` : `<li><a href="${hrefOf(s)}"${s.href ? '' : ` data-id="${s.id}"`}>${s.title}</a></li>`).join('')}</ul>
				</nav>
				<!-- услуги -->
				<div class="ft__col">
					<p class="ft__label">Услуги</p>
					<ul class="ft__list">${SERVICES.map((t, i) => `<li><a href="${onHome ? '#services' : 'index.html#services'}" data-service="${i}">${t}</a></li>`).join('')}</ul>
				</div>
				<!-- документы и контакты — одной колонкой -->
				<div class="ft__col ft__col--docs">
					<p class="ft__label">Документы</p>
					<ul class="ft__list">${DOCS.map((d) => `<li><a href="${d.href}"${page === d.href.replace(/.html$/, '') ? ' aria-current="page"' : ''}>${d.title}</a></li>`).join('')}</ul>
					<!-- контакты — под документами, как «связаться со мной», друг под другом -->
					<div class="ft__contacts">
						<p class="ft__label ft__label--gap">Контакты</p>
						<div class="ft__btns">${CONTACTS.map((c) => `<a class="ft__btn" href="${c.href}" ${ext}>${c.title}</a>`).join('')}</div>
					</div>
				</div>
				<!-- логотип контуром (макет Figma 947:90) и над чертой — кнопка «наверх» -->
				<div class="ft__markrow">
					<a class="ft__mark" href="${onHome ? '#top' : 'index.html'}" aria-label="nikonovphoto — ${onHome ? 'наверх' : 'на главную'}">NIKONOVPHOTO</a>
					<a class="ft__up" href="#top" aria-label="Наверх"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></a>
				</div>
			</div>
			<div class="ft__bottom">
				<span>© ${new Date().getFullYear()} nikonovphoto. Все права защищены.</span>
				<p class="ft__social">${CONTACTS.map((c) => `<a href="${c.href}" ${ext}>${c.title}</a>`).join('')}</p>
			</div>`;
		// NIKONOVPHOTO — по ширине: от левого края «Разделов» до кнопки «наверх»
		const mark = footer.querySelector('.ft__mark');
		const fitMark = () => {
			if (!mark) return;
			const row = mark.parentNode;
			const up = row.querySelector('.ft__up');
			const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
			const avail = row.clientWidth - (up ? up.offsetWidth + gap : 0);
			mark.style.fontSize = '100px';
			const w = mark.getBoundingClientRect().width;
			if (w > 0) mark.style.fontSize = `${(100 * avail / w).toFixed(2)}px`;
		};
		fitMark();
		if (document.fonts) document.fonts.ready.then(fitMark);
		window.addEventListener('resize', fitMark);
		// приглашение — ровно в кадре: если прокрутка остановилась, когда оно почти целиком на экране,
		// страница плавно доезжает и встаёт ровно по нему — без полосок соседних блоков сверху и снизу
		const inv = footer.querySelector('.inv');
		if (inv) {
			let snapT = 0, snapping = false;
			const snap = () => {
				if (snapping || document.documentElement.classList.contains('mn-open')) return;
				const top = inv.getBoundingClientRect().top;
				const off = Math.abs(top);
				if (off < 2 || off > window.innerHeight * 0.3) return;
				snapping = true;
				const y = top + window.scrollY;
				const done = () => { snapping = false; };
				if (window.lenis) window.lenis.scrollTo(y, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: done });
				else { window.scrollTo({ top: y, behavior: 'smooth' }); setTimeout(done, 900); }
			};
			const onScroll = () => { clearTimeout(snapT); if (!snapping) snapT = setTimeout(snap, 160); };
			if (window.lenis) window.lenis.on('scroll', onScroll);
			else window.addEventListener('scroll', onScroll, { passive: true });
		}
		// окно «как проходит съёмка»
		const dlg = footer.querySelector('.inv-dlg');
		const how = footer.querySelector('.inv__how');
		if (dlg && how) {
			document.body.appendChild(dlg); // поверх всей страницы, не внутри футера
			const openDlg = (on) => {
				dlg.classList.toggle('is-open', on);
				dlg.setAttribute('aria-hidden', String(!on));
				if (window.lenis) window.lenis[on ? 'stop' : 'start']();
				if (on) dlg.querySelector('.inv-dlg__close').focus({ preventScroll: true }); else how.focus({ preventScroll: true });
			};
			how.addEventListener('click', () => openDlg(true));
			dlg.querySelector('.inv-dlg__close').addEventListener('click', () => openDlg(false));
			dlg.querySelector('.inv-dlg__backdrop').addEventListener('click', () => openDlg(false));
			document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && dlg.classList.contains('is-open')) openDlg(false); });
		}
		footer.addEventListener('click', (e) => {
			// услуга на главной — к «Кадру под настроение» и сразу нужный жанр
			const sv = e.target.closest('a[data-service]');
			if (sv) {
				if (!onHome) return;
				e.preventDefault();
				go('services');
				const tab = document.querySelectorAll('.svc__tab')[+sv.dataset.service];
				if (tab) setTimeout(() => tab.click(), 60);
				return;
			}
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
