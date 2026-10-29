// Фон приглашения в футере: бесконечный коридор из тонких линий, на стенах, полу и потолке — снимки,
// камера медленно и плавно летит вглубь (прокрутка страницы добавляет ход). По мотивам thebuggeddev/delphi.
// Цвета — фирменные: тёмный фон, светлые линии, снимки приглушены и проявляются из тумана.
// Центр композиции (фотограф, заголовок, кнопка) — поверх, в разметке футера (js/menu.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const host = document.querySelector('.inv');
if (host) init(host);

function init(host) {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const BG = 0x050608;     // фон блока
	const LINE = 0xebebeb;   // --c-light

	// размеры коридора: ширина, высота, глубина секции, число секций
	const W = 24, H = 16, D = 6, N = 14;
	const COLS = 6, ROWS = 4;
	const CW = W / COLS, RH = H / ROWS;

	// снимки — из списка работ (js/gallery-photos.js), если он есть на странице
	const FALLBACK = ['img/gallery/sunbeams-forest.jpg', 'img/genres/portrait/DSC04053.jpg', 'img/gallery/cat-window.jpg', 'img/gallery/bench.jpg', 'img/genres/architecture/kremlin-towers.jpg', 'img/gallery/foggy-tree.jpg', 'img/gallery/swing-couple.jpg', 'img/gallery/highrise-storm.jpg', 'img/gallery/pigeon-cafe.jpg', 'img/gallery/tram-greenery.jpg', 'img/gallery/lake.jpg', 'img/gallery/walk.jpg'];
	const list = (window.GALLERY_PHOTOS || []).map((p) => p.src);
	const SRC = list.length >= 8 ? list : FALLBACK;

	const canvas = document.createElement('canvas');
	canvas.className = 'inv__tunnel';
	canvas.setAttribute('aria-hidden', 'true');
	host.prepend(canvas);

	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	} catch (e) {
		canvas.remove(); // нет WebGL — остаётся тёмный фон блока
		return;
	}
	// видеокарта сбросила холст — прячем его, чтобы не было белого пятна
	canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); canvas.style.visibility = 'hidden'; });
	canvas.addEventListener('webglcontextrestored', () => { canvas.style.visibility = ''; });
	// фон в тумане и тонкие линии — чёткости 1:1 хватает; выше — лишняя работа видеокарте и рывки на ноутбуках
	renderer.setPixelRatio(1);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(BG);
	scene.fog = new THREE.FogExp2(BG, 0.038);
	const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

	// текстуры — одна на снимок, кадр подгоняется под ячейку «по обрезке» (как object-fit: cover).
	// В коридоре снимки мелкие: уменьшаем до 640 px по длинной стороне и строим уменьшенные копии (мип-уровни)
	// для дальних планов — иначе видеокарта каждый кадр перебирает полноразмерные снимки и коридор дёргается
	const TEX_MAX = 640;
	const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
	const cache = new Map();
	const texture = (src) => {
		if (!cache.has(src)) {
			const t = new THREE.Texture();
			t.colorSpace = THREE.SRGBColorSpace;
			t.minFilter = THREE.LinearMipmapLinearFilter;
			t.generateMipmaps = true;
			t.anisotropy = aniso; // пол и потолок под острым углом — без ряби
			const img = new Image();
			img.src = src;
			(img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(() => {
				const s = Math.min(1, TEX_MAX / Math.max(img.naturalWidth, img.naturalHeight));
				const c = document.createElement('canvas');
				c.width = Math.round(img.naturalWidth * s);
				c.height = Math.round(img.naturalHeight * s);
				c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
				t.image = c;
				t.needsUpdate = true;
				t.userData.ready = true;
				renderer.initTexture(t); // сразу в видеокарту, заранее, а не в кадре анимации
			}).catch(() => {});
			cache.set(src, t);
		}
		return cache.get(src);
	};
	// материал снимка; карта (map) задаётся сразу — пустой 1×1, пока снимок не загрузился:
	// шейдер один и тот же, без пересборки в кадре анимации
	const blank = new THREE.DataTexture(new Uint8Array([5, 6, 8, 255]), 1, 1);
	blank.needsUpdate = true;
	const imgMatProps = () => ({ map: blank, transparent: true, opacity: 0, side: THREE.DoubleSide, color: 0xffffff });
	const lineMat = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.16 });
	let k = 0;
	const nextSrc = () => SRC[(k++ * 7) % SRC.length]; // по кругу с шагом — соседние снимки разные

	function addImg(group, pos, rot, w, h) {
		const src = nextSrc();
		// снимок — одна общая текстура на все ячейки (в видеокарту грузится один раз); обрезка под ячейку —
		// координатами самой плоскости, а не копией текстуры: копия в three.js заново грузит снимок в видеокарту,
		// и каждая новая секция коридора давала рывок
		const tex = texture(src);
		const geo = new THREE.PlaneGeometry(w - 0.4, h - 0.4);
		const mat = new THREE.MeshBasicMaterial(imgMatProps());
		// снимок привязывается к плоскости, когда загружен и уже в видеокарте
		const fit = () => {
			if (!tex.userData.ready) return;
			const img = tex.image;
			mat.map = tex;
			const a = img.width / img.height, c = w / h;
			const rx = a > c ? c / a : 1, ry = a > c ? 1 : a / c;
			// по высоте кадр сдвинут к верху (лица в портретах — в верхней трети), а не обрезан по центру
			const focusY = 0.72; // доля высоты снизу, которая будет в середине ячейки
			const oy = Math.min(1 - ry, Math.max(0, focusY - ry / 2));
			const ox = (1 - rx) / 2;
			const uv = geo.attributes.uv;
			for (let i = 0; i < uv.count; i++) uv.setXY(i, ox + uv.getX(i) * rx, oy + uv.getY(i) * ry);
			uv.needsUpdate = true;
			mat.userData.target = 0.95;
		};
		fit();
		mat.userData.fit = fit;
		const m = new THREE.Mesh(geo, mat);
		m.position.copy(pos);
		m.rotation.copy(rot);
		m.name = 'img';
		group.add(m);
	}

	// снимки секции — равномерно, по ровному ритму, без случайных пустот и скоплений:
	// в каждой секции по снимку на каждой стене (ряд меняется по кругу, слева и справа — вразбег),
	// на полу — через секцию, на потолке — через две; соседние секции не повторяют место
	let segNo = 0;
	function populate(group) {
		const n = segNo++;
		const w = W / 2, h = H / 2;
		const wallRow = (shift) => [1, 2, 0, 3][(n + shift) % ROWS];
		addImg(group, new THREE.Vector3(-w, -h + wallRow(0) * RH + RH / 2, -D / 2), new THREE.Euler(0, Math.PI / 2, 0), D, RH);
		addImg(group, new THREE.Vector3(w, -h + wallRow(2) * RH + RH / 2, -D / 2), new THREE.Euler(0, -Math.PI / 2, 0), D, RH);
		if (n % 2 === 0) {
			const col = [1, 4, 2, 3][(n / 2) % 4];
			addImg(group, new THREE.Vector3(-w + col * CW + CW / 2, -h, -D / 2), new THREE.Euler(-Math.PI / 2, 0, 0), CW, D);
		}
		if (n % 3 === 1) {
			const col = [4, 1, 3, 2][Math.floor(n / 3) % 4];
			addImg(group, new THREE.Vector3(-w + col * CW + CW / 2, h, -D / 2), new THREE.Euler(Math.PI / 2, 0, 0), CW, D);
		}
	}

	function clear(group) {
		group.children.filter((c) => c.name === 'img').forEach((c) => {
			group.remove(c);
			c.geometry.dispose();
			c.material.dispose(); // снимок не выгружаем — он общий и пригодится следующим секциям
		});
	}

	function segment(z) {
		const g = new THREE.Group();
		g.position.z = z;
		const w = W / 2, h = H / 2, v = [];
		for (let i = 0; i <= COLS; i++) { const x = -w + i * CW; v.push(x, -h, 0, x, -h, -D, x, h, 0, x, h, -D); }
		for (let i = 1; i < ROWS; i++) { const y = -h + i * RH; v.push(-w, y, 0, -w, y, -D, w, y, 0, w, y, -D); }
		v.push(-w, -h, 0, w, -h, 0, -w, h, 0, w, h, 0, -w, -h, 0, -w, h, 0, w, -h, 0, w, h, 0);
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
		g.add(new THREE.LineSegments(geo, lineMat));
		populate(g);
		return g;
	}

	const segs = [];
	for (let i = 0; i < N; i++) { const s = segment(-i * D); scene.add(s); segs.push(s); }

	function resize() {
		const w = host.clientWidth, h = host.clientHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// узкий экран — шире угол, чтобы стены были видны по бокам
		camera.fov = w / h < 1 ? 92 : 70;
		// точка схода — за фотографом (44% высоты), а не в геометрическом центре блока
		camera.setViewOffset(w, h, 0, (0.5 - 0.44) * h, w, h);
		camera.updateProjectionMatrix();
	}
	resize();
	window.addEventListener('resize', resize);

	// ход: медленно сам по себе + немного от прокрутки страницы
	let z = 0, last = performance.now(), visible = false, raf = 0;
	const speed = reduced ? 0 : 1.1; // единиц в секунду
	// поверх страницы открыт просмотр снимков или карточка снимка — коридора не видно, видеокарта отдана им
	const covered = () => /\b(wv-open|pc-open)\b/.test(document.documentElement.className);
	function frame(now) {
		raf = 0;
		if (!visible || document.hidden || covered()) return;
		// коридор движется медленно — 60 кадров в секунду хватает и на экранах 120–144 Гц; видеокарте вдвое легче
		if (now - last < 12) { raf = requestAnimationFrame(frame); return; }
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		z -= speed * dt;
		const scrollZ = reduced ? 0 : -window.scrollY * 0.004;
		camera.position.z += (z + scrollZ - camera.position.z) * 0.08;
		const cz = camera.position.z;
		// секции, оставшиеся позади, переносятся вперёд с новыми снимками — коридор бесконечный
		segs.forEach((s) => {
			if (s.position.z > cz + D) {
				s.position.z = Math.min(...segs.map((o) => o.position.z)) - D;
				clear(s);
				populate(s);
			}
		});
		// снимки проявляются плавно, когда загрузились
		scene.traverse((o) => {
			if (o.name !== 'img') return;
			const m = o.material;
			if (!m.userData.target) m.userData.fit();
			if (m.userData.target && m.opacity < m.userData.target) m.opacity = Math.min(m.userData.target, m.opacity + dt * 0.6);
		});
		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}
	const start = () => { if (!raf && visible && !covered()) { last = performance.now(); raf = requestAnimationFrame(frame); } };
	// просмотр или карточка закрылись — коридор снова идёт
	new MutationObserver(start).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	// шейдеры собираются заранее, а не в первом кадре анимации
	renderer.compile(scene, camera);
	// рисуется, только когда виден на экране
	new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(host);
	// впервые показался — коридор медленно выходит из-за центральной композиции
	new IntersectionObserver(([e], io) => { if (e.isIntersecting) { host.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 }).observe(host);
	document.addEventListener('visibilitychange', start);
}
