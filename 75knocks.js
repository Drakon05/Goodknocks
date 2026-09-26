/**
 * 75Knocks — GoodKnocks
 * Main JS: Audio, Scroll Reveal, Sticky Nav Fallback, Form
 */

'use strict';

/* ── Audio ───────────────────────────────────────── */
const audio    = document.getElementById('kbAudio');
const soundBtns = [
  document.getElementById('btnSound'),
  document.getElementById('btnSound2'),
].filter(Boolean);
const waveform = document.getElementById('waveform');

let isPlaying = false;

function toggleAudio() {
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    soundBtns.forEach(b => {
      b.classList.remove('playing');
      b.querySelector('span').textContent = b.id === 'btnSound2' ? 'Play the ASMR' : 'Hear it';
    });
    waveform?.classList.remove('playing');
  } else {
    audio.play().then(() => {
      isPlaying = true;
      soundBtns.forEach(b => {
        b.classList.add('playing');
        b.querySelector('span').textContent = b.id === 'btnSound2' ? 'Pause the ASMR' : 'Pause';
      });
      waveform?.classList.add('playing');
    }).catch(() => {});
  }
}

soundBtns.forEach(btn => btn.addEventListener('click', toggleAudio));

/* ── Scroll Reveal ───────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.story-text-col, .story-img-col, .colourway-card, ' +
  '.spec-row, .render-item, .feel-text, .feel-visual, ' +
  '.specs-left, .specs-right, .reserve-inner'
);

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger children of grid parents
  if (el.classList.contains('colourway-card')) {
    el.classList.add(`reveal-delay-${(i % 3) + 1}`);
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ── Sticky Nav JS Fallback (Firefox / Safari) ───── */
function getScrollParent(node) {
  if (!node || node === document.body || node === document.documentElement) return null;
  const { overflow } = getComputedStyle(node);
  if (node.scrollHeight > node.clientHeight && overflow !== 'visible' && overflow !== 'clip') {
    return node;
  }
  return getScrollParent(node.parentNode);
}

const navContainer = document.querySelector('.nav-sticky-container');
const nav          = document.getElementById('nav');

if (navContainer && nav && !CSS.supports('container-type', 'scroll-state')) {
  const root      = getScrollParent(navContainer);
  const topOffset = parseFloat(getComputedStyle(navContainer).top) || 0;

  const stickyObserver = new IntersectionObserver(
    ([e]) => nav.classList.toggle('is-stuck', e.intersectionRatio < 1),
    {
      root,
      threshold: [1],
      rootMargin: `-${topOffset + 1}px 0px 0px 0px`,
    }
  );
  stickyObserver.observe(navContainer);
}

/* ── Reserve Form ────────────────────────────────── */
const form    = document.getElementById('reserveForm');
const success = document.getElementById('formSuccess');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('reserveEmail').value.trim();
  if (!email) return;

  // In production: POST to your mailing list endpoint
  // For now, show success state
  form.querySelector('.form-row').hidden   = true;
  form.querySelector('.form-legal').hidden = true;
  success.hidden = false;

  // Subtle pulse on success badge
  success.style.animation = 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both';
});

/* ── Active nav link on scroll ───────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--gk-cream)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
