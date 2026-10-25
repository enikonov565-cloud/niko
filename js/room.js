// Галерея-комната (четвёртый экран): фото из js/gallery-photos.js висят на четырёх стенах.
// Шаг — стена проезжает к соседнему фото; в конце стены — поворот на 90° к следующей.
// Основа: Codrops 3D Gallery Room (https://tympanus.net/codrops/2013/01/15/3d-image-gallery-room/), без jQuery.
(() => {
    const section = document.querySelector('.room');
    const photos = (window.GALLERY_PHOTOS || []).filter((p) => p && p.src);
    if (!section || !photos.length) return;

    const stage = section.querySelector('.room__stage');
    const status = section.querySelector('.room__status');
    const btnPrev = section.querySelector('.room__step--prev');
    const btnNext = section.querySelector('.room__step--next');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const WALK = 800;  // мс — шаг вдоль стены
    const TURN = 1100; // мс — поворот к следующей стене
    const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
    // оттенок ламп у каждой стены: холодный лесной, тёплый закатный, нейтральный, сепия
    const LIGHTS = ['168, 205, 222', '242, 196, 140', '232, 226, 214', '222, 184, 146'];

    // размеры снимка: из списка, а если не указаны — узнаём у самого файла
    const measure = (p) => (p.w && p.h)
        ? Promise.resolve(p)
        : new Promise((resolve) => {
            const im = new Image();
            im.onload = () => { p.w = im.naturalWidth; p.h = im.naturalHeight; resolve(p); };
            im.onerror = () => resolve(null); // битый файл пропускаем
            im.src = p.src;
        });

    // строим комнату, когда до неё осталось меньше экрана — фото не грузятся раньше времени
    new IntersectionObserver((entries, io) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        // ждём и шрифт: от него зависит, сколько строк займёт название на этикетке
        // (начертания и кириллицу этикетки грузим явно — браузер скачивает шрифт, только когда текст им уже нарисован)
        const fontsReady = document.fonts
            ? Promise.all([document.fonts.load('500 11px Inter', 'Ая'), document.fonts.load('400 11px Inter', 'Ая')]).catch(() => {})
            : Promise.resolve();
        Promise.all([fontsReady, Promise.all(photos.map(measure))]).then(([, list]) => {
            const items = list.filter(Boolean);
            if (items.length) init(items);
        });
    }, { rootMargin: '100% 0px' }).observe(section);

    function init(items) {
        // стены делят снимки поровну, лишние достаются первым стенам
        const wallsCount = Math.min(4, items.length);
        const walls = [];
        let from = 0;
        for (let i = 0; i < wallsCount; i++) {
            const n = Math.floor(items.length / wallsCount) + (i < items.length % wallsCount ? 1 : 0);
            walls.push(items.slice(from, from + n));
            from += n;
        }

        let cw = 0;          // текущая стена
        let ci = 0;          // текущее фото на стене
        let walking = false;
        let wall = null;

        // ---------- стена: рамки по пропорциям фото, лампы над каждой ----------
        function build(index) {
            const el = document.createElement('div');
            el.className = 'room__wall';
            el.style.setProperty('--light', LIGHTS[index % LIGHTS.length]);
            el.style.width = stage.clientWidth + 'px';
            el.innerHTML = '<div class="room__track"></div><div class="room__floor"></div>';
            stage.appendChild(el);
            const floor = el.querySelector('.room__floor');

            const W = stage.clientWidth;
            const wallH = el.clientHeight;
            const track = el.querySelector('.room__track');
            const plinth = parseFloat(getComputedStyle(el, '::after').height) || 0;

            const frames = walls[index].map((p, i) => {
                const fig = document.createElement('figure');
                fig.className = 'room__frame';
                fig.dataset.i = i;
                const img = document.createElement('img');
                img.src = p.src;
                img.alt = p.alt || '';
                img.width = p.w;
                img.height = p.h;
                img.decoding = 'async';
                fig.appendChild(img);
                el.appendChild(fig);
                // этикетка на стене — как в настоящей галерее: название снимка и раздел мелким шрифтом
                const label = document.createElement('p');
                label.className = 'room__label';
                label.dataset.i = i;
                label.setAttribute('aria-hidden', 'true'); // для диктора то же самое уже есть в alt
                label.textContent = glue(p.label || p.alt || '');
                if (p.genre) {
                    const genre = document.createElement('span');
                    genre.className = 'room__label-genre';
                    genre.textContent = p.genre;
                    label.appendChild(genre);
                }
                el.appendChild(label);
                return { fig, img, label, p };
            });

            // рамка + паспарту вокруг фото — из CSS (clamp), читаем готовые пиксели
            const cs = getComputedStyle(frames[0].fig);
            const edge = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);

            // высота светильника — из CSS (clamp)
            const probe = add(el, 'room__lamp', {});
            const lampH = probe.offsetHeight;
            probe.remove();
            const zoneTop = track.offsetTop + track.offsetHeight + lampH;
            const zoneH = wallH - plinth - zoneTop;
            const frameH = Math.max(120, zoneH * 0.8);
            const maxW = W * (W < 768 ? 0.8 : 0.62);
            const gap = Math.min(448, Math.max(24, W * 0.175)); // как в макете: 336 на 1920
            // этикетка справа от рамки, по её нижнему краю; по центру экрана — рамка вместе с этикеткой.
            // Если справа не помещается (широкий снимок на телефоне) — этикетка под рамкой
            const labelGap = Math.round(edge * 0.6 + 6);

            let left = 0;
            let prevW = 0;
            const layout = frames.map((f, i) => {
                const ratio = f.p.w / f.p.h;
                let imgH = frameH - edge * 2;
                let imgW = imgH * ratio;
                if (imgW + edge * 2 > maxW) { // широкий снимок — уменьшаем целиком, без обрезки
                    imgW = maxW - edge * 2;
                    imgH = imgW / ratio;
                }
                let w = imgW + edge * 2;
                let h = imgH + edge * 2;
                const labelW = f.label.offsetWidth; // этикетки одного размера — из CSS
                const side = W >= 768 || w + labelGap + labelW <= W * 0.94;
                // этикетка под рамкой (только на телефоне) не помещается над плинтусом — снимок чуть меньше, ровно на сколько нужно
                if (!side) {
                    const room = zoneH - (f.label.offsetHeight + labelGap) - 4;
                    if (h > room) {
                        const k = (room - edge * 2) / imgH;
                        imgW *= k; imgH *= k;
                        w = imgW + edge * 2; h = imgH + edge * 2;
                    }
                }
                const groupW = side ? w + labelGap + labelW : w;
                left = i === 0 ? W / 2 - groupW / 2 : left + prevW + gap;
                prevW = groupW;
                // картины висят чуть выше середины — на уровне глаз; если этикетка под рамкой — место и под неё
                const below = side ? 0 : f.label.offsetHeight + labelGap;
                const top = zoneTop + Math.max(0, (zoneH - h - below) * 0.42);

                f.img.style.width = imgW + 'px';
                f.img.style.height = imgH + 'px';
                Object.assign(f.fig.style, { left: left + 'px', top: top + 'px' });
                Object.assign(f.label.style, side
                    ? { left: left + w + labelGap + 'px', top: top + h - f.label.offsetHeight + 'px' }
                    : { left: left + 'px', top: top + h + labelGap + 'px' });

                const cx = left + w / 2;
                const lamp = add(el, 'room__lamp', { left: cx + 'px' });
                const beamTop = track.offsetTop + track.offsetHeight + lampH - 2; // от линзы
                const beam = add(el, 'room__beam', {
                    left: cx - w * 0.65 + 'px', width: w * 1.3 + 'px',
                    top: beamTop + 'px', height: top + h * 0.55 - beamTop + 'px'
                });
                const pool = add(el, 'room__pool', {
                    left: cx - w * 0.95 + 'px', width: w * 1.9 + 'px',
                    top: Math.max(0, top - h * 0.6) + 'px', height: h * 2 - Math.max(0, h * 0.6 - top) + 'px' // центр света чуть выше середины картины; не выше края стены
                });
                const glow = add(floor, 'room__glow', { left: cx - w * 0.75 + 'px', width: w * 1.5 + 'px' });
                // свет — под рамкой
                el.insertBefore(pool, el.firstChild);
                el.insertBefore(beam, f.fig);

                return { left, w, center: left + groupW / 2, fig: f.fig, label: f.label, lamp, beam, pool, glow, p: f.p };
            });

            const last = layout[layout.length - 1];
            el.style.width = Math.ceil(last.center + W / 2) + 'px';
            el._layout = layout;
            el._index = index;
            return el;
        }

        // короткие предлоги и союзы не остаются в конце строки — переносятся вместе со следующим словом
        const glue = (text) => text.replace(/(^|[\s(«])(в|во|на|у|с|со|к|ко|о|об|от|из|до|по|за|под|над|при|без|для|про|и|а|но|не|ни)\s/gi, '$1$2\u00a0');

        function add(parent, cls, style) {
            const d = document.createElement('div');
            d.className = cls;
            d.setAttribute('aria-hidden', 'true');
            Object.assign(d.style, style);
            parent.appendChild(d);
            return d;
        }

        // сдвиг стены, при котором фото i вместе с этикеткой стоит по центру экрана
        const offset = (el, i) => {
            const it = el._layout[i];
            return -(it.center - stage.clientWidth / 2);
        };

        function place(el, i) {
            el.style.transition = 'none';
            el._t = offset(el, i);
            el.style.transform = `translate3d(${el._t}px,0,0)`;
        }

        function light(el, i) {
            el._layout.forEach((it, k) => {
                const on = k === i;
                [it.fig, it.label, it.lamp, it.beam, it.pool, it.glow].forEach((n) => n.classList.toggle('is-lit', on));
            });
            // следы и стрелки на полу — в цвет света текущей стены
            section.style.setProperty('--light', LIGHTS[el._index % LIGHTS.length]);
            const it = el._layout[i];
            let n = i;
            for (let k = 0; k < el._index; k++) n += walls[k].length;
            status.textContent = `Фото ${n + 1} из ${items.length}${it.p.alt ? ': ' + it.p.alt : ''}`;
            preload(el._index);
        }

        // фото соседних стен грузим заранее — при повороте рамки не стоят пустыми
        const preloaded = new Set();
        function preload(index) {
            [index + 1, index - 1].forEach((k) => {
                const w = (k + wallsCount) % wallsCount;
                if (preloaded.has(w)) return;
                preloaded.add(w);
                walls[w].forEach((p) => { new Image().src = p.src; });
            });
        }

        // гасим все лампы стены
        const dark = (el) => el._layout.forEach((it) => {
            [it.fig, it.label, it.lamp, it.beam, it.pool, it.glow].forEach((n) => n.classList.remove('is-lit'));
        });

        // ---------- шаг вдоль стены ----------
        function walk(i) {
            walking = true;
            dark(wall);
            ci = i;
            wall._t = offset(wall, ci);
            wall.style.transition = reduced ? 'none' : `transform ${WALK}ms ${EASE}`;
            wall.style.transform = `translate3d(${wall._t}px,0,0)`;
            setTimeout(() => { walking = false; light(wall, ci); }, reduced ? 0 : WALK);
        }

        // ---------- поворот к соседней стене ----------
        function turn(dir) {
            walking = true;
            const W = stage.clientWidth;
            const main = wall;
            const next = (cw + dir + wallsCount) % wallsCount;
            const aux = build(next);
            const ai = dir > 0 ? 0 : walls[next].length - 1;
            const tm = main._t;
            const ta = offset(aux, ai);
            dark(main);

            const done = () => {
                main.remove();
                aux.style.transformOrigin = '';
                wall = aux;
                wall._t = ta;
                cw = next;
                ci = ai;
                walking = false;
                light(wall, ci);
            };

            if (reduced) { // без движения: следующая стена просто проявляется
                place(aux, ai);
                aux.style.opacity = '0';
                aux.style.transition = 'opacity 0.4s ease';
                requestAnimationFrame(() => { aux.style.opacity = '1'; });
                setTimeout(() => { aux.style.transition = ''; done(); }, 400);
                return;
            }

            // стены — грани куба: угол между ними на краю экрана, вокруг него и поворачиваемся
            main.style.transition = 'none';
            aux.style.transition = 'none';
            if (dir > 0) {
                main.style.transformOrigin = `${W - tm}px 50%`;
                aux.style.transformOrigin = `${-ta}px 50%`;
                aux.style.transform = `translate3d(${ta + W}px,0,0) rotateY(-90deg)`;
            } else {
                main.style.transformOrigin = `${-tm}px 50%`;
                aux.style.transformOrigin = `${W - ta}px 50%`;
                aux.style.transform = `translate3d(${ta - W}px,0,0) rotateY(90deg)`;
            }
            aux.getBoundingClientRect(); // фиксируем стартовое положение перед анимацией

            const tr = `transform ${TURN}ms ${EASE}`;
            main.style.transition = tr;
            aux.style.transition = tr;
            main.style.transform = dir > 0
                ? `translate3d(${tm - W}px,0,0) rotateY(90deg)`
                : `translate3d(${tm + W}px,0,0) rotateY(-90deg)`;
            aux.style.transform = `translate3d(${ta}px,0,0) rotateY(0deg)`;
            setTimeout(done, TURN + 30);
        }

        function navigate(dir) {
            if (walking) return;
            const n = walls[cw].length;
            const i = ci + dir;
            if (i >= 0 && i < n) walk(i);
            else if (wallsCount > 1) turn(dir);
            else walk((i + n) % n); // одна стена — по кругу
        }

        // ---------- управление ----------
        const step = (btn, dir) => {
            btn.classList.remove('is-stepping');
            void btn.offsetWidth; // перезапуск анимации следов
            btn.classList.add('is-stepping');
            navigate(dir);
        };
        btnPrev.addEventListener('click', () => step(btnPrev, -1));
        btnNext.addEventListener('click', () => step(btnNext, 1));

        // клик по соседней картине — подойти к ней
        stage.addEventListener('click', (e) => {
            const fig = e.target.closest('.room__frame, .room__label');
            if (!fig || walking || moved) return;
            const i = Number(fig.dataset.i);
            if (i !== ci) walk(i);
        });

        // свайп и перетаскивание
        let x0 = null;
        let moved = false;
        stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; moved = false; });
        stage.addEventListener('pointerup', (e) => {
            if (x0 === null) return;
            const dx = e.clientX - x0;
            x0 = null;
            if (Math.abs(dx) > 50) {
                moved = true;
                step(dx < 0 ? btnNext : btnPrev, dx < 0 ? 1 : -1);
            }
        });

        // стрелки клавиатуры — пока зал на экране
        const hall = section.querySelector('.room__hall') || section;
        let inView = false;
        new IntersectionObserver((entries) => {
            inView = entries[0].intersectionRatio > 0.5;
        }, { threshold: [0, 0.5, 1] }).observe(hall);

        // затемнение под шапкой гасило бы лампы — убираем его, когда всё, что выше зала (цитата, предыдущий экран),
        // целиком ушло из-под шапки (иначе текст проходил бы под шапкой без затемнения и наезжал на неё)
        const prev = hall.previousElementSibling || section.previousElementSibling;
        const topbar = document.querySelector('.topbar');
        if (prev && topbar) {
            const scrim = () => {
                const free = prev.getBoundingClientRect().bottom <= topbar.getBoundingClientRect().bottom + 8;
                document.body.classList.toggle('is-room', free);
            };
            window.addEventListener('scroll', scrim, { passive: true });
            window.addEventListener('resize', scrim);
            scrim();
        }
        document.addEventListener('keydown', (e) => {
            if (!inView || e.altKey || e.ctrlKey || e.metaKey) return;
            if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); step(btnNext, 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); step(btnPrev, -1); }
        });

        // камера чуть следует за курсором — зал объёмный
        if (!reduced && window.matchMedia('(hover: hover)').matches) {
            let tx = 50, ty = 42, px = 50, py = 42, raf = 0;
            const tick = () => {
                px += (tx - px) * 0.06;
                py += (ty - py) * 0.06;
                stage.style.perspectiveOrigin = `${px.toFixed(2)}% ${py.toFixed(2)}%`;
                raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.05 ? requestAnimationFrame(tick) : 0;
            };
            section.addEventListener('pointermove', (e) => {
                const r = section.getBoundingClientRect();
                tx = 50 + ((e.clientX - r.left) / r.width - 0.5) * 8;
                ty = 42 + ((e.clientY - r.top) / r.height - 0.5) * 6;
                if (!raf) raf = requestAnimationFrame(tick);
            });
        }

        // перспектива по ширине экрана: на широких мониторах угол поворота не «разваливается»
        const setPerspective = () => { stage.style.perspective = Math.max(1200, stage.clientWidth * 0.95) + 'px'; };
        setPerspective();

        // первая стена: подходим к первому фото, лампа включается чуть позже
        wall = build(cw);
        place(wall, ci);
        setTimeout(() => light(wall, ci), 250);

        // ресайз — перестраиваем текущую стену на том же фото
        let rt;
        let lastW = stage.clientWidth;
        window.addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                if (stage.clientWidth === lastW && !walking) return;
                lastW = stage.clientWidth;
                const rebuild = () => {
                    if (walking) return setTimeout(rebuild, 200);
                    setPerspective();
                    wall.remove();
                    wall = build(cw);
                    place(wall, ci);
                    light(wall, ci);
                };
                rebuild();
            }, 200);
        });
    }
})();
