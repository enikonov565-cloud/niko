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
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(BG);
	scene.fog = new THREE.FogExp2(BG, 0.045);
	const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

	// текстуры — одна на снимок, кадр подгоняется под ячейку «по обрезке» (как object-fit: cover)
	const loader = new THREE.TextureLoader();
	const cache = new Map();
	const texture = (src) => {
		if (!cache.has(src)) {
			const t = loader.load(src, () => { t.userData.ready = true; });
			t.colorSpace = THREE.SRGBColorSpace;
			t.minFilter = THREE.LinearFilter;
			t.generateMipmaps = false;
			cache.set(src, t);
		}
		return cache.get(src);
	};
	const lineMat = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.16 });
	let k = 0;
	const nextSrc = () => SRC[(k++ * 7) % SRC.length]; // по кругу с шагом — соседние снимки разные

	function addImg(group, pos, rot, w, h) {
		const src = nextSrc();
		const tex = texture(src).clone();
		tex.needsUpdate = true;
		const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, color: 0xb8b8b8 });
		const fit = () => {
			const img = tex.image;
			if (!img || !img.width) return;
			const a = img.width / img.height, c = w / h;
			tex.repeat.set(a > c ? c / a : 1, a > c ? 1 : a / c);
			tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
			mat.userData.target = 0.78;
		};
		if (tex.image && tex.image.width) fit(); else tex.source.data ? fit() : null;
		mat.userData.fit = fit;
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, h - 0.4), mat);
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
			c.material.map && c.material.map.dispose();
			c.material.dispose();
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
	function frame(now) {
		raf = 0;
		if (!visible || document.hidden) return;
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
			if (!m.userData.target && m.map && m.map.image && m.map.image.width) m.userData.fit();
			if (m.userData.target && m.opacity < m.userData.target) m.opacity = Math.min(m.userData.target, m.opacity + dt * 0.6);
		});
		renderer.render(scene, camera);
		raf = requestAnimationFrame(frame);
	}
	const start = () => { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } };
	new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }, { rootMargin: '100px 0px' }).observe(host);
	// впервые показался — коридор медленно выходит из-за центральной композиции
	new IntersectionObserver(([e], io) => { if (e.isIntersecting) { host.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.25 }).observe(host);
	document.addEventListener('visibilitychange', start);
}
