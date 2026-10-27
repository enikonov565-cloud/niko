// Логотип в шапке: «рисуется», когда доскроллили до второго экрана, и стирается при возврате
(() => {
    const topbar = document.querySelector('.topbar');
    const hero = document.querySelector('.showreel');
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

// шрифты догрузились — размеры экранов уточнились, точки прокрутки пересчитываем
if (document.fonts && window.ScrollTrigger) document.fonts.ready.then(() => window.ScrollTrigger.refresh());
