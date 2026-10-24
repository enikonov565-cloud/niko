// Логотип в шапке: «рисуется», когда доскроллили до второго экрана, и стирается при возврате
(() => {
    const topbar = document.querySelector('.topbar');
    const hero = document.querySelector('.hero') || document.querySelector('.showreel');
    if (!topbar || !hero) return;

    const logo = topbar.querySelector('.topbar__logo');
    const update = () => {
        // первый экран (лес) ушёл: его низ поднялся выше 15% высоты окна
        const first = document.querySelector('.parallax') || hero;
        const on = first.getBoundingClientRect().bottom <= window.innerHeight * 0.15;
        if (on === topbar.classList.contains('is-logo')) return;
        topbar.classList.toggle('is-logo', on);
        logo.tabIndex = on ? 0 : -1;
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

// Кинетическая типографика (2-й и 3-й экраны): строки едут в разные стороны при скролле
(() => {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    // скорость одна на всех экранах: строка сдвигается на 45% ширины окна за 100vh прокрутки
    const SHIFT_PER_SCREEN = 0.45;

    const sections = [
        // 2-й экран стоит наверху сразу после первого — строки едут, пока он уходит вверх
        { el: document.querySelector('.hero'), start: 'top top', end: 'bottom top', screens: 1 },
        // 3-й экран — едут всё время, пока он виден: от появления снизу до ухода вверх
        { el: document.querySelector('.genres'), start: 'top bottom', end: 'bottom top', screens: 2 }
    ];

    // строка должна перекрывать экран на всём пути сдвига, иначе по краям видны пустоты
    // (на широких низких экранах шрифт ограничен высотой и строки короче) — добавляем слова
    const fillRows = () => {
        const vw = Math.max(window.innerWidth, window.screen.width || 0);
        sections.forEach(({ el, screens }) => {
            if (!el) return;
            const need = vw * (1 + SHIFT_PER_SCREEN * screens + 0.3);
            el.querySelectorAll('.hero__row').forEach((row) => {
                const words = [...row.children];
                const width = () => row.lastElementChild.offsetLeft + row.lastElementChild.offsetWidth;
                while (width() < need) words.forEach((w) => row.appendChild(w.cloneNode(true)));
            });
        });
    };
    fillRows();

    sections.forEach(({ el, start, end, screens }) => {
        if (!el) return;
        const shift = SHIFT_PER_SCREEN * screens;

        el.querySelectorAll('.hero__row').forEach((row, i) => {
            const toRight = row.dataset.dir === 'right';
            // небольшой разный стартовый сдвиг, чтобы слова в строках не стояли столбиком
            const stagger = (i % 3) * 0.08;

            gsap.fromTo(row,
                { x: () => -window.innerWidth * (toRight ? shift + stagger : stagger) },
                {
                    x: () => -window.innerWidth * (toRight ? stagger : shift + stagger),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: el,
                        start,
                        end,
                        scrub: 0.6,
                        invalidateOnRefresh: true
                    }
                }
            );
        });
    });

    // шрифт может догрузиться позже — пересчитываем размеры
    if (document.fonts) document.fonts.ready.then(() => { fillRows(); ScrollTrigger.refresh(); });
    window.addEventListener('resize', fillRows);
})();
