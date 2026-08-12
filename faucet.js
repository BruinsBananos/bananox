/* Banano X — faucet claim UI */
(function () {
  "use strict";

  var FAUCET_API = "https://node.bananox.com/faucet.php";
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    try {
      var q = new URLSearchParams(location.search).get("api");
      if (q && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(q)) {
        FAUCET_API = q;
      }
    } catch (e) {}
  }

  var form = document.getElementById("faucet-form");
  var input = document.getElementById("ban-address");
  var msg = document.getElementById("faucet-message");
  var submitBtn = document.getElementById("faucet-submit");
  var captchaSlot = document.getElementById("captcha-slot");
  var blurb = document.getElementById("faucet-blurb");
  if (!form || !input || !msg || !submitBtn || !captchaSlot) return;

  var BAN_RE = /^ban_[13][13456789abcdefghijkmnopqrstuwxyz]{59}$/i;
  var EXPLORER_RE = /^https:\/\/(creeper\.banano\.cc|yellowspyglass\.com|bananolooker\.com)\/[A-Za-z0-9_./\-?#=&%]+$/i;
  var meta = null;
  var turnstileWidgetId = null;
  var turnstileToken = "";
  var mathState = null;
  var busy = false;

  function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function setMessage(text, type) {
    clearEl(msg);
    msg.hidden = !text;
    if (text) msg.appendChild(document.createTextNode(text));
    msg.className = "faucet-message" + (type ? " is-" + type : "");
  }

  function setMessageWithLink(text, href, linkLabel, type) {
    clearEl(msg);
    msg.hidden = false;
    msg.appendChild(document.createTextNode(text + " "));
    if (href && EXPLORER_RE.test(href)) {
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = linkLabel || "View block";
      msg.appendChild(a);
    }
    msg.className = "faucet-message" + (type ? " is-" + type : "");
  }

  function safeText(v) {
    return String(v == null ? "" : v).replace(/[<>&"'`]/g, "");
  }

  function formatRetry(sec) {
    sec = Math.max(0, parseInt(sec, 10) || 0);
    if (sec < 60) return sec + "s";
    if (sec < 3600) return Math.ceil(sec / 60) + " min";
    if (sec < 86400) return Math.ceil(sec / 3600) + " h";
    return Math.ceil(sec / 86400) + " day(s)";
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("script_load_failed")); };
      document.head.appendChild(s);
    });
  }

  function renderMathCaptcha(challengePayload) {
    mathState = challengePayload;
    clearEl(captchaSlot);
    var label = document.createElement("label");
    label.className = "faucet-label";
    label.htmlFor = "math-answer";
    label.appendChild(document.createTextNode("Captcha: what is "));
    var strong = document.createElement("strong");
    strong.id = "math-q";
    strong.textContent = String(challengePayload.challenge || "");
    label.appendChild(strong);
    label.appendChild(document.createTextNode("?"));
    var ans = document.createElement("input");
    ans.className = "faucet-input";
    ans.type = "text";
    ans.inputMode = "numeric";
    ans.id = "math-answer";
    ans.name = "mathAnswer";
    ans.autocomplete = "off";
    ans.maxLength = 4;
    ans.required = true;
    ans.placeholder = "Answer";
    captchaSlot.appendChild(label);
    captchaSlot.appendChild(ans);
    submitBtn.disabled = false;
  }

  async function refreshMath() {
    var res = await fetch(FAUCET_API + "?challenge=1&_=" + Date.now(), { cache: "no-store" });
    var data = await res.json();
    if (!data.ok || !data.math) throw new Error("challenge_failed");
    renderMathCaptcha(data.math);
  }

  function renderTurnstile(sitekey) {
    if (!/^[A-Za-z0-9_-]{10,120}$/.test(String(sitekey || ""))) {
      setMessage("Captcha misconfigured.", "error");
      return;
    }
    clearEl(captchaSlot);
    var box = document.createElement("div");
    box.id = "cf-turnstile";
    box.className = "cf-turnstile";
    captchaSlot.appendChild(box);
    function mount() {
      if (!window.turnstile) return;
      turnstileWidgetId = window.turnstile.render("#cf-turnstile", {
        sitekey: sitekey,
        theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
        callback: function (token) {
          turnstileToken = token || "";
          submitBtn.disabled = false;
        },
        "expired-callback": function () {
          turnstileToken = "";
          submitBtn.disabled = true;
        },
        "error-callback": function () {
          turnstileToken = "";
          submitBtn.disabled = true;
          setMessage("Captcha failed to load. Refresh the page.", "error");
        }
      });
    }
    if (window.turnstile) {
      mount();
    } else {
      window.onloadTurnstileCallback = mount;
      loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback")
        .catch(function () {
          setMessage("Could not load captcha. Check blockers or try again.", "error");
        });
    }
  }

  function renderOdds(tiers) {
    var odds = document.getElementById("faucet-odds");
    var oddsList = document.getElementById("faucet-odds-list");
    if (!odds || !oddsList || !tiers || !tiers.length) return;
    clearEl(oddsList);
    odds.hidden = false;
    tiers.forEach(function (t) {
      var li = document.createElement("li");
      if (t.rare) li.className = "is-rare";
      var strong = document.createElement("strong");
      strong.textContent = safeText(t.amount) + " BAN";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" - " + safeText(t.chance_pct) + "%"));
      oddsList.appendChild(li);
    });
  }

  function captchaReady() {
    return meta && (meta.captcha === "turnstile" || meta.captcha === "math");
  }

  async function init() {
    setMessage("Loading faucet...", "info");
    submitBtn.disabled = true;
    try {
      var res = await fetch(FAUCET_API + "?meta=1&_=" + Date.now(), { cache: "no-store" });
      meta = await res.json();
      if (!meta || meta.ok === false) throw new Error("meta_failed");

      var minA = safeText(meta.amount_min_ban || "0.01");
      var maxA = safeText(meta.amount_max_ban || meta.amount_ban || "0.05");
      var cd = meta.cooldown_sec || 86400;
      if (blurb) {
        if (meta.gamble) {
          blurb.textContent = "Paste your address, pass captcha, roll " + minA + "-" + maxA + " BAN (once per " + formatRetry(cd) + ").";
        } else {
          blurb.textContent = "Paste your address, pass captcha, claim ~" + maxA + " BAN (once per " + formatRetry(cd) + ").";
        }
      }

      if (meta.gamble && meta.tiers && meta.tiers.length) {
        renderOdds(meta.tiers);
      }

      if (!captchaReady()) {
        setMessage("Faucet captcha is not configured. Claims are paused.", "error");
        submitBtn.disabled = true;
        return;
      }

      if (!meta.enabled) {
        setMessage("Faucet controls are live, but payouts are not enabled yet.", "info");
      } else {
        setMessage("", "");
      }

      if (meta.captcha === "turnstile" && meta.turnstile_sitekey) {
        renderTurnstile(meta.turnstile_sitekey);
      } else if (meta.captcha === "math") {
        await refreshMath();
      }
    } catch (err) {
      setMessage("Could not reach faucet API. Try again later.", "error");
      submitBtn.disabled = true;
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (busy) return;

    if (!captchaReady()) {
      setMessage("Faucet captcha is not configured. Claims are paused.", "error");
      return;
    }

    var addr = (input.value || "").trim();
    if (!addr) {
      setMessage("Paste a ban_ address first.", "error");
      input.focus();
      return;
    }
    if (!BAN_RE.test(addr)) {
      setMessage("That does not look like a valid ban_ address.", "error");
      input.focus();
      return;
    }

    var payload = { address: addr };
    var hp = document.getElementById("website");
    if (hp) payload.website = hp.value;

    if (meta.captcha === "turnstile") {
      if (!turnstileToken) {
        setMessage("Complete the captcha first.", "error");
        return;
      }
      payload.turnstileToken = turnstileToken;
    } else if (meta.captcha === "math") {
      var ansEl = document.getElementById("math-answer");
      if (!mathState || !ansEl || !ansEl.value.trim()) {
        setMessage("Solve the captcha first.", "error");
        return;
      }
      payload.mathChallenge = mathState.challenge;
      payload.mathExp = mathState.exp;
      payload.mathToken = mathState.token;
      payload.mathAnswer = ansEl.value.trim();
    }

    busy = true;
    submitBtn.disabled = true;
    setMessage("Submitting claim...", "info");

    try {
      var res = await fetch(FAUCET_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      var data = await res.json().catch(function () { return {}; });

      if (data.ok) {
        var okMsg = safeText(data.message || "Claim sent.");
        if (data.amount_ban) {
          okMsg = (data.jackpot ? "JACKPOT! " : "You rolled ") +
            safeText(data.amount_ban) + " BAN. " + safeText(data.message || "");
        }
        var type = "success" + (data.jackpot ? " is-jackpot" : "");
        if (data.explorer && EXPLORER_RE.test(String(data.explorer))) {
          setMessageWithLink(okMsg, String(data.explorer), "View block", type);
        } else {
          setMessage(okMsg, type.indexOf("jackpot") >= 0 ? "success is-jackpot" : "success");
        }
      } else {
        var err = safeText(data.message || "Claim failed.");
        if (data.retry_after) {
          err += " Retry in " + formatRetry(data.retry_after) + ".";
        }
        setMessage(err, "error");
      }
    } catch (err) {
      setMessage("Network error. Try again.", "error");
    } finally {
      busy = false;
      turnstileToken = "";
      if (meta && meta.captcha === "turnstile" && window.turnstile && turnstileWidgetId !== null) {
        try { window.turnstile.reset(turnstileWidgetId); } catch (e) {}
        submitBtn.disabled = true;
      } else if (meta && meta.captcha === "math") {
        refreshMath().catch(function () {});
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    }
  });

  input.addEventListener("input", function () {
    if (!msg.hidden && msg.classList.contains("is-error")) setMessage("", "");
  });

  init();
})();
