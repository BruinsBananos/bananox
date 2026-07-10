/* Banano X — shared site behavior */

(function () {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  // Scroll shadow on nav
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile menu
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open) closeAllDropdowns();
    });
  }

  // Dropdowns — hover on desktop, click-to-expand on mobile/touch
  const dropdownParents = document.querySelectorAll(".has-dropdown");

  function isTouchNav() {
    return window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(hover: none)").matches;
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

    // Desktop: pure CSS hover — don't click-lock the menu open
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

    // Keep aria-expanded in sync with hover for assistive tech on desktop
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
    if (e.key === "Escape") {
      closeAllDropdowns();
      if (links && links.classList.contains("open")) {
        links.classList.remove("open");
        if (toggle) {
          toggle.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      }
    }
  });

  // Close mobile menu when following a real link
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

  // Mark active nav item from current path
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

  // Home: mark logo as current when on index
  if (page === "index.html" || page === "") {
    const logo = document.querySelector(".logo");
    if (logo) logo.setAttribute("aria-current", "page");
  }

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // Hero particles (home only)
  const layer = document.getElementById("particles");
  if (!layer) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  function spawnBanana() {
    const el = document.createElement("div");
    el.className = "particle";
    el.textContent = "🍌";
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 0.9 + Math.random() * 1.1 + "rem";
    el.style.animationDuration = 10 + Math.random() * 10 + "s";
    el.style.opacity = String(0.25 + Math.random() * 0.4);
    layer.appendChild(el);
    setTimeout(() => el.remove(), 22000);
  }

  function spawnFirefly() {
    const el = document.createElement("div");
    el.className = "firefly";
    el.style.left = Math.random() * 100 + "%";
    el.style.top = Math.random() * 100 + "%";
    el.style.animationDelay = Math.random() * 4 + "s";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  }

  setInterval(spawnBanana, 700);
  setInterval(spawnFirefly, 400);
  for (let i = 0; i < 6; i++) spawnFirefly();
})();
