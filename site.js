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
    });

    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
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

  // Gentler density than the original
  setInterval(spawnBanana, 700);
  setInterval(spawnFirefly, 400);
  for (let i = 0; i < 6; i++) spawnFirefly();
})();
