/* ======================================================================
   GoodKnocks — App Logic (Heirloom Low-Profile Keyboard)
   Configurator state, switch internals visualizer, process video sync
   ====================================================================== */

(function () {
  'use strict';

  /* ── State ────────────────────────────────────────────────────────── */
  const state = {
    currentSection: 'hero',
    config: {
      bodyColor: { name: 'Obsidian Noir', hex: '#18181a', key: 'obsidian' },
      finish: 'matte',
      switchType: 'linear',
      accent: { name: 'Champagne Brass', hex: '#81613E', key: 'gold' },
    },
    buildRunning: false,
  };

  const colorNames = {
    obsidian: 'Obsidian Noir',
    silver: 'Silver Gelatin',
    indigo: 'Midnight Ink',
  };

  const finishNames = {
    matte: 'Bead-Blasted Matte',
    metallic: 'Brushed Satin',
    gloss: 'Mirror Chamfer',
  };

  const switchSpecs = {
    linear: {
      name: 'Velvet Linear',
      fullName: 'Velvet Linear (42gf)',
      force: '42 gf',
      pretravel: '1.2 mm',
      total: '3.2 mm',
      acoustic: 'Muted Whisper',
      stemColor: '#81613E',
      glow: 'rgba(129, 97, 62, 0.15)',
      desc: 'Velvet Linear · Silent Glide Architecture',
    },
    tactile: {
      name: 'Silvertone Tactile',
      fullName: 'Silvertone Tactile (55gf)',
      force: '55 gf',
      pretravel: '1.5 mm',
      total: '3.2 mm',
      acoustic: 'Articulate Clack',
      stemColor: '#b76e79',
      glow: 'rgba(183, 110, 121, 0.18)',
      desc: 'Silvertone Tactile · Dual-Stage Bump Architecture',
    },
    clicky: {
      name: 'Acoustic Click',
      fullName: 'Acoustic Click (50gf)',
      force: '50 gf',
      pretravel: '1.3 mm',
      total: '3.2 mm',
      acoustic: 'Resonant Snap',
      stemColor: '#dcdcdc',
      glow: 'rgba(220, 220, 220, 0.22)',
      desc: 'Acoustic Click · Stainless Clickbar Architecture',
    },
  };

  const accentNames = {
    gold: 'Champagne Brass',
    rose: 'Smoked Copper',
    silver: 'Polished Chromium',
  };

  const colorDescriptions = {
    obsidian: 'Deep anodized black with quiet density',
    silver: 'Lustrous raw aluminum, vintage print tone',
    indigo: 'Subtle twilight blue with mineral warmth',
  };

  const accentDescriptions = {
    gold: 'Warm PVD gold rotary knob and perimeter chamfer',
    rose: 'Earthy vintage patina with warm tactile presence',
    silver: 'Mirror-bright silver gelatin luster and timeless contrast',
  };

  const switchDescriptions = {
    linear: 'Frictionless POM glide rails with dry Krytox film coating',
    tactile: 'Articulate tactile bump cam with progressive two-stage return',
    clicky: 'Integrated stainless clickbar for vintage mechanical typewriter cadence',
  };

  /* ── DOM References ───────────────────────────────────────────────── */
  const sections = document.querySelectorAll('.section');
  const pillNavItems = document.querySelectorAll('.pill-nav-item');
  const pillIndicator = document.querySelector('.pill-nav-indicator');

  /* ── Smooth Section Navigation ────────────────────────────────────── */
  function navigateTo(sectionId) {
    if (sectionId === state.currentSection) return;

    const update = () => {
      sections.forEach((s) => s.classList.remove('active'));
      const target = document.getElementById(sectionId);
      if (target) {
        target.classList.add('active');
        state.currentSection = sectionId;
        updatePillNav(sectionId);

        // Reset scroll position of target section
        const targetSec = document.getElementById(sectionId);
        if (targetSec) targetSec.scrollTop = 0;

        // Clean up confetti when leaving congrats/building
        if (sectionId !== 'congrats' && sectionId !== 'building') {
          document.querySelectorAll('.confetti-container').forEach((c) => c.remove());
        }

        // In Step 2 (Switches), update switch internal visualizer
        if (sectionId === 'step-wheels') {
          updateSwitchInternalPreview();
        }

        // In Step 3 (Accent), switch BACK to full keyboard view
        if (sectionId === 'step-accent') {
          cloneKeyboardPreview('step-accent');
        }

        // In Congrats, show full keyboard
        if (sectionId === 'congrats') {
          populateCongrats();
        }

        // In Building, start simulation
        if (sectionId === 'building') {
          startBuildSimulation();
        }
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  /* ── Pill Nav ─────────────────────────────────────────────────────── */
  const navSectionMap = {
    hero: 0,
    story: 1,
    'step-body': 2,
    'step-wheels': 2,
    'step-accent': 2,
    congrats: 2,
    building: 2,
  };

  function updatePillNav(sectionId) {
    const pos = navSectionMap[sectionId] ?? 0;
    pillNavItems.forEach((item, i) => {
      item.classList.toggle('active', i === pos);
    });
    if (pillIndicator) {
      pillIndicator.setAttribute('data-pos', pos);
    }
  }

  pillNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      const nav = item.getAttribute('data-nav');
      navigateTo(nav);
    });
  });

  /* ── CTA Buttons ──────────────────────────────────────────────────── */
  document.getElementById('cta-make-yours')?.addEventListener('click', () => {
    navigateTo('step-body');
  });

  document.getElementById('cta-build')?.addEventListener('click', () => {
    navigateTo('building');
  });

  document.getElementById('cta-restart')?.addEventListener('click', () => {
    resetBuild();
    navigateTo('hero');
  });

  /* ── Back / Next Buttons ──────────────────────────────────────────── */
  document.querySelectorAll('.btn-back, .btn-next').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-goto');
      if (target) navigateTo(target);
    });
  });

  /* ── Keyboard Preview Cloning (For Step 3 Accent and Congrats) ─────── */
  function cloneKeyboardPreview(sectionId) {
    const containerId =
      sectionId === 'step-accent' ? 'preview-accent' : 'congrats-preview';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (container.querySelector('.keyboard-svg')) {
      updateKeyboardPreview();
      return;
    }

    const sourceSvg = document.querySelector('#step-body .keyboard-svg');
    if (!sourceSvg) return;

    const clone = sourceSvg.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(clone);

    if (sectionId === 'step-accent') {
      const label = document.createElement('div');
      label.className = 'preview-label';
      label.innerHTML = `<span class="preview-change-indicator">${getPreviewLabel()}</span>`;
      container.appendChild(label);
    }

    updateKeyboardPreview();
  }

  function getPreviewLabel() {
    return `${state.config.bodyColor.name} · ${finishNames[state.config.finish]} · ${switchSpecs[state.config.switchType].name} · ${state.config.accent.name}`;
  }

  /* ── Full Keyboard Preview Updates ────────────────────────────────── */
  function updateKeyboardPreview() {
    const chassisHex = state.config.bodyColor.hex;
    const accentHex = state.config.accent.hex;
    const glowColor = switchSpecs[state.config.switchType].glow;

    document.querySelectorAll('.keyboard-svg').forEach((svg) => {
      // Chassis unibody
      svg.querySelectorAll('.kb-chassis').forEach((el) => {
        el.style.fill = chassisHex;
      });

      // Accent elements
      svg.querySelectorAll('.kb-accent-element').forEach((el) => {
        el.style.fill = accentHex;
      });
      svg.querySelectorAll('.kb-accent-chamfer').forEach((el) => {
        el.style.stroke = accentHex;
      });
      svg.querySelectorAll('.kb-accent-bar').forEach((el) => {
        el.style.fill = accentHex;
      });
      svg.querySelectorAll('.kb-accent-led').forEach((el) => {
        el.style.fill = accentHex;
      });

      // Switch Aura Glow
      svg.querySelectorAll('.kb-switch-aura').forEach((el) => {
        el.style.stroke = glowColor;
      });

      // Surface Finish
      const parent =
        svg.closest('.keyboard-preview-container') || svg.parentElement;
      if (parent) {
        parent.classList.remove(
          'finish-matte',
          'finish-metallic',
          'finish-gloss'
        );
        parent.classList.add(`finish-${state.config.finish}`);
      }

      // Finish Highlight Rect
      const highlight = svg.querySelector('.kb-finish-highlight');
      if (highlight) {
        if (state.config.finish === 'matte') {
          highlight.style.fill = 'none';
          highlight.style.opacity = '0';
        } else if (state.config.finish === 'metallic') {
          highlight.style.fill = 'url(#finish-grad-metallic)';
          highlight.style.opacity = '0.24';
        } else {
          highlight.style.fill = 'url(#finish-grad-gloss)';
          highlight.style.opacity = '0.38';
        }
      }
    });

    // Update labels with gentle crossfade
    document
      .querySelectorAll(
        '#body-change-label, #preview-accent .preview-change-indicator'
      )
      .forEach((el) => {
        el.classList.add('updating');
        el.textContent = getPreviewLabel();
        setTimeout(() => el.classList.remove('updating'), 200);
      });

    // Update dynamic selected option callout cards
    updateSelectedOptionDescriptions();
  }

  /* ── Dynamic Selected Option Descriptions ─────────────────────────── */
  function updateSelectedOptionDescriptions() {
    // Step 1: Chassis Tone Description
    const bodyDesc = document.getElementById('body-selected-desc');
    if (bodyDesc) {
      const colorKey = state.config.bodyColor.key;
      bodyDesc.classList.add('updating');
      bodyDesc.textContent = colorDescriptions[colorKey];
      setTimeout(() => bodyDesc.classList.remove('updating'), 120);
    }

    // Step 2: Switch Architecture Description
    const switchDesc = document.getElementById('switch-selected-desc');
    if (switchDesc) {
      const switchKey = state.config.switchType;
      switchDesc.classList.add('updating');
      switchDesc.textContent = switchDescriptions[switchKey];
      setTimeout(() => switchDesc.classList.remove('updating'), 120);
    }

    // Step 3: Signature Accent Description
    const accentDesc = document.getElementById('accent-selected-desc');
    if (accentDesc) {
      const accentKey = state.config.accent.key;
      accentDesc.classList.add('updating');
      accentDesc.textContent = accentDescriptions[accentKey];
      setTimeout(() => accentDesc.classList.remove('updating'), 120);
    }
  }

  /* ── Switch Internals Preview Updates (Step 2) ────────────────────── */
  function updateSwitchInternalPreview() {
    updateSelectedOptionDescriptions();
    const spec = switchSpecs[state.config.switchType];
    const container = document.getElementById('preview-switch-internals');
    if (!container) return;

    // Update telemetry metrics
    const forceEl = document.getElementById('spec-force');
    const pretravelEl = document.getElementById('spec-pretravel');
    const totalEl = document.getElementById('spec-total');
    const acousticEl = document.getElementById('spec-acoustic');
    const switchLabel = document.getElementById('switch-change-label');

    if (forceEl) forceEl.textContent = spec.force;
    if (pretravelEl) pretravelEl.textContent = spec.pretravel;
    if (totalEl) totalEl.textContent = spec.total;
    if (acousticEl) acousticEl.textContent = spec.acoustic;
    if (switchLabel) {
      switchLabel.classList.add('updating');
      switchLabel.textContent = spec.desc;
      setTimeout(() => switchLabel.classList.remove('updating'), 200);
    }

    // Update SVG switch internals
    const stemMount = container.querySelector('.switch-stem-mount');
    const stemBody = container.querySelector('.switch-stem-body');
    const clickbarGroup = container.querySelector('.switch-clickbar-group');
    const tactileCam = container.querySelector('.switch-tactile-cam');
    const glideRail = container.querySelector('.switch-glide-rail');

    if (stemMount) stemMount.style.fill = spec.stemColor;
    if (stemBody) stemBody.style.fill = spec.stemColor;

    if (state.config.switchType === 'clicky') {
      if (clickbarGroup) clickbarGroup.style.display = '';
      if (tactileCam) tactileCam.style.opacity = '0';
      if (glideRail) glideRail.style.opacity = '0.2';
    } else if (state.config.switchType === 'tactile') {
      if (clickbarGroup) clickbarGroup.style.display = 'none';
      if (tactileCam) tactileCam.style.opacity = '0.85';
      if (glideRail) glideRail.style.opacity = '0.3';
    } else {
      // Linear
      if (clickbarGroup) clickbarGroup.style.display = 'none';
      if (tactileCam) tactileCam.style.opacity = '0';
      if (glideRail) glideRail.style.opacity = '0.8';
    }

    animateSwitchActuation();
  }

  function animateSwitchActuation() {
    const stem = document.querySelector('.switch-stem-assembly');
    const dot = document.querySelector('.switch-contact-dot');
    if (!stem) return;

    stem.style.transform = 'translateY(12px)';
    if (dot) dot.style.opacity = '1';

    setTimeout(() => {
      stem.style.transform = 'translateY(0)';
      if (dot) dot.style.opacity = '0.6';
    }, 280);
  }

  document
    .querySelector('.switch-diagram-wrap')
    ?.addEventListener('click', () => {
      animateSwitchActuation();
    });

  /* ── Color Selection ──────────────────────────────────────────────── */
  document.querySelectorAll('.color-option').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-color');
      const hex = card.getAttribute('data-hex');
      state.config.bodyColor = { name: colorNames[key], hex, key };

      document
        .querySelectorAll('.color-option')
        .forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');

      updateKeyboardPreview();
    });
  });

  /* ── Finish Selection ─────────────────────────────────────────────── */
  const finishBtns = document.querySelectorAll('.finish-btn');
  const finishIndicator = document.querySelector('.finish-indicator');

  finishBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      state.config.finish = btn.getAttribute('data-finish');

      finishBtns.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');

      if (finishIndicator) {
        finishIndicator.style.transform = `translateX(${index * 100}%)`;
      }

      updateKeyboardPreview();
    });
  });

  /* ── Switch Selection ─────────────────────────────────────────────── */
  document.querySelectorAll('.switch-option').forEach((card) => {
    card.addEventListener('click', () => {
      state.config.switchType = card.getAttribute('data-switch');

      document
        .querySelectorAll('.switch-option')
        .forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');

      updateSwitchInternalPreview();
      updateKeyboardPreview();
    });
  });

  /* ── Accent Selection ─────────────────────────────────────────────── */
  document.querySelectorAll('.accent-option').forEach((card) => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-accent');
      const hex = card.getAttribute('data-hex');
      state.config.accent = { name: accentNames[key], hex, key };

      document
        .querySelectorAll('.accent-option')
        .forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');

      updateKeyboardPreview();
    });
  });

  /* ── Congrats Screen Population ───────────────────────────────────── */
  function populateCongrats() {
    const summary = document.getElementById('config-summary');
    if (summary) {
      summary.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Chassis</span>
          <span class="summary-value">${state.config.bodyColor.name}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Finish</span>
          <span class="summary-value">${finishNames[state.config.finish]}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Switches</span>
          <span class="summary-value">${switchSpecs[state.config.switchType].name}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Signature Accent</span>
          <span class="summary-value">${state.config.accent.name}</span>
        </div>
      `;
    }

    cloneKeyboardPreview('congrats');

    const paintDesc = document.getElementById('paint-desc');
    if (paintDesc) {
      paintDesc.textContent = `Applying your bespoke ${state.config.bodyColor.name} ${finishNames[state.config.finish]} surface treatment…`;
    }
    const switchDesc = document.getElementById('switch-desc');
    if (switchDesc) {
      switchDesc.textContent = `Hand-lubricating each ${switchSpecs[state.config.switchType].name} low-profile switch for buttery glide…`;
    }
  }

  /* ── Build Simulation & Background Process Video Synchronization ──── */
  const BUILD_STAGES = 7;
  const STAGE_DURATION = 3200; // ms per stage for comfortable viewing of process videos

  function updateProcessVideo(stageIndex) {
    const videos = document.querySelectorAll('.build-video');
    videos.forEach((vid, idx) => {
      if (idx === stageIndex) {
        vid.classList.add('active');
        vid.play().catch(() => {});
      } else {
        vid.classList.remove('active');
      }
    });
  }

  function startBuildSimulation() {
    if (state.buildRunning) return;
    state.buildRunning = true;

    const stages = document.querySelectorAll('.build-stage');
    const progressFill = document.getElementById('build-progress');
    const completeEl = document.getElementById('build-complete');

    // Reset
    stages.forEach((s) => {
      s.classList.remove('active', 'complete');
      s.querySelector('.stage-status').textContent = 'Waiting';
    });
    if (progressFill) progressFill.style.width = '0%';
    if (completeEl) completeEl.classList.remove('visible');

    let currentStage = 0;
    updateProcessVideo(0);

    function processStage() {
      if (currentStage >= BUILD_STAGES) {
        setTimeout(() => {
          if (completeEl) completeEl.classList.add('visible');
          launchConfetti();
          state.buildRunning = false;
        }, 400);
        return;
      }

      const stage = stages[currentStage];
      if (!stage) return;

      stage.classList.add('active');
      stage.querySelector('.stage-status').textContent = 'In Progress';
      
      // Auto-scroll the active stage into view for small scrollable windows (mobile)
      stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      updateProcessVideo(currentStage);

      if (progressFill) {
        const pct = ((currentStage + 0.5) / BUILD_STAGES) * 100;
        progressFill.style.width = `${pct}%`;
      }

      setTimeout(() => {
        stage.classList.remove('active');
        stage.classList.add('complete');
        stage.querySelector('.stage-status').textContent = 'Complete';

        if (progressFill) {
          const pct = ((currentStage + 1) / BUILD_STAGES) * 100;
          progressFill.style.width = `${pct}%`;
        }

        currentStage++;
        setTimeout(processStage, 350);
      }, STAGE_DURATION);
    }

    setTimeout(processStage, 400);
  }

  function resetBuild() {
    state.buildRunning = false;
    const stages = document.querySelectorAll('.build-stage');
    const progressFill = document.getElementById('build-progress');
    const completeEl = document.getElementById('build-complete');

    stages.forEach((s) => {
      s.classList.remove('active', 'complete');
      s.querySelector('.stage-status').textContent = 'Waiting';
    });
    if (progressFill) progressFill.style.width = '0%';
    if (completeEl) completeEl.classList.remove('visible');
    updateProcessVideo(0);
  }

  /* ── Confetti (Subtle Gold/Silver Flakes) ──────────────────────────── */
  function launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = [
      '#81613E',
      '#C4AE94',
      '#A68460',
      '#eae5dc',
      '#78a883',
      '#b76e79',
      '#d4d4d4',
    ];
    const pieces = 50;

    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 1.2}s`;
      piece.style.animationDuration = `${2.5 + Math.random() * 2}s`;
      piece.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = `${3 + Math.random() * 6}px`;
      piece.style.height = `${3 + Math.random() * 6}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 5000);
  }

  /* ── Typewriter Effect with Continuous Cursor Pulse ──────────────── */
  function initTypewriterEffect() {
    const typedEl = document.getElementById('hero-typed-text');
    if (!typedEl) return;

    const fullText = "The First Keystroke\nYou'll Never Forget";
    let charIndex = 0;
    typedEl.textContent = '';

    function typeNextChar() {
      if (charIndex < fullText.length) {
        typedEl.textContent = fullText.slice(0, charIndex + 1);
        charIndex++;

        const nextChar = fullText[charIndex - 1];
        let delay = 60 + Math.random() * 35;
        if (nextChar === '\n') delay = 260; // pause between lines
        if (nextChar === ' ') delay = 90;

        setTimeout(typeNextChar, delay);
      }
    }

    // Start after slight delay for visual smoothness on initial load
    setTimeout(typeNextChar, 400);
  }

  /* ── Keyboard Shortcuts ───────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.currentSection !== 'hero') {
        navigateTo('hero');
      }
    }
  });

  /* ── Initialization ───────────────────────────────────────────────── */
  function init() {
    updatePillNav('hero');
    updateKeyboardPreview();
    updateSwitchInternalPreview();
    initTypewriterEffect();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }
})();
