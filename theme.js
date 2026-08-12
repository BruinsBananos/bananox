/* Banano X — first-paint theme + legacy .html redirect */
(function () {
  "use strict";
  try {
    var path = location.pathname || "";
    if (/\.html$/i.test(path)) {
      var clean = path.replace(/\.html$/i, "");
      if (clean === "/index" || clean === "") clean = "/";
      else if (clean.charAt(clean.length - 1) !== "/") clean += "/";
      location.replace(clean + location.search + location.hash);
      return;
    }
  } catch (e) {}
  try {
    var k = "bx-theme";
    var t = localStorage.getItem(k);
    if (t !== "light" && t !== "dark") {
      t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
