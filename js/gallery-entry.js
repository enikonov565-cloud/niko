// Вход в галерею — четвёртый экран главной и отдельная страница gallery-entry.html.
// Приём — из cullenwebber/three-html-to-canvas: страница, нарисованная в текстуру, проецируется из неподвижной
// камеры-проектора на объёмную сцену. Из исходной точки всё совпадает и выглядит плоской страницей,
// а когда камера уходит в облёт — проявляется сцена со светом и тенями.
// Сцена своя, на всю страницу и в фирменных цветах: изогнутая киноплёнка с кадрами галереи через весь экран,
// лепестковая диафрагма, объектив, полароиды и слайд-рамки. На страницу спроецирована цитата Эллиотта Эрвитта —
// та же, что над залом галереи на главной.
import * as THREE from 'three';

const root = document.querySelector('.ge');
const stage = root && root.querySelector('.ge__stage');
const invite = root && root.querySelector('.ge__invite');
const blades = invite ? [...invite.querySelectorAll('.ge__blade')] : [];
const gsap = window.gsap;
const ST = window.ScrollTrigger;

if (stage && gsap) init();

function init() {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// фирменные цвета
	const PAGE = '#0b0f15';      // --c-dark: фон соседних экранов главной — им же страница в покое, без шва
	const INK = '#ebebeb';       // --c-light
	const TEAL = '#284c58';      // бирюза плашки
	const TEAL_DEEP = '#1c3540'; // бирюза в тени
	const NAVY = '#121c25';      // тёмно-синий стен и корпусов
	const PAPER = '#e6e6e6';     // рамка полароида, как на шестом экране
	const FILM = [
		'img/gallery/lake.jpg', 'img/gallery/tram-greenery.jpg', 'img/gallery/cathedral-birds.jpg', 'img/gallery/pine-glade.jpg',
		'img/gallery/swing-couple.jpg', 'img/gallery/railing.jpg', 'img/gallery/willow-alley.jpg', 'img/gallery/pigeon-cafe.jpg',
	];
	const POLAROIDS = [
		{ src: 'img/gallery/sunbeams-forest.jpg', w: 1200, h: 1800 },
		{ src: 'img/genres/portrait/DSC04053.jpg', w: 1334, h: 2000 },
		{ src: 'img/gallery/red-square-night.jpg', w: 1217, h: 1500 },
		{ src: 'img/gallery/walk.jpg', w: 958, h: 640 },
	];
	// цитата — слово в слово как над залом галереи на главной
	const QUOTE = [
		'«Для меня фотография — это искусство наблюдения.',
		'Это умение найти что-то интересное в самом обыкновенном месте…»',
	];
	const AUTHOR = '— Эллиотт Эрвитт';

	// короткие предлоги и союзы не остаются в конце строки
	const glue = (t) => t
		.replace(/(?<=^|[\s(«])(в|во|на|у|с|со|к|ко|о|об|от|из|до|по|за|под|над|при|без|для|про|и|а|но|или|не|ни|я|что|это)\s+/gi, '$1 ')
		.replace(/\s+—/g, ' —');

	// ---------- размеры сайта: CSS-переменные через невидимый замер ----------
	const probe = document.createElement('div');
	probe.style.cssText = 'position:absolute;left:0;top:0;height:0;visibility:hidden;pointer-events:none;';
	document.body.appendChild(probe);
	const px = (expr) => { probe.style.width = expr; return probe.getBoundingClientRect().width; };
	const metrics = () => ({
		gutter: px('var(--gutter)'),
		inset: px('var(--inset)'),
		top: px('calc(var(--topbar-y) + var(--burger-h) + clamp(2rem, 1rem + 3.5vw, 6rem))'),
		h2: px('var(--fs-h2)'),
		h3: px('var(--fs-h3)'),
		small: px('var(--fs-small)'),
	});

	// ---------- страница в текстуре ----------
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const pageCanvas = document.createElement('canvas');
	const pageTex = new THREE.CanvasTexture(pageCanvas);
	pageTex.colorSpace = THREE.SRGBColorSpace;
	pageTex.minFilter = THREE.LinearFilter;
	pageTex.generateMipmaps = false;

	function wrap(ctx, text, maxW) {
		const words = glue(text).split(' ');
		const lines = [];
		let line = '';
		words.forEach((w) => {
			const test = line ? `${line} ${w}` : w;
			if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; } else line = test;
		});
		if (line) lines.push(line);
		const n = lines.length;
		if (n > 1 && !lines[n - 1].includes(' ')) {
			const prev = lines[n - 2].split(' ');
			if (prev.length >= 2) { lines[n - 1] = `${prev.pop()} ${lines[n - 1]}`; lines[n - 2] = prev.join(' '); }
		}
		return lines;
	}
	const spaced = (ctx, em, size) => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${(em * size).toFixed(2)}px`; };

	function drawPage(W, H) {
		const m = metrics();
		pageCanvas.width = Math.round(W * dpr);
		pageCanvas.height = Math.round(H * dpr);
		const ctx = pageCanvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.textBaseline = 'alphabetic';
		const left = m.gutter + m.inset;
		const right = W - m.gutter - m.inset;
		const top = m.top + (W < 768 ? 24 : 0); // на телефоне логотип в шапке ниже бургера

		// подпись блока — мелко прописными
		ctx.fillStyle = 'rgba(235, 235, 235, 0.75)';
		ctx.font = `400 ${m.small}px Inter, sans-serif`;
		spaced(ctx, 0.12, m.small);
		ctx.fillText('ГАЛЕРЕЯ', left, top + m.small);

		// цитата — H2 Light, по предложению с новой строки; блок по центру высоты экрана
		ctx.fillStyle = INK;
		ctx.font = `300 ${m.h2}px Inter, sans-serif`;
		spaced(ctx, -0.01, m.h2);
		const lines = QUOTE.flatMap((s) => wrap(ctx, s, right - left));
		const lh = m.h2 * 1.15;
		const blockH = lines.length * lh + m.h2 * 0.8 + m.h3 * 1.3;
		let y = Math.max(top + m.small * 4, (H - blockH) / 2) + m.h2 * 0.9;
		lines.forEach((l) => { ctx.fillText(l, left, y); y += lh; });

		// автор — справа, Inter 600, как подпись цитаты над залом
		ctx.font = `600 ${m.h3}px Inter, sans-serif`;
		spaced(ctx, 0.02, m.h3);
		ctx.textAlign = 'right';
		ctx.fillText(AUTHOR, right, y - lh + m.h2 * 0.8 + m.h3);
		ctx.textAlign = 'left';
		spaced(ctx, 0, m.h3);
		pageTex.needsUpdate = true;
	}

	// ---------- рендер ----------
	const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
	renderer.setPixelRatio(dpr);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	stage.appendChild(renderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(PAGE);

	const FOV = 45;
	const REST = new THREE.Vector3(0, 0, 15);
	const LOOK = new THREE.Vector3(0, -0.5, -4);
	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 120);
	const projector = new THREE.PerspectiveCamera(FOV, 1, 0.5, 120); // стоит там же, где камера в покое, не двигается

	// свет в фирменной гамме: небо бирюзовое, низ тёмно-синий, ключевой тёплый белый, контровой бирюзовый
	scene.add(new THREE.HemisphereLight(0x7fb3c2, 0x0b0f15, 0.85));
	const key = new THREE.DirectionalLight(0xdcecf0, 2.4);
	key.position.set(8, 10, 12);
	key.castShadow = true;
	key.shadow.mapSize.set(2048, 2048);
	Object.assign(key.shadow.camera, { near: 1, far: 60, left: -22, right: 22, top: 16, bottom: -16 });
	key.shadow.bias = -0.0002;
	key.shadow.normalBias = 0.03;
	key.shadow.radius = 8;
	key.shadow.blurSamples = 16;
	scene.add(key);
	const rim = new THREE.DirectionalLight(0x6fa6b6, 1.4);
	rim.position.set(-12, 6, -2);
	scene.add(rim);

	// ---------- проектор: общий для всех материалов ----------
	const proj = {
		uPage: { value: pageTex },
		uFlat: { value: new THREE.Color(PAGE) },
		uProjView: { value: new THREE.Matrix4() },
		uProjMat: { value: new THREE.Matrix4() },
		uProjPos: { value: new THREE.Vector3() },
		uLit: { value: 0 },
	};

	// патч стандартного материала: в покое поверхность — цвет страницы плюс спроецированная цитата (плоско, без света);
	// в облёте — свой цвет предмета, свет, тени и та же цитата поверх
	function projected(material) {
		material.onBeforeCompile = (shader) => {
			Object.assign(shader.uniforms, proj);
			shader.vertexShader = shader.vertexShader
				.replace('#include <common>', `#include <common>
					uniform mat4 uProjView;
					uniform mat4 uProjMat;
					uniform vec3 uProjPos;
					varying vec4 vProjCoord;
					varying vec3 vProjDir;
					varying vec3 vProjNormal;`)
				.replace('#include <begin_vertex>', `#include <begin_vertex>
					vec4 pWorld = modelMatrix * vec4(transformed, 1.0);
					vProjCoord = uProjMat * uProjView * pWorld;
					vProjDir = normalize(uProjPos - pWorld.xyz);
					vProjNormal = normalize(mat3(modelMatrix) * normal);`);
			shader.fragmentShader = shader.fragmentShader
				.replace('#include <common>', `#include <common>
					uniform sampler2D uPage;
					uniform vec3 uFlat;
					uniform float uLit;
					varying vec4 vProjCoord;
					varying vec3 vProjDir;
					varying vec3 vProjNormal;`)
				.replace('#include <color_fragment>', `#include <color_fragment>
					vec3 pNdc = vProjCoord.xyz / vProjCoord.w;
					vec2 pUv = pNdc.xy * 0.5 + 0.5;
					float pIn = step(0.0, pUv.x) * step(pUv.x, 1.0) * step(0.0, pUv.y) * step(pUv.y, 1.0) * step(-1.0, pNdc.z) * step(pNdc.z, 1.0);
					// обратные грани (у плёнки) — со своей нормалью
					vec3 pNormal = gl_FrontFacing ? vProjNormal : -vProjNormal;
					float pFacing = step(0.0, dot(pNormal, vProjDir));
					vec4 pColor = texture2D(uPage, pUv);
					float pMask = pIn * pFacing * pColor.a;
					vec3 flatColor = mix(uFlat, pColor.rgb, pMask);
					diffuseColor.rgb = mix(diffuseColor.rgb, pColor.rgb, pMask);`)
				.replace('#include <opaque_fragment>', `#include <opaque_fragment>
					gl_FragColor.rgb = mix(flatColor, gl_FragColor.rgb, uLit);`);
		};
		material.needsUpdate = true;
		return material;
	}
	const mat = (color, opts = {}) => projected(new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...opts }));
	const M = {
		wall: mat('#102330', { roughness: 0.95 }), // стена — глубокая сине-бирюзовая, на свету не уходит в серый
		teal: mat(TEAL, { roughness: 0.55, metalness: 0.15 }),
		deep: mat(TEAL_DEEP, { roughness: 0.6, metalness: 0.2 }),
		navy: mat(NAVY, { roughness: 0.5, metalness: 0.25 }),
		paper: mat(PAPER, { roughness: 0.7 }),
		glass: mat('#0b0f15', { roughness: 0.15, metalness: 0.6 }),
	};

	const add = (geo, material, x, y, z, rot, cast = true) => {
		const mesh = new THREE.Mesh(geo, material);
		mesh.position.set(x, y, z);
		if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
		mesh.castShadow = cast;
		mesh.receiveShadow = true;
		scene.add(mesh);
		return mesh;
	};
	const loader = new THREE.TextureLoader();
	const photoTex = (src) => { const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

	// ---------- сцена на всю страницу ----------
	// стена за всем — на ней лежит цитата и тени
	add(new THREE.PlaneGeometry(140, 90), M.wall, 0, 0, -10, null, false);

	// киноплёнка: лента изгибается через весь экран, в кадрах — снимки галереи
	const filmCanvas = document.createElement('canvas');
	filmCanvas.width = 4096;
	filmCanvas.height = 256;
	const filmTex = new THREE.CanvasTexture(filmCanvas);
	filmTex.colorSpace = THREE.SRGBColorSpace;
	filmTex.anisotropy = 8;
	const filmImgs = FILM.map((src) => { const im = new Image(); im.src = src; im.onload = drawFilm; return im; });
	function drawFilm() {
		const c = filmCanvas.getContext('2d');
		const W = filmCanvas.width;
		const H = filmCanvas.height;
		c.fillStyle = '#0b0f15';
		c.fillRect(0, 0, W, H);
		// перфорация сверху и снизу
		c.fillStyle = '#284c58';
		for (let x = 10; x < W; x += 36) {
			c.beginPath();
			if (c.roundRect) { c.roundRect(x, 12, 20, 22, 4); c.roundRect(x, H - 34, 20, 22, 4); } else { c.rect(x, 12, 20, 22); c.rect(x, H - 34, 20, 22); }
			c.fill();
		}
		// кадры — снимок целиком заполняет кадр, как на плёнке
		const fh = H - 92;
		const fw = fh * 1.5;
		const gap = 26;
		let i = 0;
		for (let x = gap; x + fw < W; x += fw + gap, i++) {
			const im = filmImgs[i % filmImgs.length];
			c.save();
			c.beginPath();
			c.rect(x, 46, fw, fh);
			c.clip();
			if (im.complete && im.naturalWidth) {
				const k = Math.max(fw / im.naturalWidth, fh / im.naturalHeight);
				const w = im.naturalWidth * k;
				const h = im.naturalHeight * k;
				c.drawImage(im, x + (fw - w) / 2, 46 + (fh - h) / 2, w, h);
			} else {
				c.fillStyle = '#1c3540';
				c.fillRect(x, 46, fw, fh);
			}
			c.restore();
		}
		filmTex.needsUpdate = true;
	}
	drawFilm();

	function ribbon(points, width, segs, twist) {
		const curve = new THREE.CatmullRomCurve3(points);
		const pos = [];
		const uv = [];
		const idx = [];
		const len = curve.getLength();
		const z = new THREE.Vector3(0, 0, 1);
		for (let i = 0; i <= segs; i++) {
			const t = i / segs;
			const p = curve.getPointAt(t);
			const tan = curve.getTangentAt(t);
			const side = new THREE.Vector3().crossVectors(tan, z).normalize();
			side.applyAxisAngle(tan, Math.sin(t * Math.PI * 2) * twist); // лента слегка скручивается
			pos.push(p.x + side.x * width / 2, p.y + side.y * width / 2, p.z + side.z * width / 2);
			pos.push(p.x - side.x * width / 2, p.y - side.y * width / 2, p.z - side.z * width / 2);
			const u = (t * len) / (width * 16);
			uv.push(u, 1, u, 0);
			if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		g.computeVertexNormals();
		return g;
	}
	filmTex.wrapS = THREE.RepeatWrapping;
	const filmMat = projected(new THREE.MeshStandardMaterial({ color: 0xffffff, map: filmTex, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }));
	add(ribbon([
		new THREE.Vector3(-26, 9, -7), new THREE.Vector3(-14, 4.5, -3.5), new THREE.Vector3(-5, 6.5, -6),
		new THREE.Vector3(4, 1.5, -2.5), new THREE.Vector3(12, -2.5, -5.5), new THREE.Vector3(20, -9, -3), new THREE.Vector3(30, -12, -7),
	], 2.3, 260, 0.9), filmMat, 0, 0, 0);

	// лепестковая диафрагма: кольцо и шесть лепестков, приоткрыта — в центре кадра «зрачок»
	function irisRing(R, r, depth) {
		const s = new THREE.Shape();
		s.absarc(0, 0, R, 0, Math.PI * 2, false);
		const h = new THREE.Path();
		h.absarc(0, 0, r, 0, Math.PI * 2, true);
		s.holes.push(h);
		return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 72 });
	}
	function blade(R, open) {
		const s = new THREE.Shape();
		s.moveTo(open, 0);
		s.absarc(0, 0, R, -0.25, 1.15, false);
		s.lineTo(open * Math.cos(1.05), open * Math.sin(1.05));
		s.closePath();
		return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 24 });
	}
	const iris = new THREE.Group();
	iris.position.set(-8.5, -3.2, -5.5);
	iris.rotation.set(0.15, 0.55, 0.2);
	scene.add(iris);
	const ringMesh = new THREE.Mesh(irisRing(3.3, 2.75, 0.6), M.navy);
	const bladeGeo = blade(2.85, 0.9);
	[ringMesh].forEach((m) => { m.castShadow = true; m.receiveShadow = true; iris.add(m); });
	for (let i = 0; i < 6; i++) {
		const b = new THREE.Mesh(bladeGeo, i % 2 ? M.teal : M.deep);
		b.rotation.z = (i / 6) * Math.PI * 2;
		b.position.z = 0.12 + i * 0.03;
		b.castShadow = true;
		b.receiveShadow = true;
		iris.add(b);
	}

	// объектив: корпус, кольца фокуса и стекло — лежит, смотрит в сторону зрителя
	const lens = new THREE.Group();
	lens.position.set(10.5, 4.2, -4.5);
	lens.rotation.set(0.35, -0.6, 0);
	scene.add(lens);
	const part = (geo, material, z) => { const m = new THREE.Mesh(geo, material); m.rotation.x = Math.PI / 2; m.position.z = z; m.castShadow = true; m.receiveShadow = true; lens.add(m); };
	part(new THREE.CylinderGeometry(1.5, 1.5, 1.6, 72), M.navy, -0.6);
	part(new THREE.CylinderGeometry(1.62, 1.62, 0.45, 72), M.teal, 0.35);
	part(new THREE.CylinderGeometry(1.55, 1.55, 0.5, 72), M.deep, 0.85);
	part(new THREE.CylinderGeometry(1.72, 1.6, 0.4, 72), M.navy, 1.3);
	const glass = new THREE.Mesh(new THREE.CircleGeometry(1.35, 72), M.glass);
	glass.position.z = 1.51;
	lens.add(glass);

	// полароиды по краям страницы: светлая рамка и снимок, рамка шире снизу — как на шестом экране
	function polaroid(p, height, x, y, z, rot) {
		const ratio = p.w / p.h;
		const ph = height * 0.72;
		const pw = ph * ratio;
		const fw = pw + height * 0.12;
		const g = new THREE.Group();
		g.position.set(x, y, z);
		g.rotation.set(rot[0], rot[1], rot[2]);
		const frame = new THREE.Mesh(new THREE.BoxGeometry(fw, height, 0.08), M.paper);
		frame.castShadow = true;
		frame.receiveShadow = true;
		g.add(frame);
		const shot = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), projected(new THREE.MeshStandardMaterial({ color: 0xffffff, map: photoTex(p.src), roughness: 0.5 })));
		shot.position.set(0, height * 0.08, 0.045);
		shot.receiveShadow = true;
		g.add(shot);
		scene.add(g);
	}
	polaroid(POLAROIDS[0], 4.4, 14.5, -4.5, -2.5, [0.05, -0.45, -0.12]);
	polaroid(POLAROIDS[1], 3.8, -14.5, 5.2, -4, [-0.1, 0.5, 0.1]);
	polaroid(POLAROIDS[2], 3.2, 1.5, -6.6, -1.2, [-0.3, 0.2, 0.08]);
	polaroid(POLAROIDS[3], 2.6, 4.5, 7.2, -6.5, [0.2, -0.3, -0.06]);

	// слайд-рамки — квадратные паспарту, рассыпаны по свободным местам
	function slideFrame(size) {
		const s = new THREE.Shape();
		const a = size / 2;
		const b = a * 0.62;
		s.moveTo(-a, -a); s.lineTo(a, -a); s.lineTo(a, a); s.lineTo(-a, a); s.closePath();
		const h = new THREE.Path();
		h.moveTo(-b, -b * 0.7); h.lineTo(-b, b * 0.7); h.lineTo(b, b * 0.7); h.lineTo(b, -b * 0.7); h.closePath();
		s.holes.push(h);
		return new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
	}
	add(slideFrame(2.2), M.teal, -4.5, 7.8, -3.5, [0.4, 0.5, 0.3]);
	add(slideFrame(1.8), M.deep, 17.5, 6.5, -6, [-0.3, -0.6, -0.2]);
	add(slideFrame(1.6), M.teal, -17.5, -6.5, -2.5, [0.3, 0.7, 0.4]);
	add(slideFrame(1.4), M.navy, 7.5, -8.2, -4, [-0.5, -0.2, 0.6]);

	// ---------- размеры ----------
	function resize() {
		const W = stage.clientWidth || window.innerWidth;
		const H = stage.clientHeight || window.innerHeight;
		renderer.setSize(W, H, false);
		const aspect = W / H;
		// на узком экране камера отходит дальше — сцена остаётся в кадре
		REST.set(0, 0, aspect < 1 ? 15 + (1 - aspect) * 18 : 15);
		[camera, projector].forEach((c) => { c.aspect = aspect; c.updateProjectionMatrix(); });
		projector.position.copy(REST);
		projector.lookAt(LOOK);
		projector.updateMatrixWorld();
		proj.uProjView.value.copy(projector.matrixWorldInverse);
		proj.uProjMat.value.copy(projector.projectionMatrix);
		proj.uProjPos.value.copy(projector.position);
		drawPage(W, H);
	}

	// ---------- облёт по прокрутке ----------
	const KEYS = [
		{ p: 0.0, x: 0, y: 0, z: 0, roll: 0 },
		{ p: 0.08, x: 0, y: 0, z: 0, roll: 0 },
		{ p: 0.38, x: -16, y: 5, z: -6, roll: -0.18 },
		{ p: 0.66, x: 14, y: -6, z: -8, roll: 0.16 },
		{ p: 0.9, x: 0, y: 0, z: 0, roll: 0 },
		{ p: 1.0, x: 0, y: 0, z: 0, roll: 0 },
	];
	const ease = (t) => t * t * (3 - 2 * t);
	const span01 = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
	function cameraAt(p) {
		let i = 0;
		while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
		const a = KEYS[i];
		const b = KEYS[i + 1];
		const t = ease(span01(p, a.p, b.p));
		return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, roll: a.roll + (b.roll - a.roll) * t };
	}

	let target = 0;
	let shown = 0;
	if (ST) ST.create({ trigger: root, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { target = self.progress; } });

	// клик по приглашению — та же прокрутка: страница сама въезжает в облёт
	if (invite) {
		invite.addEventListener('click', () => {
			const y = root.getBoundingClientRect().top + window.scrollY + (root.offsetHeight - window.innerHeight) * 0.38;
			if (window.lenis) window.lenis.scrollTo(y, { duration: 2.6 });
			else window.scrollTo({ top: y, behavior: 'smooth' });
		});
	}

	let visible = true;
	if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);

	function frame() {
		if (!visible) return;
		shown += (target - shown) * (reduced ? 1 : 0.08);
		const p = shown;
		const k = reduced ? { x: 0, y: 0, z: 0, roll: 0 } : cameraAt(p);
		camera.position.set(REST.x + k.x, REST.y + k.y, REST.z + k.z);
		camera.lookAt(LOOK);
		camera.rotateZ(k.roll);
		// свет, цвета предметов и снимки — по мере удаления камеры от исходной точки
		proj.uLit.value = ease(Math.min(1, Math.hypot(k.x, k.y, k.z) / 6));

		// приглашение: в покое диафрагма «дышит», с началом прокрутки раскрывается настежь — и знак уходит
		if (invite) {
			const go = span01(p, 0, 0.06);
			const breath = reduced ? 0.3 : 0.28 + 0.16 * Math.sin(performance.now() / 650);
			const open = breath + (1 - breath) * ease(go);
			blades.forEach((b) => b.setAttribute('transform', `rotate(${(open * 34).toFixed(2)} 100 40)`));
			const o = 1 - ease(span01(p, 0.04, 0.09));
			invite.style.opacity = String(o);
			invite.style.visibility = o > 0.01 ? 'visible' : 'hidden';
			invite.style.transform = `translateX(-50%) scale(${(1 + ease(go) * 0.12).toFixed(3)})`;
		}
		renderer.render(scene, camera);
	}

	// ---------- запуск ----------
	resize();
	if (document.fonts) {
		Promise.all(['300 40px Inter', '400 16px Inter', '600 20px Inter'].map((f) => document.fonts.load(f)))
			.then(() => drawPage(stage.clientWidth || window.innerWidth, stage.clientHeight || window.innerHeight));
	}
	let resizeTimer = 0;
	window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });

	// плавный скролл: на главной Lenis уже запущен (js/parallax.js), на отдельной странице — свой
	if (window.Lenis && !reduced && !window.lenis) {
		const lenis = new window.Lenis({ lerp: 0.08 });
		window.lenis = lenis;
		if (ST) lenis.on('scroll', ST.update);
		gsap.ticker.add((time) => lenis.raf(time * 1000));
		gsap.ticker.lagSmoothing(0);
	}
	gsap.ticker.add(frame);
}
