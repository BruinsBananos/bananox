/* Banano X — shared site behavior (performance-first) */
(function () {
  "use strict";

  const THEME_KEY = "bx-theme";
  const root = document.documentElement;

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function currentTheme() {
    const t = root.getAttribute("data-theme");
    return t === "light" || t === "dark" ? t : systemTheme();
  }

  function applyTheme(theme, persist) {
    const next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      if (persist) localStorage.setItem(THEME_KEY, next);
    } catch (_) {
      /* private mode */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f4f0e0" : "#000000");
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", next === "light" ? "Switch to dark mode" : "Switch to light mode");
      btn.setAttribute("title", next === "light" ? "Dark mode" : "Light mode");
    });
  }

  // Sync if head script missed (file:// / partial pages)
  if (!root.getAttribute("data-theme")) {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (_) {
      /* ignore */
    }
    applyTheme(stored === "light" || stored === "dark" ? stored : systemTheme(), false);
  } else {
    applyTheme(currentTheme(), false);
  }

  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(currentTheme() === "light" ? "dark" : "light", true);
    });
  });

  // Follow OS only when user hasn't chosen
  try {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onScheme = () => {
      let stored = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch (_) {
        /* ignore */
      }
      if (stored !== "light" && stored !== "dark") applyTheme(systemTheme(), false);
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  } catch (_) {
    /* ignore */
  }

  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const dropdownParents = document.querySelectorAll(".has-dropdown");

  // ─── Scroll shadow on nav (rAF-throttled) ───
  if (nav) {
    let ticking = false;
    const apply = () => {
      nav.classList.toggle("scrolled", window.scrollY > 12);
      ticking = false;
    };
    apply();
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(apply);
        }
      },
      { passive: true }
    );
  }

  // ─── Mobile menu ───
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) closeAllDropdowns();
    });
  }

  function isTouchNav() {
    return (
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(hover: none)").matches
    );
  }

  function closeAllDropdowns(except) {
    dropdownParents.forEach((item) => {
      if (item === except) return;
      item.classList.remove("open");
      const btn = item.querySelector(".nav-drop-btn");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  dropdownParents.forEach((item) => {
    const btn = item.querySelector(".nav-drop-btn");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      if (!isTouchNav()) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const willOpen = !item.classList.contains("open");
      closeAllDropdowns(item);
      item.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    item.addEventListener("mouseenter", () => {
      if (!isTouchNav()) btn.setAttribute("aria-expanded", "true");
    });
    item.addEventListener("mouseleave", () => {
      if (!isTouchNav()) btn.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-dropdown")) closeAllDropdowns();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAllDropdowns();
    if (links && links.classList.contains("open")) {
      links.classList.remove("open");
      if (toggle) {
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    }
  });

  if (links) {
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        if (toggle) {
          toggle.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
        closeAllDropdowns();
      });
    });
  }

  // ─── Active nav ───
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const page = path === "" ? "index.html" : path;

  document.querySelectorAll(".nav-links a[href]").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (href && href === page) {
      a.classList.add("active");
      const parent = a.closest(".has-dropdown");
      if (parent) {
        const btn = parent.querySelector(".nav-drop-btn");
        if (btn) btn.classList.add("active");
      }
    }
  });

  if (page === "index.html" || page === "") {
    const logo = document.querySelector(".logo");
    if (logo) logo.setAttribute("aria-current", "page");
  }

  // ─── Instant navigation: Speculation Rules + hover prefetch ───
  const EXTRA_ASSETS = {
    "playtd.html": ["playTD.js"],
    "play.html": ["play.js"],
  };

  const prefetched = new Set();

  function sameOriginInternal(href) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return null;
    }
    try {
      const u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      if (u.pathname === location.pathname && u.hash) return null;
      return u.href;
    } catch {
      return null;
    }
  }

  function prefetchUrl(url, asType) {
    if (!url || prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    if (asType) link.as = asType;
    link.setAttribute("fetchpriority", "low");
    document.head.appendChild(link);
  }

  function prefetchPage(href) {
    const abs = sameOriginInternal(href);
    if (!abs) return;
    prefetchUrl(abs, "document");
    const file = abs.split("/").pop().split("?")[0].toLowerCase();
    const extras = EXTRA_ASSETS[file];
    if (extras) {
      extras.forEach((asset) => {
        prefetchUrl(new URL(asset, location.href).href, "script");
      });
    }
  }

  function injectSpeculationRules() {
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) {
      return;
    }
    const el = document.createElement("script");
    el.type = "speculationrules";
    el.textContent = JSON.stringify({
      prefetch: [
        {
          where: {
            and: [
              { href_matches: "/*" },
              { not: { href_matches: "https://*" } },
            ],
          },
          eagerness: "moderate",
        },
      ],
      prerender: [
        {
          where: {
            and: [
              { href_matches: "/*" },
              { not: { href_matches: "https://*" } },
              { not: { selector_matches: "[target=_blank]" } },
              { not: { selector_matches: "[rel~=external]" } },
            ],
          },
          eagerness: "conservative",
        },
      ],
    });
    document.head.appendChild(el);
  }

  injectSpeculationRules();

  // Hover / focus / touchstart prefetch for browsers without Speculation Rules
  let hoverTimer = 0;
  document.addEventListener(
    "pointerover",
    (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => prefetchPage(a.getAttribute("href")), 65);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchstart",
    (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (a) prefetchPage(a.getAttribute("href"));
    },
    { passive: true }
  );

  // Idle-prefetch light content pages only (games HTML/JS stay hover-prefetch)
  const IDLE_PREFETCH = [
    "facts.html",
    "ecosystem.html",
    "faucets.html",
    "community.html",
    "node.html",
    "playQuest.html",
  ];

  function idlePrefetch() {
    const run = (deadline) => {
      while (IDLE_PREFETCH.length && (!deadline || deadline.timeRemaining() > 8)) {
        prefetchPage(IDLE_PREFETCH.shift());
      }
      if (IDLE_PREFETCH.length) {
        if ("requestIdleCallback" in window) {
          requestIdleCallback(run, { timeout: 3000 });
        }
      }
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(() => run(null), 1200);
    }
  }
  idlePrefetch();

  // ─── Scroll reveal — only below the fold ───
  const reveals = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && !reduceMotion && "IntersectionObserver" in window) {
    // Anything in/near the first screen paints instantly (no blank strip under hero)
    const fold = window.innerHeight + 120;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target.classList.remove("is-pending");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "80px 0px -24px 0px" }
    );

    reveals.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top > fold) {
        el.classList.add("is-pending");
        io.observe(el);
      } else {
        el.classList.add("visible");
      }
    });
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // ─── Service worker (shell cache for instant revisits) ───
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {
        /* ignore offline / file:// failures */
      });
    });
  }

  // ─── Hero particles (home only, capped, paused when hidden) ───
  const layer = document.getElementById("particles");
  if (!layer || reduceMotion) return;

  const MAX_PARTICLES = 10;
  let bananaTimer = 0;
  let fireflyTimer = 0;
  let running = false;

  function particleCount() {
    return layer.childElementCount;
  }

  function spawnBanana() {
    if (particleCount() >= MAX_PARTICLES) return;
    const el = document.createElement("div");
    el.className = "particle";
    el.textContent = "🍌";
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 0.9 + Math.random() * 1.1 + "rem";
    el.style.animationDuration = 12 + Math.random() * 8 + "s";
    el.style.opacity = String(0.25 + Math.random() * 0.35);
    layer.appendChild(el);
    setTimeout(() => el.remove(), 21000);
  }

  function spawnFirefly() {
    if (particleCount() >= MAX_PARTICLES) return;
    const el = document.createElement("div");
    el.className = "firefly";
    el.style.left = Math.random() * 100 + "%";
    el.style.top = Math.random() * 100 + "%";
    el.style.animationDelay = Math.random() * 4 + "s";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  }

  function startParticles() {
    if (running || document.hidden) return;
    running = true;
    for (let i = 0; i < 4; i++) spawnFirefly();
    bananaTimer = setInterval(spawnBanana, 1400);
    fireflyTimer = setInterval(spawnFirefly, 900);
  }

  function stopParticles() {
    running = false;
    clearInterval(bananaTimer);
    clearInterval(fireflyTimer);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopParticles();
    else startParticles();
  });

  startParticles();
})();
