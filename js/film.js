// Плёнки в галерее: набор кадров повторяется, пока половина ленты не станет шире экрана.
// Лента = две одинаковые половины, CSS-анимация сдвигает её на −50% — прокрутка бесшовная
// при любой ширине экрана и высоте кадров.
(() => {
    const tracks = [...document.querySelectorAll('.film__track')];
    if (!tracks.length) return;

    const SPEED = 45; // px в секунду

    // эталонный набор кадров каждой ленты (первый .film__set из разметки)
    const sources = tracks.map((track) => track.querySelector('.film__set').cloneNode(true));

    const build = () => {
        tracks.forEach((track, i) => {
            const proto = sources[i];
            track.innerHTML = '';
            const first = proto.cloneNode(true);
            track.appendChild(first);
            const setW = first.getBoundingClientRect().width || 1;
            // сколько наборов нужно, чтобы половина ленты перекрыла экран с запасом
            const perHalf = Math.max(1, Math.ceil((track.parentElement.offsetWidth * 1.1) / setW)); // ширина плёнки (она шире экрана)
            for (let k = 1; k < perHalf * 2; k++) {
                const copy = proto.cloneNode(true);
                copy.setAttribute('aria-hidden', 'true');
                copy.querySelectorAll('img').forEach((img) => { img.alt = ''; });
                track.appendChild(copy);
            }
            // одинаковая скорость на любом экране: половина ленты проезжает со скоростью SPEED px/с
            track.style.animationDuration = (setW * perHalf / SPEED).toFixed(1) + 's';
        });
    };

    build();
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
})();
