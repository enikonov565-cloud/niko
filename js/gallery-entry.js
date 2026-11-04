// Вход в галерею — четвёртый экран главной.
// Приём — из cullenwebber/three-html-to-canvas: страница, нарисованная в текстуру, проецируется из неподвижной
// камеры-проектора на объёмную сцену. Из исходной точки всё совпадает и выглядит плоской страницей,
// а когда камера уходит в облёт — проявляется сцена со светом и тенями.
// Облётом управляет переход в зал (нажатие на приглашение), не прокрутка.
// Сцена своя, на всю страницу и в фирменных цветах: изогнутая киноплёнка с кадрами галереи через весь экран,
// лепестковая диафрагма, объектив, полароиды и слайд-рамки. На страницу спроецированы заголовок «Добро пожаловать!»
// и лист бумаги, на котором ручка пишет цитату Эллиотта Эрвитта шрифтом Lemon.
import * as THREE from 'three';

const root = document.querySelector('.ge');
const stage = root && root.querySelector('.ge__stage');
const invite = root && root.querySelector('.ge__invite');
const blades = invite ? [...invite.querySelectorAll('.ge__blade')] : [];
const gsap = window.gsap;

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
		{ src: 'img/gallery/walk.jpg', w: 1916, h: 1280 },
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
		h1: px('var(--fs-h1)'),
		h2: px('var(--fs-h2)'),
		h3: px('var(--fs-h3)'),
		small: px('var(--fs-small)'),
		radius: px('clamp(0.625rem, 0.4rem + 0.6vw, 0.9375rem)'),
	});

	// ручка, которая пишет цитату: кончик на строке, корпус уходит вниз-вправо — к правому плечу пишущего,
	// как ручка в правой руке, если смотреть на лист сверху.
	// Кончик пера — в точке HAND_TIP рисунка (viewBox 680 × 480)
	const HAND_VB = 680;
	const HAND_TIP = { x: 120, y: 60 };
	const hand = document.createElement('div');
	hand.className = 'ge__hand';
	hand.setAttribute('aria-hidden', 'true');
	hand.innerHTML = `<svg viewBox="0 0 680 480">
		<g transform="translate(120 60) rotate(40)">
			<path class="ge__hand-nib" d="M0 0 L24 -4.5 L24 4.5 Z"/>
			<rect class="ge__hand-grip" x="24" y="-6.5" width="52" height="13" rx="4"/>
			<rect class="ge__hand-pen" x="76" y="-8" width="340" height="16" rx="7"/>
			<rect class="ge__hand-pen" x="300" y="-12.5" width="72" height="4.5" rx="2"/>
			<path class="ge__hand-shine" d="M92 -3 H404"/>
		</g>
	</svg>`;
	stage.parentElement.appendChild(hand);

	// ---------- страница в текстуре ----------
	const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // выше видеокарта тяжелее держит сцену и чаще её сбрасывает
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

	// ---------- страница: заголовок, лист бумаги и цитата, которую пишет рука ----------
	const PAPER_COLOR = '#ebebeb';  // лист — светлый цвет сайта
	const PEN_INK = '#1c3540';      // чернила — глубокая бирюза
	const HAND_FONT = 'Lemon';      // рукописный шрифт (fonts/ofont.ru_Lemon.ttf)
	const baseCanvas = document.createElement('canvas'); // всё, кроме рукописи, — рисуется один раз
	const titleCanvas = document.createElement('canvas'); // только заголовок: в покое лист показывает наклейка
	let layout = null;    // строки рукописи: текст, x, y, ширина
	let written = 0;      // сколько пикселей рукописи уже написано (по всем строкам подряд)

	function drawPage(W, H) {
		const m = metrics();
		const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
		// холст другого размера — текстуру в сцене создаём заново: старую WebGL дальше не обновляет,
		// и цитата переставала бы появляться (ручка пишет, а текста нет), а уголок съезжал бы с места
		if (pageCanvas.width !== cw || pageCanvas.height !== ch) pageTex.dispose();
		baseCanvas.width = pageCanvas.width = cw;
		baseCanvas.height = pageCanvas.height = ch;
		const ctx = baseCanvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.textBaseline = 'alphabetic';
		const narrow = W < 768;
		const top = m.top + (narrow ? 24 : 0); // на телефоне логотип в шапке ниже бургера

		// заголовок H1 — по центру экрана, над листом
		ctx.fillStyle = INK;
		ctx.font = `500 ${m.h1}px Inter, sans-serif`;
		spaced(ctx, -0.01, m.h1);
		ctx.textAlign = 'center';
		ctx.fillText('ДОБРО ПОЖАЛОВАТЬ!', W / 2, top + m.h1 * 0.85);
		ctx.textAlign = 'left';
		spaced(ctx, 0, m.h1);
		titleCanvas.width = cw;
		titleCanvas.height = ch;
		titleCanvas.getContext('2d').drawImage(baseCanvas, 0, 0);

		// лист — между заголовком и приглашением, по полям сайта; чуть повёрнут, как положенный на стол
		const inviteTop = invite ? invite.getBoundingClientRect().top - stage.getBoundingClientRect().top : H * 0.72;
		const sheetTop = top + m.h1 * 1.35;
		const sheetBottom = Math.max(sheetTop + 180, inviteTop - m.h3);
		const sheetW = narrow ? W - 2 * m.gutter : Math.min(W - 2 * m.gutter, m.h2 * 24);
		const sheetH = sheetBottom - sheetTop;
		const sheetX = (W - sheetW) / 2;
		const pad = m.inset * 1.1;     // поля листа по бокам
		const padY = m.inset * 0.7;   // сверху и снизу
		ctx.save();
		ctx.translate(sheetX + sheetW / 2, sheetTop + sheetH / 2);
		ctx.rotate(-0.012);
		ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
		ctx.shadowBlur = 30;
		ctx.shadowOffsetY = 12;
		ctx.fillStyle = PAPER_COLOR;
		ctx.beginPath();
		if (ctx.roundRect) ctx.roundRect(-sheetW / 2, -sheetH / 2, sheetW, sheetH, m.radius * 0.5); else ctx.rect(-sheetW / 2, -sheetH / 2, sheetW, sheetH);
		ctx.fill();
		// правый нижний уголок загнут: срезаем его и кладём сверху отворот — так он виден и в облёте
		const fold = Math.min(pad * 0.95, sheetH * 0.18);
		const hw = sheetW / 2;
		const hh = sheetH / 2;
		ctx.shadowColor = 'transparent';
		ctx.globalCompositeOperation = 'destination-out';
		ctx.beginPath();
		ctx.moveTo(hw - fold, hh + 2);
		ctx.lineTo(hw + 2, hh - fold);
		ctx.lineTo(hw + 2, hh + 2);
		ctx.closePath();
		ctx.fill();
		ctx.globalCompositeOperation = 'source-over';
		drawFlap(ctx, hw, hh, fold, 0);
		ctx.restore();
		// где угол листа на экране — по нему наклейка ловит наведение (nearCorner)
		const ca = -0.012;
		const ccx = sheetX + hw;
		const ccy = sheetTop + hh;
		const curl = { x: ccx + hw * Math.cos(ca) - hh * Math.sin(ca), y: ccy + hw * Math.sin(ca) + hh * Math.cos(ca), a: ca, fold };

		// рукопись: крупно, шрифтом Lemon; кегль подбирается, чтобы цитата и подпись встали на лист
		// почерк — заметно, но не давит: кегль чуть больше H2 и с воздухом вокруг
		let size = Math.min(m.h2 * 1.45, sheetH / 3.3);
		let lines;
		let lh;
		for (;;) {
			ctx.font = `${size}px ${HAND_FONT}, cursive`;
			lines = QUOTE.flatMap((s) => wrap(ctx, s, sheetW - pad * 2));
			lh = size * 1.18;
			// на компьютере первое предложение — целиком в верхней строке (на планшете и телефоне так вышло бы слишком мелко)
			const firstFits = W < 1024 || ctx.measureText(glue(QUOTE[0])).width <= sheetW - pad * 2;
			if ((firstFits && lines.length * lh + size * 1.3 <= (sheetH - padY * 2) * 0.9) || size < 14) break;
			size *= 0.94;
		}
		const blockH = lines.length * lh + size * 1.3;
		let y = sheetTop + (sheetH - blockH) / 2 + size * 0.95;
		layout = { size, lines: [], W, H, curl, sheet: { x: sheetX, y: sheetTop, w: sheetW, h: sheetH, r: m.radius * 0.5, a: -0.012 } };
		lines.forEach((t) => {
			layout.lines.push({ t, x: sheetX + pad, y, w: ctx.measureText(t).width, size });
			y += lh;
		});
		// подпись — рукой же, мельче, справа
		const aSize = size * 0.62;
		ctx.font = `${aSize}px ${HAND_FONT}, cursive`;
		const aw = ctx.measureText(AUTHOR).width;
		// подпись не заходит под загнутый уголок
		layout.lines.push({ t: AUTHOR, x: sheetX + sheetW - pad - fold * 0.6 - aw, y: y - lh + size * 1.25, w: aw, size: aSize });
		layout.total = layout.lines.reduce((s, l) => s + l.w, 0);
		sticker.resize();
		pageMode = ''; // новый размер — текстуру страницы рисуем заново
		renderPage();
	}

	// отворот уголка: треугольник с выгнутыми краями, чуть темнее листа, с тенью на лист.
	// (cx, cy) — угол листа, f — насколько загнут, lift — насколько приподнят (0…1)
	function flapPath(cx, cy, f, lift) {
		const k = 1 + lift * 0.25;
		return [
			[cx - f, cy],
			[cx - f * (1.05 + lift * 0.1), cy - f * 0.5 * k, cx - f * (0.94 + lift * 0.08), cy - f * (0.94 + lift * 0.08)],
			[cx - f * 0.5 * k, cy - f * (1.05 + lift * 0.1), cx, cy - f],
		];
	}
	function drawFlap(ctx, cx, cy, f, lift) {
		const [a, q1, q2] = flapPath(cx, cy, f, lift);
		ctx.save();
		ctx.shadowColor = 'rgba(15, 20, 27, 0.28)';
		ctx.shadowBlur = f * 0.25;
		ctx.shadowOffsetX = -f * 0.06;
		ctx.shadowOffsetY = -f * 0.06;
		ctx.fillStyle = '#d4d0c8';
		ctx.beginPath();
		ctx.moveTo(a[0], a[1]);
		ctx.quadraticCurveTo(q1[0], q1[1], q1[2], q1[3]);
		ctx.quadraticCurveTo(q2[0], q2[1], q2[2], q2[3]);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	// ---------- лист-наклейка: в покое лист с цитатой — отдельная 3D-наклейка, у неё отклеивается правый нижний угол ----------
	// Перенесено из «Sticker Peel — Originkit» (React/Framer) без изменений в самом эффекте: та же сетка 80×60,
	// решётка костей 30×30 с билинейной привязкой, тот же изгиб полукругом (радиус 0.15, сила 0.6), те же материалы
	// (лицо с бликом, изнанка своего цвета, торцы), свет и мягкая тень на фон. Наведёшь на угол — отклеивается
	// сильнее (как hoverPeel), нажмёшь — ещё сильнее (pressPeel), уведёшь — плавно ложится обратно.
	// В облёте наклейка гаснет, и лист снова рисуется в текстуре сцены
	const ST = {
		depth: 0.003, boneX: 30, boneY: 30, segW: 80, segH: 60,
		cam: 1200,
		curlFactor: 0.6,
		curlR: 0.05 + ((0.15 - 0.1) / 0.9) * (1 / Math.PI - 0.05), // mapInternalRadiusToUIValue(FIXED_CURL_RADIUS = 0.15)
		rotation: 315,                                               // направление загиба: к правому нижнему углу
		peel: { rest: 0.18, hover: 0.25, press: 0.32 },               // доля листа по диагонали: покой, наведение, нажатие
		back: '#cfd3da',                                             // изнанка глянцевой бумаги — светло-серая, загиб читается
		shadow: { opacity: 55, color: '#000000', x: -300, y: 140 },
	};
	const sticker = { on: false, ok: false, amount: ST.peel.rest, hover: false, press: false, t: 0, dirty: true, size: null, box: null };
	const stEl = document.createElement('canvas');
	stEl.className = 'ge__sheet';
	stEl.setAttribute('aria-hidden', 'true');
	stage.parentElement.appendChild(stEl);
	const sheetCanvas = document.createElement('canvas'); // лицо наклейки: бумага и рукопись
	const backCanvas = document.createElement('canvas');  // изнанка: та же форма, цвет изнанки
	const stScene = new THREE.Scene();
	const stCam = new THREE.PerspectiveCamera(30, 1, 100, 2000);
	stCam.position.set(0, 0, ST.cam);
	stCam.lookAt(0, 0, 0);
	let stR = null, stMesh = null, stBones = [], stInit = [];
	const stTex = new THREE.CanvasTexture(sheetCanvas);
	stTex.colorSpace = THREE.SRGBColorSpace;
	stTex.minFilter = THREE.LinearFilter;
	stTex.generateMipmaps = false;
	const stBack = new THREE.CanvasTexture(backCanvas);
	stBack.colorSpace = THREE.SRGBColorSpace;
	stBack.minFilter = THREE.LinearFilter;
	stBack.generateMipmaps = false;
	// изнанка зеркальна лицу — иначе при загибе она смотрит не в ту сторону (makeBackTextureViewConsistent)
	stBack.wrapS = THREE.RepeatWrapping;
	stBack.repeat.x = -1;
	stBack.offset.x = 1;
	if (!reduced) {
		try {
			stR = new THREE.WebGLRenderer({ canvas: stEl, alpha: true, antialias: true });
			stR.setPixelRatio(1);
			stR.shadowMap.enabled = true;
			stR.shadowMap.type = THREE.PCFSoftShadowMap;
			stR.shadowMap.autoUpdate = false; // тени пересчитываются только при изменении изгиба (bendSticker), не каждый кадр
			// мягкое сжатие света: белая бумага не выгорает в сплошное белое — видны изгиб, блик и глянец
			stR.toneMapping = THREE.ACESFilmicToneMapping;
			stEl.addEventListener('webglcontextlost', (e) => { e.preventDefault(); sticker.ok = false; });
			stEl.addEventListener('webglcontextrestored', () => { sticker.size = null; sticker.resize(); });
		} catch (err) { stR = null; }
	}
	const _q = new THREE.Quaternion();
	const _axis = new THREE.Vector3();

	// сетка наклейки с билинейной привязкой к решётке костей (createStickerGeometry)
	function stickerGeometry(width, height) {
		const geometry = new THREE.BoxGeometry(width, height, ST.depth, ST.segW, ST.segH, 1);
		const position = geometry.attributes.position;
		const v = new THREE.Vector3();
		const idx = [], wts = [];
		for (let k = 0; k < position.count; k++) {
			v.fromBufferAttribute(position, k);
			// в пределах решётки: на краях листа погрешность даёт −0,0000001 — индекс −1 ломал отрисовку
			const gx = Math.min(ST.boneX - 1, Math.max(0, ((v.x + width / 2) / width) * (ST.boneX - 1)));
			const gy = Math.min(ST.boneY - 1, Math.max(0, ((v.y + height / 2) / height) * (ST.boneY - 1)));
			const x0 = Math.floor(gx), y0 = Math.floor(gy);
			const x1 = Math.min(x0 + 1, ST.boneX - 1), y1 = Math.min(y0 + 1, ST.boneY - 1);
			const tx = gx - x0, ty = gy - y0;
			idx.push(y0 * ST.boneX + x0, y0 * ST.boneX + x1, y1 * ST.boneX + x0, y1 * ST.boneX + x1);
			wts.push((1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty);
		}
		geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(idx, 4));
		geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wts, 4));
		geometry.computeVertexNormals();
		return geometry;
	}

	function disposeSticker() {
		stScene.traverse((o) => {
			if (o.geometry) o.geometry.dispose();
			if (o.material) [].concat(o.material).forEach((mt) => mt.dispose());
			if (o.isLight && o.dispose) o.dispose();
		});
		stScene.clear();
		stMesh = null;
		stBones = [];
		stInit = [];
	}

	// сцена наклейки под размер листа (setupScene / recreateMeshForSize)
	function buildSticker(w, h) {
		disposeSticker();
		const margin = Math.round(Math.min(w, h) * 0.45);         // место под отклеенный угол и тень
		const cw = w + margin * 2, ch = h + margin * 2;
		stCam.fov = 2 * Math.atan(ch / (2 * ST.cam)) * (180 / Math.PI); // calculateCameraFov: 1 единица = 1 px
		stCam.aspect = cw / ch;
		stCam.updateProjectionMatrix();
		stR.setSize(Math.round(cw * dpr), Math.round(ch * dpr), false);
		stEl.style.width = `${cw}px`;
		stEl.style.height = `${ch}px`;

		const geometry = stickerGeometry(w, h);
		const bones = [];
		const sx = w / (ST.boneX - 1), sy = h / (ST.boneY - 1);
		for (let y = 0; y < ST.boneY; y++) {
			for (let x = 0; x < ST.boneX; x++) {
				const b = new THREE.Bone();
				b.position.set(-w / 2 + x * sx, -h / 2 + y * sy, 0);
				bones.push(b);
			}
		}
		stBones = bones;
		stInit = bones.map((b) => b.position.clone());
		const skeleton = new THREE.Skeleton(bones);
		// лицо — глянцевая бумага: лаковый слой даёт мягкий блик по листу и яркую полосу на изгибе
		const front = new THREE.MeshPhysicalMaterial({
			color: 0xffffff, side: THREE.FrontSide, transparent: true, roughness: 0.3, metalness: 0.2,
			clearcoat: 1, clearcoatRoughness: 0.32,
			emissive: 0xffffff, emissiveIntensity: 0.5, map: stTex, emissiveMap: stTex, alphaTest: 0.01,
		});
		const back = new THREE.MeshStandardMaterial({
			color: 0xffffff, side: THREE.FrontSide, transparent: true, roughness: 0.3, metalness: 0,
			emissive: 0xffffff, emissiveIntensity: 0.3, map: stBack, alphaTest: 0.01,
		});
		const side = new THREE.MeshStandardMaterial({
			color: new THREE.Color(ST.back), transparent: true, opacity: 1, roughness: 0.1, metalness: 0,
			map: stTex, emissive: 0xffffff, emissiveMap: stTex, emissiveIntensity: 0.5, alphaTest: 0.01,
		});
		// порядок граней BoxGeometry: +X, −X, +Y, −Y, +Z (лицо), −Z (изнанка)
		const mesh = new THREE.SkinnedMesh(geometry, [side, side, side, side, front, back]);
		mesh.frustumCulled = false;
		bones.forEach((b) => { mesh.add(b); b.updateMatrixWorld(true); });
		mesh.bind(skeleton);
		mesh.castShadow = true;
		mesh.receiveShadow = true; // тень отогнутого угла ложится на сам лист — видно, что угол загнут, а не скруглён
		stMesh = mesh;
		const group = new THREE.Group();
		group.add(mesh);
		stScene.add(group);

		// свет и тень — как в образце
		stScene.add(new THREE.AmbientLight(0xffffff, 0.3));
		// блик глянца — мягкое пятно правее и ниже середины листа, ближе к загибу (в долях размера листа)
		const gloss = new THREE.PointLight(0xffffff, 1.1, 0, 0);
		gloss.position.set(w * 0.32, -h * 0.29, Math.max(w, h) * 0.77);
		stScene.add(gloss);
		const light = new THREE.DirectionalLight(0xffffff, 2);
		light.position.set(ST.shadow.x, ST.shadow.y, 400);
		light.castShadow = true;
		light.shadow.mapSize.set(1024, 1024); // мягкой тени (radius 8) хватает — вчетверо легче
		light.shadow.camera.near = 1;
		light.shadow.camera.far = 2000;
		light.shadow.bias = -0.0004;
		light.shadow.normalBias = 1.5; // без «ряби» тени на плоском листе
		light.shadow.radius = 8;
		const size = Math.max(cw, ch);
		light.shadow.camera.left = -size / 2 + ST.shadow.x * 0.3;
		light.shadow.camera.right = size / 2 + ST.shadow.x * 0.3;
		light.shadow.camera.top = size / 2 + ST.shadow.y * 0.3;
		light.shadow.camera.bottom = -size / 2 + ST.shadow.y * 0.3;
		light.shadow.camera.updateProjectionMatrix();
		stScene.add(light);
		const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity: ST.shadow.opacity / 100, color: new THREE.Color(ST.shadow.color) }));
		plane.receiveShadow = true;
		plane.position.set(0, 0, -1);
		stScene.add(plane);
		return { cw, ch };
	}

	// изгиб: решётка костей, линия сгиба поперёк направления загиба, за ней бумага ложится полукругом (updateBones)
	function bendSticker() {
		if (!stMesh || !stBones.length) return;
		const amount = Math.min(1, Math.max(0, sticker.amount));
		const curlStart = 1 - amount;
		const curlFactor = amount <= 0 ? 1e-4 : ST.curlFactor;
		const { width, height } = stMesh.geometry.parameters;
		const rot = ST.rotation * (Math.PI / 180);
		const dx = Math.cos(rot), dy = Math.sin(rot);
		_axis.set(-dy, dx, 0).normalize();
		const hw = width / 2, hh = height / 2;
		const maxAlong = Math.max(hw * dx + hh * dy, hw * dx - hh * dy, -hw * dx + hh * dy, -hw * dx - hh * dy);
		const maxFromCenter = Math.sqrt(width * width + height * height) / 2;
		const foldOffset = -maxAlong + curlStart * 2 * maxAlong;
		const radius = ST.curlR * maxFromCenter;
		const RPrime = radius / curlFactor;
		const arcLimit = Math.PI * radius;
		for (let k = 0; k < stBones.length; k++) {
			const bone = stBones[k];
			const p0 = stInit[k];
			const signed = p0.x * dx + p0.y * dy - foldOffset;
			if (signed > 0) {
				let xRel, zRel, ang;
				const a = (signed * curlFactor) / radius;
				if (signed <= arcLimit) {
					xRel = RPrime * Math.sin(a);
					zRel = RPrime * (1 - Math.cos(a));
					ang = a;
				} else {
					const Phi = Math.PI * curlFactor;
					const extra = signed - arcLimit;
					xRel = RPrime * Math.sin(Phi) + extra * Math.cos(Phi);
					zRel = RPrime * (1 - Math.cos(Phi)) + extra * Math.sin(Phi);
					ang = Phi;
				}
				const d = xRel - signed;
				bone.position.set(p0.x + d * dx, p0.y + d * dy, p0.z + zRel);
				_q.setFromAxisAngle(_axis, -ang);
				bone.quaternion.copy(_q);
			} else {
				bone.position.copy(p0);
				bone.quaternion.identity();
			}
		}
		stMesh.updateMatrixWorld(true);
		stMesh.skeleton.update();
		if (stR) stR.shadowMap.needsUpdate = true;
	}

	// лицо наклейки: бумага и написанная часть рукописи (рукопись — в координатах страницы, наклейка повёрнута).
	// Рисуется не на каждом кадре письма, а только перед отправкой в видеокарту (uploadSheet, ~25 раз в секунду)
	const drawSheet = () => {
		const S = layout && layout.sheet;
		if (!S || !sticker.ok) return;
		const ctx = sheetCanvas.getContext('2d');
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, S.w, S.h);
		ctx.fillStyle = PAPER_COLOR;
		ctx.beginPath();
		if (ctx.roundRect) ctx.roundRect(0, 0, S.w, S.h, S.r); else ctx.rect(0, 0, S.w, S.h);
		ctx.fill();
		ctx.save();
		ctx.translate(S.w / 2, S.h / 2);
		ctx.rotate(-S.a);
		ctx.translate(-(S.x + S.w / 2), -(S.y + S.h / 2));
		handwriting(ctx, true);
		ctx.restore();
	};
	// в видеокарту лист уходит не чаще ~25 раз в секунду (stickerFrame): ручка пишет плавно, кадры лёгкие
	sticker.paint = () => { sticker.pending = true; };
	// новая картинка листа — перерисовать наклейку, но без пересчёта изгиба и тени: от текста они не зависят
	const uploadSheet = () => { drawSheet(); stTex.needsUpdate = true; sticker.pending = false; sticker.dirty = true; };

	// под новый размер листа: холсты, сетка, место на экране
	sticker.resize = () => {
		const S = layout && layout.sheet;
		if (!S || !stR) return;
		const key = `${Math.round(S.w)}x${Math.round(S.h)}x${dpr}`;
		if (sticker.size !== key) {
			sheetCanvas.width = backCanvas.width = Math.round(S.w * dpr);
			sheetCanvas.height = backCanvas.height = Math.round(S.h * dpr);
			stTex.dispose();
			stBack.dispose();
			const bx = backCanvas.getContext('2d');
			bx.setTransform(dpr, 0, 0, dpr, 0, 0);
			bx.clearRect(0, 0, S.w, S.h);
			bx.fillStyle = ST.back;
			bx.beginPath();
			if (bx.roundRect) bx.roundRect(0, 0, S.w, S.h, S.r); else bx.rect(0, 0, S.w, S.h);
			bx.fill();
			stBack.needsUpdate = true;
			sticker.box = buildSticker(S.w, S.h);
			sticker.size = key;
		}
		const { cw, ch } = sticker.box;
		stEl.style.transform = `translate(${(S.x + S.w / 2 - cw / 2).toFixed(1)}px, ${(S.y + S.h / 2 - ch / 2).toFixed(1)}px) rotate(${S.a}rad)`;
		sticker.ok = true;
		bendSticker();
		sticker.dirty = true;
	};

	// угол листа под курсором? — по расстоянию до самого угла, в координатах сцены
	const nearCorner = (e) => {
		const c = layout && layout.curl;
		if (!c || !sticker.on) return false;
		const r = stage.parentElement.getBoundingClientRect();
		return Math.hypot(e.clientX - r.left - c.x, e.clientY - r.top - c.y) < Math.max(90, layout.sheet.h * 0.5);
	};
	window.addEventListener('pointermove', (e) => {
		const on = nearCorner(e);
		if (on !== sticker.hover) stage.parentElement.style.cursor = on ? 'pointer' : '';
		sticker.hover = on;
		if (!on) sticker.press = false;
	}, { passive: true });
	window.addEventListener('pointerdown', (e) => { if (nearCorner(e)) sticker.press = true; }, { passive: true });
	window.addEventListener('pointerup', () => { sticker.press = false; }, { passive: true });

	// каждый кадр: наклейка видна только в покое; отгиб плавно идёт к нужному (как tween 0.6 с easeInOut)
	function stickerFrame(p, now) {
		const want = !!(sticker.ok && stR && fontsReady && !reduced && !glLost && layout && p < 0.01);
		if (want !== sticker.on) {
			sticker.on = want;
			// гаснет сразу (облёт начинается без двойного листа), проявляется плавно
			stEl.style.transition = want ? '' : 'none';
			stEl.style.opacity = want ? '1' : '0';
			if (!want && stage.parentElement.style.cursor) stage.parentElement.style.cursor = '';
			renderPage(); // лист — то в наклейке, то снова в текстуре сцены
		}
		if (!sticker.on) { sticker.t = now; return; }
		const dt = Math.min(0.05, (now - (sticker.t || now)) / 1000);
		sticker.t = now;
		if (sticker.pending && now - (sticker.upAt || 0) >= 40) { uploadSheet(); sticker.upAt = now; }
		const target = sticker.press ? ST.peel.press : sticker.hover ? ST.peel.hover : ST.peel.rest;
		const prev = sticker.amount;
		sticker.amount += (target - sticker.amount) * (1 - Math.exp(-dt / 0.2));
		const bent = Math.abs(sticker.amount - prev) > 1e-5;
		if (bent) bendSticker(); // изгиб и тень — только когда уголок правда двигается
		if (bent || sticker.dirty) {
			stR.render(stScene, stCam);
			sticker.dirty = false;
		}
	}

	// рукопись: написанная часть строк; draw — рисовать ли (иначе только найти кончик ручки)
	function handwriting(ctx, draw) {
		ctx.fillStyle = PEN_INK;
		ctx.textBaseline = 'alphabetic';
		let left = written;
		let tip = null;
		for (const l of layout.lines) {
			if (left <= 0) break;
			const show = Math.min(l.w, left);
			if (draw) {
				ctx.save();
				ctx.beginPath();
				ctx.rect(l.x - l.size * 0.3, l.y - l.size * 1.2, show + l.size * 0.3, l.size * 1.8);
				ctx.clip();
				ctx.font = `${l.size}px ${HAND_FONT}, cursive`;
				ctx.fillText(l.t, l.x, l.y);
				ctx.restore();
			}
			tip = { x: l.x + show, y: l.y - l.size * 0.12 };
			left -= l.w;
		}
		return tip;
	}

	// кадр страницы: основа + написанная часть рукописи; возвращает, где сейчас кончик ручки.
	// В покое лист с рукописью — в наклейке, в текстуре сцены остаётся только заголовок.
	// В облёте в текстуру ложится снимок самой наклейки — с тем же скатанным уголком и тенью, что в покое
	// (без видеокарты для наклейки — прежний лист с загибом из основы)
	let pageMode = ''; // что сейчас в текстуре страницы: 'title' (покой, лист — в наклейке) или полный лист
	// сцену перерисовываем только когда что-то изменилось: камера сдвинулась, обновилась страница или догрузился снимок.
	// В покое кадр не меняется — видеокарта отдыхает, ручка и наклейка рисуются отдельно
	let sceneDirty = true;
	function renderPage() {
		if (!layout) return null;
		// покой: текстура страницы — один заголовок, он не меняется; на каждом кадре письма обновляем только наклейку
		if (sticker.on && pageMode === 'title') {
			sticker.paint();
			return handwriting(pageCanvas.getContext('2d'), false);
		}
		pageMode = sticker.on ? 'title' : 'full';
		const ctx = pageCanvas.getContext('2d');
		const snap = !sticker.on && sticker.ok && !!stR && !!stMesh && !!sticker.box;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
		ctx.drawImage(sticker.on || snap ? titleCanvas : baseCanvas, 0, 0);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const tip = handwriting(ctx, !sticker.on && !snap);
		if (sticker.on || snap) sticker.paint();
		if (snap) {
			// кадр наклейки читаем сразу после отрисовки — до этого браузер холст не очищает
			uploadSheet();
			bendSticker();
			stR.render(stScene, stCam);
			const S = layout.sheet;
			const { cw, ch } = sticker.box;
			ctx.save();
			ctx.translate(S.x + S.w / 2, S.y + S.h / 2);
			ctx.rotate(S.a);
			ctx.drawImage(stEl, -cw / 2, -ch / 2, cw, ch);
			ctx.restore();
		}
		pageTex.needsUpdate = true;
		sceneDirty = true;
		return tip;
	}

	// ---------- рендер ----------
	// Плоский лист — тот же холст, что сцена берёт как картинку страницы: заголовок, лист и пишущаяся цитата.
	// Он показывается вместо 3D, когда браузер не дал видеокарту (после нескольких сбоев Chrome отключает WebGL
	// до перезапуска) или видеокарта сбросила сцену. Ручка пишет дальше; вернулась сцена — лист снова в ней
	let glLost = false;
	pageCanvas.className = 'ge__flat';
	pageCanvas.setAttribute('aria-hidden', 'true');
	const showFlat = (on) => {
		glLost = on;
		if (renderer) renderer.domElement.style.visibility = on ? 'hidden' : '';
		if (on && !pageCanvas.parentNode) stage.appendChild(pageCanvas);
		if (!on) pageCanvas.remove();
	};
	let renderer = null;
	try {
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(dpr);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap; // мягкие тени без лишних проходов (VSM нагружал видеокарту)
		// предметы и свет неподвижны, двигается только камера — карта теней считается один раз, а не каждый кадр
		renderer.shadowMap.autoUpdate = false;
		renderer.shadowMap.needsUpdate = true;
		stage.appendChild(renderer.domElement);
		renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); showFlat(true); });
		renderer.domElement.addEventListener('webglcontextrestored', () => {
			showFlat(false);
			pageTex.needsUpdate = true;
			renderer.shadowMap.needsUpdate = true;
			sceneDirty = true;
			resize(); // тени, размеры и картинка листа — заново
		});
	} catch (err) {
		renderer = null;
		showFlat(true);
	}

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
	key.shadow.mapSize.set(1024, 1024);
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
	const photoTex = (src) => { const t = loader.load(src, () => { sceneDirty = true; warmSoon(); }); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

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
		sceneDirty = true;
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
		if (renderer) renderer.setSize(W, H, false);
		sceneDirty = true;
		pageCanvas.style.width = `${W}px`;
		pageCanvas.style.height = `${H}px`;
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

	// ---------- путь камеры ----------
	// одна плавная кривая через все точки облёта: камера нигде не замирает и не дёргается на поворотах.
	// Сдвиг камеры (x, y, z) и крен — общей кривой: покой → слева сверху → справа снизу → покой
	const PATH = new THREE.CatmullRomCurve3([
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(-9, 3, -3),
		new THREE.Vector3(-16, 5, -6),
		new THREE.Vector3(14, -6, -8),
		new THREE.Vector3(5, -2, -3),
		new THREE.Vector3(0, 0, 0),
	], false, 'centripetal');
	const ROLL = new THREE.CatmullRomCurve3([0, -0.08, -0.18, 0.16, 0.06, 0].map((r) => new THREE.Vector3(r, 0, 0)), false, 'catmullrom');
	const ease = (t) => t * t * (3 - 2 * t);
	const span01 = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
	const camPoint = new THREE.Vector3();
	function cameraAt(p) {
		const u = Math.min(1, Math.max(0, p));
		PATH.getPoint(u, camPoint);
		return { x: camPoint.x, y: camPoint.y, z: camPoint.z, roll: ROLL.getPoint(u).x };
	}

	// полёт камеры по сцене: 0 — покой (плоская страница), дальше — облёт. Его ведёт не прокрутка, а переход
	// в зал (js/gallery-transition.js): нажатие на приглашение — полёт с переворотом, обратно — тот же путь назад
	const flight = { p: 0 };
	window.galleryEntry = { flight, root, pin: stage.parentElement, invite };
	let visible = true;
	if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);

	let renderedP = -1; // при каком положении камеры нарисован последний кадр сцены

	// прогрев: пока экран ещё не виден, в свободную минуту браузера рисуем сцену один раз «вхолостую» —
	// снимки, лист с цитатой и карта теней уходят в видеокарту заранее. Иначе всё это грузилось на первом кадре,
	// когда экран подъезжал снизу, и прокрутка «Я фотограф» спотыкалась на 0,1–0,2 секунды
	let warmT = 0;
	function warmSoon() {
		clearTimeout(warmT);
		warmT = setTimeout(() => {
			const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
			idle(() => {
				if (!renderer || glLost || visible) return; // экран уже виден — его и так рисует frame()
				renderer.render(scene, camera);
				if (stR && stScene.children.length) stR.render(stScene, stCam);
			}, { timeout: 2000 });
		}, 300);
	}
	if (document.readyState === 'complete') warmSoon(); else window.addEventListener('load', warmSoon, { once: true });
	function frame() {
		if (!visible) return;
		const p = flight.p;
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
		writeFrame(p);
		stickerFrame(p, performance.now());
		if (renderer && !glLost && (sceneDirty || p !== renderedP)) {
			renderer.render(scene, camera);
			renderedP = p;
			sceneDirty = false;
		}
	}

	// ---------- рукопись: ручка пишет цитату, когда экран встал перед зрителем ----------
	let fontsReady = false;
	let writing = false;
	let lastT = 0;
	const pen = { x: 0, y: 0 };
	let travel = null; // переход ручки к началу следующей строки
	function writeFrame(p) {
		if (!layout || !fontsReady) return;
		const now = performance.now();
		const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
		lastT = now;
		const atRest = p < 0.01;
		if (reduced || p > 0.02) {
			// без анимации или уже в облёте — цитата дописана целиком
			if (written < layout.total) { written = layout.total; renderPage(); }
		} else if (!writing && written < layout.total && atRest && root.getBoundingClientRect().top < window.innerHeight * 0.35) {
			writing = true;
		}
		// кончик пера всегда там, где проявляется буква: текст пишется ровно под ним.
		// Дописав строку, ручка приподнимается и плавно переходит к началу следующей — текст ждёт её
		let active = false;
		if (writing && written < layout.total) {
			active = true;
			if (travel) {
				travel.t = Math.min(1, travel.t + dt / 0.7);
				const e = ease(travel.t);
				pen.x = travel.from.x + (travel.to.x - travel.from.x) * e;
				pen.y = travel.from.y + (travel.to.y - travel.from.y) * e - Math.sin(Math.PI * e) * layout.size * 0.5; // приподнята над листом
				if (travel.t >= 1) travel = null;
			} else {
				// граница строки впереди: на ней ручка останавливается и переходит на следующую
				let edge = 0;
				let next = null;
				for (let i = 0; i < layout.lines.length; i++) {
					edge += layout.lines[i].w;
					if (edge > written + 0.01) { next = layout.lines[i + 1] || null; break; }
				}
				let step = written + layout.size * 5 * dt; // скорость — как у неторопливого почерка
				const lineEnd = step >= edge && next;
				if (lineEnd) step = edge;
				written = Math.min(layout.total, step);
				const tip = renderPage();
				if (tip) { pen.x = tip.x; pen.y = tip.y + Math.sin(now / 220) * layout.size * 0.015; }
				if (lineEnd) travel = { t: 0, from: { x: pen.x, y: pen.y }, to: { x: next.x, y: next.y - next.size * 0.12 } };
				if (written >= layout.total) { writing = false; active = false; }
			}
		}
		// дописала — уходит вниз-вправо
		const w = layout.size * 8;
		const show = active && atRest;
		hand.style.width = `${w}px`;
		hand.style.opacity = show ? '1' : '0';
		const s = w / HAND_VB;
		const away = show ? 0 : layout.size * 2;
		hand.style.transform = `translate(${(pen.x - HAND_TIP.x * s + away).toFixed(1)}px, ${(pen.y - HAND_TIP.y * s + away).toFixed(1)}px)`;
	}

	// ---------- запуск ----------
	resize();
	// шейдеры сцены и наклейки собираются заранее, в фоне: иначе сборка случалась на первом кадре,
	// когда экран подъезжал снизу, — и прокрутка «Я фотограф» спотыкалась на треть секунды
	if (renderer && renderer.compileAsync) renderer.compileAsync(scene, camera).catch(() => {});
	if (stR && stR.compileAsync && stScene.children.length) stR.compileAsync(stScene, stCam).catch(() => {});
	if (document.fonts) {
		Promise.all(['500 40px Inter', '40px Lemon'].map((f) => document.fonts.load(f)))
			.then(() => { drawPage(stage.clientWidth || window.innerWidth, stage.clientHeight || window.innerHeight); fontsReady = true; warmSoon(); });
	} else fontsReady = true;
	let resizeTimer = 0;
	window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
	// шрифт рукописи догрузился позже — перерисовать лист, но не сбрасывать уже написанное
	if (document.fonts) document.fonts.addEventListener('loadingdone', () => { if (fontsReady) drawPage(stage.clientWidth || window.innerWidth, stage.clientHeight || window.innerHeight); });

	gsap.ticker.add(frame);
}
