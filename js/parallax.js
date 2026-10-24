// Параллакс первого экрана: слои фото, логотип и человек едут с разной скоростью
// Эффект: Osmo Parallax Image Layers (https://osmo.supply/)
(() => {
    const { gsap, ScrollTrigger, Lenis } = window;
    if (!gsap || !ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-parallax-layers]').forEach((triggerElement) => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerElement,
                start: '0% 0%',
                end: '100% 0%',
                scrub: 0
            }
        });

        const layers = [
            { layer: '1', yPercent: 70 },
            { layer: '2', yPercent: 55 },
            { layer: '3', yPercent: 40 },
            { layer: '4', yPercent: 10 }
        ];

        layers.forEach((layerObj, idx) => {
            tl.to(
                triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
                { yPercent: layerObj.yPercent, ease: 'none' },
                idx === 0 ? undefined : '<'
            );
        });

        // логотип гаснет к концу экрана — иначе его белый росчерк просвечивает сквозь затемнение полоской
        tl.to(triggerElement.querySelectorAll('[data-parallax-layer="3"]'), { opacity: 0, ease: 'power1.in', duration: 0.3 }, 0); // полностью гаснет к 60% экрана
    });

    // Lenis — плавный скролл
    if (!Lenis) return;
    const lenis = new Lenis();
    // доступен другим скриптам: страница жанра блокирует скролл на время просмотра
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
})();
