(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const all = selector => [...document.querySelectorAll(selector)];
  let stop = () => {};

  function start() {
    stop();
    if (reduce.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const controller = new AbortController();
    const { signal } = controller;
    const animations = new Set();
    const timers = new Set();
    const seen = new WeakSet();
    const tiltTargets = all('.portrait-image, .project-art');
    let frame = 0;
    root.classList.add('motion-ready');

    function animate(el, frames, delay = 0, duration = 800) {
      if (!el) return;
      const animation = el.animate(frames, { duration, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    }

    const hero = document.querySelector('.hero');
    if (hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < innerHeight) {
      all('.name-line > span').forEach((el, i) => animate(el, [
        { transform: 'translateY(115%) rotate(3deg)' },
        { transform: 'translateY(0) rotate(0)' }
      ], 80 + i * 180, 1150));
      animate(document.querySelector('.portrait-image'), [
        { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(-20px -20px -20px -20px)' }
      ], 180, 1250);
      animate(document.querySelector('.portrait img'), [{ transform: 'scale(1.14)' }, { transform: 'scale(1)' }], 180, 1500);
      all('.hero-meta, .pitch, .actions, .portrait figcaption, .hero-foot').forEach((el, i) => animate(el, [
        { opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }
      ], 250 + i * 90, 850));
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        const feature = target.classList.contains('feature');
        if (feature) target.classList.toggle('in-view', isIntersecting);
        if (!isIntersecting || seen.has(target)) return;
        seen.add(target);
        const index = feature ? all('.feature').indexOf(target) : 0;
        animate(target, [{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'translateY(0)' }], index * 110, 850);
        if (feature) {
          target.classList.add('art-play');
          const timer = setTimeout(() => { target.classList.remove('art-play'); timers.delete(timer); }, 2800);
          timers.add(timer);
        } else observer.unobserve(target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    all('.feature, .sh, .profile-l, .ledger-wrap, .grp-h, .caps > div, .edu, .contact-grid').forEach(el => observer.observe(el));

    function resetTilt(el) {
      el.classList.remove('is-tilting');
      el.style.removeProperty('--tilt-x');
      el.style.removeProperty('--tilt-y');
    }
    tiltTargets.forEach(el => {
      el.addEventListener('pointermove', event => {
        if (!fine.matches || event.pointerType === 'touch') return;
        const box = el.getBoundingClientRect();
        const x = Math.max(-0.5, Math.min(0.5, (event.clientX - box.left) / box.width - 0.5));
        const y = Math.max(-0.5, Math.min(0.5, (event.clientY - box.top) / box.height - 0.5));
        el.classList.add('is-tilting');
        el.style.setProperty('--tilt-x', `${(-y * 9).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y', `${(x * 12).toFixed(2)}deg`);
      }, { signal });
      el.addEventListener('pointerleave', () => resetTilt(el), { signal });
      el.addEventListener('pointercancel', () => resetTilt(el), { signal });
    });
    fine.addEventListener('change', () => tiltTargets.forEach(resetTilt), { signal });

    const progress = document.querySelector('.reading-progress');
    function update() {
      frame = 0;
      const range = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0})`;
    }
    function queue() { if (!frame) frame = requestAnimationFrame(update); }
    addEventListener('scroll', queue, { passive: true, signal });
    addEventListener('resize', queue, { signal });
    const resize = 'ResizeObserver' in window ? new ResizeObserver(queue) : null;
    resize?.observe(document.body);
    queue();

    stop = () => {
      controller.abort();
      observer.disconnect();
      resize?.disconnect();
      cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel());
      timers.forEach(clearTimeout);
      tiltTargets.forEach(resetTilt);
      all('.feature').forEach(el => el.classList.remove('art-play', 'in-view'));
      root.classList.remove('motion-ready');
      progress.style.removeProperty('transform');
    };
  }
  reduce.addEventListener('change', start);
  start();
})();
