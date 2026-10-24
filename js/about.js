// «Я фотограф»: глаз с портрета на фоне всегда стоит в промежутке между заголовком и текстом —
// на любой ширине экрана он виден, а не спрятан под строками
(() => {
    const about = document.querySelector('.about');
    if (!about) return;

    const bg = about.querySelector('.about__bg');
    const inner = about.querySelector('.about__inner');
    const card = about.querySelector('.about__card');
    const title = about.querySelector('.about__title');
    const text = about.querySelector('.about__text');
    if (!bg || !inner || !card || !title || !text) return;

    // где глаз на снимке (доли ширины и высоты) и пропорции снимка
    const EYE_X = 0.453;
    const EYE_Y = 0.563;
    const RATIO = 853 / 1280;

    const stacked = window.matchMedia('(max-width: 1023px)');

    const place = () => {
        bg.style.left = '';
        const w = bg.offsetWidth; // ширина — из CSS
        const h = w * RATIO;

        // offsetTop не учитывает анимацию появления плашки (transform) — считаем по готовой раскладке
        const top0 = inner.offsetTop;
        const gapMid = top0 + (title.offsetTop + title.offsetHeight + text.offsetTop) / 2;
        bg.style.top = Math.round(gapMid - EYE_Y * h) + 'px';

        // на телефоне и планшете портрет крупнее экрана — ставим глаз по центру плашки
        if (stacked.matches) {
            const cardMid = inner.offsetLeft + card.offsetLeft + card.offsetWidth / 2;
            bg.style.left = Math.round(cardMid - EYE_X * w) + 'px';
        }
    };

    place();
    window.addEventListener('resize', place);
    if (document.fonts) document.fonts.ready.then(place);
    if (!bg.complete) bg.addEventListener('load', place);
})();
