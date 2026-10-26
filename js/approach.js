// «Мой подход»: полноэкранные слайды из js/approach-data.js.
// Фон — WebGL: смена снимка через «растекание» (карта искажений считается прямо в шейдере).
// Снимки в рамках уезжают вверх и вытягиваются, новые приходят снизу; фраза меняется построчно.
// По мотивам Fashion concept Jesper Landberg (https://codepen.io/ReGGae/pen/bmyYEj), переписано на GSAP 3 и three.js r170.
// Два режима: отдельная страница approach.html (листает колесо, свайп, клавиши)
// и пятый блок главной (.sl--section): блок закреплён на экране, слайды меняет обычная прокрутка страницы.
import * as THREE from 'three';

const slides = window.APPROACH || [];
const gsap = window.gsap;
const root = document.querySelector('.sl');
if (root && gsap && slides.length) init();

function init() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const T = reduced ? 0.01 : 1; // множитель длительностей
    const section = root.classList.contains('sl--section');
    root.style.setProperty('--sl-n', slides.length);

    const pin = root.querySelector('.sl__pin');
    const head = root.querySelector('.sl__head');
    const slidesEl = root.querySelector('.sl__slides');
    const bulletsEl = root.querySelector('.sl__bullets');
    const bgEl = root.querySelector('.sl__bg');
    const hint = root.querySelector('.sl__hint');
    const status = root.querySelector('[data-sl="status"]');

    // короткие предлоги, союзы и частицы не остаются в конце строки (цепочки вроде «а не» — тоже),
    // тире держится за предыдущее слово
    const glue = (text) => text
        .replace(/(?<=^|[\s(«])(в|во|на|у|с|со|к|ко|о|об|от|из|до|по|за|под|над|при|без|для|про|и|а|но|или|не|ни|я|что)\s+/gi, '$1 ')
        .replace(/\s+—/g, ' —');

    // ---------- разметка ----------
    const els = slides.map((s, i) => {
        const slide = document.createElement('section');
        slide.className = 'sl__slide';
        slide.setAttribute('aria-roledescription', 'слайд');
        slide.setAttribute('aria-label', `${i + 1} из ${slides.length}`);

        const imgs = s.photos.slice(0, 2).map((p, k) => {
            const fig = document.createElement('figure');
            fig.className = 'sl__img ' + (k ? 'sl__img--b' : 'sl__img--a');
            const img = document.createElement('img');
            img.src = p.src;
            img.alt = p.alt || '';
            img.decoding = 'async';
            if (i > 0) img.loading = 'lazy';
            fig.appendChild(img);
            slide.appendChild(fig);
            return fig;
        });

        const text = document.createElement('p');
        text.className = 'sl__text';
        slide.appendChild(text);
        slidesEl.appendChild(slide);

        const bullet = document.createElement('button');
        bullet.type = 'button';
        bullet.className = 'sl__bullet';
        bullet.setAttribute('aria-label', `Слайд ${i + 1}`);
        bullet.innerHTML = `<span class="sl__bullet-text">${String(i + 1).padStart(2, '0')}</span><span class="sl__bullet-line"></span>`;
        bulletsEl.appendChild(bullet);

        return { slide, imgs, text, phrase: glue(s.text), note: s.note ? glue(s.note) : '', lines: [], bullet };
    });

    // фраза разбивается на строки по фактической ширине — каждая строка под своей маской
    function splitLines(e) {
        e.text.textContent = '';
        // переносы по смыслу: | — на всех экранах, / — только на телефоне, ~ — только на планшете и компьютере
        const words = e.phrase.split(/[ ]+/).filter(Boolean).map((w) => {
            if (w === '|' || w === '/' || w === '~') {
                const br = document.createElement('br');
                if (w === '/') br.className = 'sl__br-m';
                if (w === '~') br.className = 'sl__br-d';
                e.text.appendChild(br);
                return null;
            }
            const span = document.createElement('span');
            span.textContent = w;
            e.text.appendChild(span);
            e.text.appendChild(document.createTextNode(' '));
            return span;
        });
        const rows = [];
        words.filter(Boolean).forEach((w) => {
            const top = w.offsetTop;
            const row = rows.find((r) => Math.abs(r.top - top) < 4);
            if (row) row.words.push(w.textContent);
            else rows.push({ top, words: [w.textContent] });
        });
        e.text.textContent = '';
        e.lines = rows.map((r) => {
            const line = document.createElement('span');
            line.className = 'sl__line';
            const inner = document.createElement('span');
            inner.textContent = r.words.join(' ');
            line.appendChild(inner);
            e.text.appendChild(line);
            return inner;
        });
        // гарантия мелким шрифтом под фразой — выезжает следом за строками
        if (e.note) {
            const line = document.createElement('span');
            line.className = 'sl__line sl__line--note';
            const inner = document.createElement('span');
            inner.textContent = e.note;
            line.appendChild(inner);
            e.text.appendChild(line);
            e.lines.push(inner);
        }
    }

    // разбивать можно только видимый текст — на время замера слайд показываем
    function splitAll() {
        els.forEach((e) => {
            const was = e.slide.style.visibility;
            e.slide.style.visibility = 'hidden';
            e.slide.style.display = 'block';
            e.slide.classList.add('is-measuring');
            e.text.style.minHeight = '';
            splitLines(e);
            e.slide.classList.remove('is-measuring');
            e.slide.style.visibility = was;
        });
        // у всех фраз высота — по самой длинной: первая строка на каждом слайде на одном уровне, без «лесенки»
        const h = Math.max(...els.map((e) => e.text.offsetHeight));
        els.forEach((e) => { e.text.style.minHeight = `${h}px`; });
        layout(h);
    }

    // телефон и планшет: заголовок с цитатой сверху, снимки — в остаток экрана над фразой.
    // Высоту снимков считаем здесь, CSS берёт готовые числа (--head-b, --img-h)
    function layout(textH) {
        const pinH = pin.clientHeight;
        const headB = head ? head.offsetTop + head.offsetHeight : 0;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        // отступ под заголовком + сдвиг правого снимка + отступ до фразы + поле снизу
        // на странице под фразой — кнопка «мои работы»: снимки уступают ей место
        const works = pin.querySelector('.sl__works');
        const worksH = works ? works.offsetHeight + rem * 1.5 : 0;
        const gaps = rem * (1.25 + 3 + 1.5 + 2) + worksH;
        const imgH = Math.max(rem * 8, pinH - headB - gaps - textH);
        pin.style.setProperty('--head-b', `${headB}px`);
        pin.style.setProperty('--img-h', `${imgH}px`);
        pin.style.setProperty('--text-h', `${textH}px`);
    }

    // ---------- фон ----------
    const bg = createBackground();

    // ---------- состояние ----------
    let current = 0;
    let busy = true; // до появления первого слайда переходов нет
    let hinted = false;
    let want = 0; // слайд, к которому прокрутили (режим блока): переход к нему — как только закончится текущий
    const settle = () => { busy = false; if (want !== current) go(want); };

    const setBullet = (i, on, dur) => {
        const b = els[i].bullet;
        b.classList.toggle('is-current', on);
        b.setAttribute('aria-current', on ? 'true' : 'false');
        gsap.set(b.querySelector('.sl__bullet-line'), { transformOrigin: on ? 'right' : 'left' });
        gsap.to(b.querySelector('.sl__bullet-line'), { scaleX: on ? 1 : 0, duration: dur, ease: 'expo.inOut' });
    };

    const announce = (i) => { status.textContent = `${i + 1} из ${slides.length}: ${slides[i].text.split(/[|/~]/).map((t) => t.trim()).join(' ')} ${slides[i].note || ''}`; };

    // первый слайд — появление
    function intro() {
        const e = els[0];
        e.slide.classList.add('is-current');
        setBullet(0, true, 1.2 * T);
        announce(0);
        gsap.timeline({ onComplete: settle })
            .fromTo(e.imgs, { yPercent: 120, scaleY: 1.4 }, { yPercent: 0, scaleY: 1, duration: 1.5 * T, ease: 'expo.out', stagger: 0.1 * T }, 0.1)
            .fromTo(e.lines, { yPercent: 105 }, { yPercent: 0, duration: 1.3 * T, ease: 'power4.out', stagger: 0.08 * T }, 0.5);
    }

    // ---------- переход ----------
    function go(to) {
        if (busy) return;
        const n = els.length;
        to = (to + n) % n;
        if (to === current) return;
        want = to; // иначе на странице после перехода settle вернул бы прежний слайд
        busy = true;
        // на странице слайды идут по кругу, в блоке главной — только вперёд и назад по прокрутке
        const down = section ? to > current
            : to > current ? !(current === 0 && to === n - 1) : (current === n - 1 && to === 0);
        const from = current;
        current = to;
        const a = els[from];
        const b = els[to];
        const s = down ? 1 : -1;

        if (!hinted) {
            hinted = true;
            gsap.to(hint, { autoAlpha: 0, y: 20, duration: 0.8 * T, ease: 'power4.inOut' });
        }

        bg.transition(to, 2 * T);
        setBullet(from, false, 1.2 * T);
        setBullet(to, true, 1.2 * T);
        announce(to);

        gsap.timeline({ onComplete: settle })
            // уходящие снимки — вверх (или вниз), вытягиваясь
            .to(a.imgs, { yPercent: -185 * s, scaleY: 1.5, duration: 1.2 * T, ease: 'expo.inOut', stagger: 0.07 * T }, 0)
            .to(a.lines, { yPercent: -105 * s, duration: 1 * T, ease: 'power4.inOut', stagger: 0.05 * T }, 0)
            .add(() => {
                a.slide.classList.remove('is-current');
                b.slide.classList.add('is-current');
            }, 0.9 * T)
            // новые снимки приходят с другой стороны
            .fromTo(b.imgs, { yPercent: 150 * s, scaleY: 1.5 }, { yPercent: 0, scaleY: 1, duration: 1.3 * T, ease: 'expo.out', stagger: 0.07 * T }, 0.9 * T)
            .fromTo(b.lines, { yPercent: 105 * s }, { yPercent: 0, duration: 1.2 * T, ease: 'power4.out', stagger: 0.07 * T }, 1.1 * T);
    }

    // ---------- управление ----------
    if (section) {
        // блок главной: слайд выбирает прокрутка — у каждого слайда своя точка: первый в начале блока, последний в конце
        const n = els.length;
        const ST = window.ScrollTrigger;
        const pick = (p) => Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))));
        const request = (i) => { want = i; if (!busy) go(want); };
        const scrollSpan = () => root.offsetHeight - window.innerHeight;
        const startY = () => root.getBoundingClientRect().top + window.scrollY;
        const pointY = (i) => startY() + (i / (n - 1)) * scrollSpan();

        if (ST) {
            ST.create({ trigger: root, start: 'top top', end: 'bottom bottom', onUpdate: (self) => request(pick(self.progress)) });
        } else {
            window.addEventListener('scroll', () => request(pick((window.scrollY - startY()) / scrollSpan())), { passive: true });
        }

        // прокрутка остановилась между слайдами — страница плавно доезжает до ближайшего (на компьютере)
        const desk = window.matchMedia('(min-width: 1024px)');
        if (window.lenis) {
            let snapTimer = 0;
            window.lenis.on('scroll', () => {
                clearTimeout(snapTimer);
                snapTimer = setTimeout(() => {
                    if (!desk.matches) return;
                    const y = window.scrollY;
                    const p = (y - startY()) / scrollSpan();
                    if (p <= 0 || p >= 1) return;
                    const target = pointY(pick(p));
                    if (Math.abs(target - y) > 2) window.lenis.scrollTo(target, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3) });
                }, 180);
            });
        }

        // номер слайда — прокрутка к его точке
        els.forEach((e, i) => e.bullet.addEventListener('click', () => {
            if (window.lenis) window.lenis.scrollTo(pointY(i), { duration: 1.2 });
            else window.scrollTo({ top: pointY(i), behavior: 'smooth' });
        }));
    } else {
        els.forEach((e, i) => e.bullet.addEventListener('click', () => go(i)));

        // колёсико: одна прокрутка — один слайд
        let wheelLock = 0;
        window.addEventListener('wheel', (ev) => {
            if (Math.abs(ev.deltaY) < 8) return;
            const now = Date.now();
            if (busy || now < wheelLock) return;
            wheelLock = now + 600;
            go(current + (ev.deltaY > 0 ? 1 : -1));
        }, { passive: true });

        // свайп вверх/вниз
        let y0 = null;
        root.addEventListener('pointerdown', (ev) => { y0 = ev.clientY; });
        root.addEventListener('pointerup', (ev) => {
            if (y0 === null) return;
            const dy = ev.clientY - y0;
            y0 = null;
            if (Math.abs(dy) > 40) go(current + (dy < 0 ? 1 : -1));
        });

        document.addEventListener('keydown', (ev) => {
            if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); go(current + 1); }
            if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(ev.key)) { ev.preventDefault(); go(current - 1); }
        });
    }

    // ресайз — строки фразы пересчитываются по новой ширине
    let rt;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            if (busy) return;
            splitAll();
            bg.resize();
        }, 200);
    });

    // старт: ждём шрифт (от него зависят строки) и первый фон
    const fonts = document.fonts ? document.fonts.load('300 48px Inter', 'Ая').catch(() => {}) : Promise.resolve();
    fonts.then(() => {
        splitAll();
        els.forEach((e, i) => { if (i) gsap.set(e.lines, { yPercent: 105 }); });
        // блок главной появляется, когда до него докрутили; страница — сразу
        if (section && window.ScrollTrigger) {
            window.ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: () => bg.ready.then(intro) });
        } else {
            bg.ready.then(intro);
        }
    });

    // ---------- фон: WebGL или запасной вариант ----------
    function createBackground() {
        const urls = slides.map((s) => s.bg.src);

        // запасной вариант без WebGL — просто плавная смена снимков
        const fallback = () => {
            const imgs = urls.map((u, i) => {
                const im = document.createElement('img');
                im.className = 'sl__bg-img' + (i === 0 ? ' is-current' : '');
                im.src = u;
                im.alt = '';
                bgEl.appendChild(im);
                return im;
            });
            return {
                ready: Promise.resolve(),
                transition: (to) => imgs.forEach((im, i) => im.classList.toggle('is-current', i === to)),
                resize: () => {},
            };
        };

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
        } catch (err) {
            return fallback();
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(bgEl.clientWidth, bgEl.clientHeight, false);
        bgEl.prepend(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const uniforms = {
            tex1: { value: null },
            tex2: { value: null },
            size1: { value: new THREE.Vector2(1, 1) },
            size2: { value: new THREE.Vector2(1, 1) },
            res: { value: new THREE.Vector2(bgEl.clientWidth, bgEl.clientHeight) },
            progress: { value: 0 },
            intensity: { value: 0.35 },
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D tex1, tex2;
                uniform vec2 size1, size2, res;
                uniform float progress, intensity;

                // снимок заполняет экран без растягивания (как background-size: cover)
                vec2 cover(vec2 uv, vec2 img) {
                    float s = res.x / res.y, r = img.x / img.y;
                    vec2 k = s < r ? vec2(s / r, 1.0) : vec2(1.0, r / s);
                    return (uv - 0.5) * k + 0.5;
                }

                // карта искажений — шум прямо в шейдере
                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
                float noise(vec2 p) {
                    vec2 i = floor(p), f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0, a = 0.5;
                    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
                    return v;
                }

                void main() {
                    vec2 uv = vUv;
                    vec2 d = vec2(fbm(uv * 3.0), fbm(uv * 3.0 + 7.3)) - 0.5;
                    vec2 p1 = cover(uv + d * intensity * progress, size1);
                    vec2 p2 = cover(uv - d * intensity * (1.0 - progress), size2);
                    vec4 c = mix(texture2D(tex1, p1), texture2D(tex2, p2), progress);
                    // цветной фон, чуть притемнён — снимки в рамках и фраза на первом плане
                    vec3 col = c.rgb * 0.62;
                    gl_FragColor = vec4(col, 1.0);
                }`,
        });
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

        const render = () => renderer.render(scene, camera);
        const loader = new THREE.TextureLoader();
        const textures = [];
        const load = (i) => textures[i] || (textures[i] = new Promise((resolve) => {
            loader.load(urls[i], (t) => {
                t.minFilter = THREE.LinearFilter;
                t.generateMipmaps = false;
                t.colorSpace = THREE.SRGBColorSpace;
                resolve(t);
            }, undefined, () => resolve(null));
        }));
        const sizeOf = (t, i) => (t && t.image ? new THREE.Vector2(t.image.naturalWidth || t.image.width, t.image.naturalHeight || t.image.height) : new THREE.Vector2(slides[i].bg.w, slides[i].bg.h));

        const ready = load(0).then((t) => {
            uniforms.tex1.value = t;
            uniforms.size1.value = sizeOf(t, 0);
            uniforms.tex2.value = t;
            uniforms.size2.value = sizeOf(t, 0);
            render();
            // остальные фоны — заранее, чтобы переход не ждал загрузки
            urls.forEach((u, i) => { if (i) load(i); });
        });

        let tween = null;
        return {
            ready,
            transition(to, dur) {
                load(to).then((t) => {
                    if (tween) tween.progress(1);
                    uniforms.tex2.value = t;
                    uniforms.size2.value = sizeOf(t, to);
                    uniforms.progress.value = 0;
                    tween = gsap.to(uniforms.progress, {
                        value: 1,
                        duration: dur,
                        ease: 'expo.inOut',
                        onUpdate: render,
                        onComplete: () => {
                            uniforms.tex1.value = t;
                            uniforms.size1.value = sizeOf(t, to);
                            uniforms.progress.value = 0;
                            render();
                            tween = null;
                        },
                    });
                });
            },
            resize() {
                renderer.setSize(bgEl.clientWidth, bgEl.clientHeight, false);
                uniforms.res.value.set(bgEl.clientWidth, bgEl.clientHeight);
                render();
            },
        };
    }
}
