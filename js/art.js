// Арт-слой: появление блоков при скролле
(() => {
    const { gsap, ScrollTrigger } = window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- появление при скролле ----------
    if (!gsap || !ScrollTrigger || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const once = (trigger, start = 'top 75%') => ({ trigger, start, once: true });

    // строки с буквами кренятся от скорости скролла и пружиной возвращаются
    const typeBlocks = gsap.utils.toArray('.hero > .hero__type, .genres > .hero__type');
    if (typeBlocks.length) {
        const skew = { v: 0 };
        const setSkew = gsap.quickSetter(typeBlocks, 'skewX', 'deg');
        const clamp = gsap.utils.clamp(-14, 14);
        ScrollTrigger.create({
            start: 0,
            end: 'max',
            onUpdate: (self) => {
                const v = clamp(self.getVelocity() / -260);
                if (Math.abs(v) > Math.abs(skew.v)) {
                    skew.v = v;
                    gsap.to(skew, {
                        v: 0,
                        duration: 0.9,
                        ease: 'power3',
                        overwrite: true,
                        onUpdate: () => setSkew(skew.v)
                    });
                }
            }
        });
    }

    // «Я фотограф»: плашка поднимается, фото стоит на месте сразу (без анимации открытия)
    const about = document.querySelector('.about');
    if (about) {
        gsap.timeline({ scrollTrigger: once(about, 'top 80%') })
            .from(about.querySelector('.about__card'), { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
            .from([about.querySelector('.about__title'), about.querySelector('.about__text')], {
                y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12
            }, 0.35);
    }

    // жанры: карточки поднимаются волной
    const cards = gsap.utils.toArray('.genres__item');
    if (cards.length) {
        gsap.from(cards, {
            scrollTrigger: once('.genres__list', 'top 85%'),
            y: 80,
            opacity: 0,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.1
        });
    }

    // футер: заголовок выезжает, кнопка и нижняя строка следом
    const footer = document.querySelector('.footer');
    if (footer) {
        gsap.timeline({ scrollTrigger: once(footer, 'top 80%') })
            .from(footer.querySelector('.footer__title'), { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
            .from(footer.querySelector('.footer__write'), { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, 0.15)
            .from(footer.querySelector('.footer__bottom'), { y: 20, opacity: 0, duration: 1, ease: 'expo.out' }, 0.3);
    }
})();
