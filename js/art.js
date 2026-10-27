// Арт-слой: «Я фотограф» — плашка поднимается при прокрутке, фото стоит на месте сразу
(() => {
    const { gsap, ScrollTrigger } = window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || !ScrollTrigger || reduced) return;
    gsap.registerPlugin(ScrollTrigger);

    const about = document.querySelector('.about');
    if (!about) return;
    gsap.timeline({ scrollTrigger: { trigger: about, start: 'top 80%', once: true } })
        .from(about.querySelector('.about__card'), { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
        .from([about.querySelector('.about__title'), about.querySelector('.about__text')], {
            y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12
        }, 0.35);
})();
