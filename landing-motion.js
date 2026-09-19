/* One greeting per visit. No looping animation or background playback. */
window.CarraLandingMotion = (() => {
  let cleanup = () => {};
  function stop() { cleanup(); cleanup = () => {}; }
  function mount(host) {
    stop();
    const stage = host.querySelector('.hero-mascot');
    if (!stage) return;
    const poster = stage.querySelector('img');
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'none';
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('disablepictureinpicture', '');
    stage.appendChild(video);
    const button = host.querySelector('.mascot-motion-control');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let active = true;
    let autoStarted = false;
    let userPaused = false;
    let resumeWhenVisible = false;
    let failed = false;
    function still() {
      video.pause(); stage.classList.remove('is-playing');
      poster.style.opacity = '';
      button.textContent = 'Play Carra greeting';
      button.setAttribute('aria-label', 'Play Carra greeting');
    }
    async function play() {
      if (!active) return;
      userPaused = false;
      button.disabled = true;
      button.textContent = 'Loading greeting…';
      if (!video.getAttribute('src')) video.src = 'design/carra-character/waiting.mp4';
      if (video.ended) video.currentTime = 0;
      try {
        await video.play();
        if (!active || !visible || document.hidden) { video.pause(); return; }
      } catch { still(); }
      finally {
        button.disabled = failed;
        if (failed) {
          button.textContent = 'Carra greeting unavailable';
          button.setAttribute('aria-label', 'Carra greeting unavailable');
        }
      }
    }
    video.addEventListener('playing', () => {
      if (!active) { video.pause(); return; }
      stage.classList.add('is-playing');
      button.textContent = 'Pause animation';
      button.setAttribute('aria-label', 'Pause Carra animation');
    });
    video.addEventListener('pause', () => {
      if (!active || video.ended || failed) return;
      button.textContent = 'Play animation';
      button.setAttribute('aria-label', 'Play Carra animation');
    });
    video.addEventListener('ended', () => {
      resumeWhenVisible = false;
      button.textContent = 'Replay greeting';
      button.setAttribute('aria-label', 'Replay Carra greeting');
    });
    video.addEventListener('error', () => {
      failed = true; still(); button.disabled = true;
      button.textContent = 'Carra greeting unavailable';
      button.setAttribute('aria-label', 'Carra greeting unavailable');
    });
    button.addEventListener('click', () => {
      autoStarted = true;
      if (!video.paused) { userPaused = true; resumeWhenVisible = false; video.pause(); }
      else play();
    });
    function visibility() {
      if (!visible || document.hidden) {
        resumeWhenVisible = !video.paused && !video.ended && !userPaused;
        video.pause();
      } else if (!preference.matches && !userPaused) {
        if (!autoStarted) { autoStarted = true; play(); }
        else if (resumeWhenVisible) { resumeWhenVisible = false; play(); }
      }
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visibility(); }, { threshold: 0.25 });
    observer.observe(stage);
    const changePreference = () => { if (preference.matches) { resumeWhenVisible = false; still(); } else visibility(); };
    preference.addEventListener('change', changePreference);
    document.addEventListener('visibilitychange', visibility);
    cleanup = () => {
      active = false;
      observer.disconnect();
      preference.removeEventListener('change', changePreference);
      document.removeEventListener('visibilitychange', visibility);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }
  return { mount, stop };
})();
