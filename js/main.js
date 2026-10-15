const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const delay = Number(entry.target.dataset.delay || 0);
      entry.target.style.transitionDelay = delay + "ms";
      entry.target.classList.add("in");
      entry.target.addEventListener(
        "transitionend",
        () => (entry.target.style.transitionDelay = ""),
        { once: true }
      );
      revealObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const links = document.querySelectorAll(".nav-links a[data-nav]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((link) =>
        link.classList.toggle("active", link.dataset.nav === entry.target.id)
      );
    }
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
links.forEach((link) => {
  const section = document.getElementById(link.dataset.nav);
  if (section) sectionObserver.observe(section);
});

document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll(".marquee-track").forEach((track) => {
  const group = track.querySelector(".marquee-group");
  const items = [...group.children];
  while (group.scrollWidth < Math.max(screen.width, innerWidth) * 1.1) {
    items.forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      group.appendChild(copy);
    });
  }
  const clone = group.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);
});

const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
const soundToggle = document.getElementById("soundToggle");
const scrollProgress = document.getElementById("scrollProgress");

/* Ambient Audio Engine (Synthesized Web Audio API Bubble & Haptic Sounds) */
class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("sound_muted") === "true";
    this.ready = false;
    this.master = null;
  }
  async unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (!this.ctx) return false;

    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    this.ready = this.ctx.state === "running";
    return this.ready;
  }
  canPlay() {
    return !this.muted && this.ready && this.ctx && this.master && !document.hidden;
  }
  // Gentle water bubble pop for hover
  playHoverPop(pitch = 1) {
    if (!this.canPlay()) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const base = 480 * pitch;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.85, t + 0.035);

      gain.gain.setValueAtTime(0.085, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

      osc.connect(gain);
      gain.connect(this.master);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch (_) {}
  }
  // Rich tactile bubble pop for clicks
  playBubble(pitch = 1, volume = 0.14) {
    if (!this.canPlay()) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const baseFreq = 420 * pitch;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, t + 0.07);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.master);

      osc.start(t);
      osc.stop(t + 0.085);
    } catch (_) {}
  }
  playToggle(isDark) {
    if (!this.canPlay()) return;
    try {
      const t = this.ctx.currentTime;
      const freqs = isDark ? [520, 680] : [680, 880];
      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + i * 0.045);

      gain.gain.setValueAtTime(0.1, t + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.045 + 0.1);

        osc.connect(gain);
        gain.connect(this.master);

        osc.start(t + i * 0.045);
        osc.stop(t + i * 0.045 + 0.11);
      });
    } catch (_) {}
  }
  // Delicate iOS-style haptic scroll tick (subtle, soft tactile click)
  playScrollTick(direction = 1) {
    if (!this.canPlay()) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const base = direction > 0 ? 560 : 640;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 0.45, t + 0.022);

      // Very gentle, whisper-soft Apple haptic volume
      gain.gain.setValueAtTime(0.038, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      osc.connect(gain);
      gain.connect(this.master);

      osc.start(t);
      osc.stop(t + 0.028);
    } catch (_) {}
  }
  toggle() {
    this.muted = !this.muted;
    localStorage.setItem("sound_muted", String(this.muted));
    return this.muted;
  }
}

const audio = new AmbientAudioEngine();

// Browsers only allow sound after a real gesture.  Unlock once, silently, so
// the next scroll/hover can feel immediate instead of being blocked.
let hasPrimedInteraction = false;
let suppressNextClickBubble = false;
const unlockAudio = (event) => {
  const isGesture = event?.type === "pointerdown" || event?.type === "keydown" || event?.type === "click";
  const interactive = event?.target?.closest?.("a, button, .card, .tool, .chip");
  const isFirstInteraction = !hasPrimedInteraction;
  hasPrimedInteraction = true;

  audio.unlock()
    .then(() => {
      if (isFirstInteraction && isGesture && interactive) {
        audio.playBubble(0.78, 0.12);
        suppressNextClickBubble = true;
      }
    })
    .catch(() => {});

  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("wheel", unlockAudio);
  window.removeEventListener("touchstart", unlockAudio);
  window.removeEventListener("pointermove", unlockAudio);
};
["pointerdown", "keydown", "wheel", "touchstart", "pointermove"].forEach((evt) => {
  window.addEventListener(evt, unlockAudio, { passive: true, once: true });
});

/* Sync sound toggle button state */
const syncSoundToggle = () => {
  if (!soundToggle) return;
  soundToggle.classList.toggle("muted", audio.muted);
  soundToggle.setAttribute("aria-label", audio.muted ? "Unmute sounds" : "Mute sounds");
  soundToggle.setAttribute("aria-pressed", String(!audio.muted));
};
syncSoundToggle();

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    const isMuted = audio.toggle();
    syncSoundToggle();
    if (!isMuted) audio.unlock().then(() => audio.playBubble(1.2, 0.16));
  });
}

/* Floating micro-bubble particles */
function spawnBubble(x, y) {
  const b = document.createElement("div");
  b.className = "micro-bubble";
  const size = Math.floor(12 + Math.random() * 14);
  b.style.width = size + "px";
  b.style.height = size + "px";
  b.style.left = x + "px";
  b.style.top = y + "px";
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 750);
}

/* Scroll handling: progress bar + delicate iOS haptic scroll ticks */
let lastScrollSoundY = window.scrollY;
let lastScrollSoundTime = 0;

window.addEventListener("scroll", () => {
  const currentY = window.scrollY;
  if (scrollProgress) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (currentY / maxScroll) * 100 : 0;
    scrollProgress.style.width = progress + "%";
  }

  // Delicate Apple-style scroll haptic sound
  const delta = Math.abs(currentY - lastScrollSoundY);
  const now = performance.now();
  if (delta >= 65 && now - lastScrollSoundTime > 65) {
    const direction = currentY >= lastScrollSoundY ? 1 : -1;
    audio.playScrollTick(direction);
    lastScrollSoundY = currentY;
    lastScrollSoundTime = now;
  }
}, { passive: true });

/* Hover Bubble Sound Feedback across interactive items */
let lastHoverTime = 0;
let hoverToneIndex = 0;

document.addEventListener("pointerover", (e) => {
  if (e.pointerType && e.pointerType !== "mouse") return;
  const target = e.target.closest("a, button, .card, .tool, .chip, .client");
  if (!target) return;
  if (target.dataset.hoverActive === "true") return;
  target.dataset.hoverActive = "true";
  target.addEventListener("mouseleave", () => { target.dataset.hoverActive = "false"; }, { once: true });

  const now = performance.now();
  if (now - lastHoverTime > 50) {
    hoverToneIndex = (hoverToneIndex + 1) % 6;
    const pitch = 0.9 + hoverToneIndex * 0.08;
    audio.playHoverPop(pitch);
    lastHoverTime = now;
  }
}, { passive: true });

/* Apple VisionOS Dynamic Card Spotlight Highlight */
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", (e.clientX - rect.left) + "px");
    card.style.setProperty("--mouse-y", (e.clientY - rect.top) + "px");
  }, { passive: true });
});

/* Interactive click feedback (bubbles + sound) */
window.addEventListener("click", (e) => {
  const isInteractive = e.target.closest("a, button, .card, .tool, .chip");
  if (isInteractive) {
    spawnBubble(e.clientX, e.clientY);
    if (suppressNextClickBubble) {
      suppressNextClickBubble = false;
      return;
    }
    audio.playBubble(0.95 + Math.random() * 0.35, 0.14);
  }
}, { passive: true });

/* Theme toggle */
const syncToggle = () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  toggle.setAttribute("aria-label", `Switch to ${next} mode`);
};
syncToggle();
toggle.addEventListener("click", () => {
  const willBeDark = root.dataset.theme !== "dark";
  root.dataset.theme = willBeDark ? "dark" : "light";
  localStorage.setItem("theme", root.dataset.theme);
  syncToggle();
  audio.playToggle(willBeDark);
});

/* Neural-node canvas — hero left diagonal area */
(function initNeuralCanvas() {
  const canvas = document.getElementById("neuralCanvas");
  const wrapper = document.getElementById("heroNeural");
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext("2d");
  const MAX_DIST = 160;
  const NODE_COUNT = 55;
  let W, H, nodes;

  function getColor(alpha) {
    const dark = root.dataset.theme === "dark";
    return dark
      ? "rgba(255,255,255," + alpha + ")"
      : "rgba(0,0,0," + alpha + ")";
  }

  function resize() {
    W = canvas.width = wrapper.offsetWidth;
    H = canvas.height = wrapper.offsetHeight;
  }

  function initNodes() {
    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W * 0.52,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: 1.5 + Math.random() * 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > W * 0.52) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.28;
          const xFade = 1 - Math.max(0, (a.x - W * 0.28) / (W * 0.24));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = getColor(alpha * xFade);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      const xFade = 1 - Math.max(0, (a.x - W * 0.28) / (W * 0.24));
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = getColor(0.65 * xFade);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  function start() {
    resize();
    initNodes();
    wrapper.classList.add("in");
    draw();
  }

  window.addEventListener("resize", () => { resize(); initNodes(); });
  setTimeout(start, 600);
})();

