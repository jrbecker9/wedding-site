/* =====================================================================
   Carlos & Jesse — shared behaviour
   Scroll-reveal for elements marked .reveal / .reveal-stagger.
   Motion is skipped entirely when the visitor prefers reduced motion.
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealAllNow(els) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var els = Array.prototype.slice.call(
      document.querySelectorAll(".reveal, .reveal-stagger")
    );
    if (!els.length) return;

    // No observer support or reduced motion → just show everything.
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealAllNow(els);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function (el) { io.observe(el); });
  });
})();

/* =====================================================================
   Footer email-updates signup.
   Posts to the relative /api/subscribe endpoint (works on any domain).
   No-ops on pages without the form.
   ===================================================================== */
(function () {
  "use strict";
  var form = document.getElementById("subscribe-form");
  if (!form) return;

  var emailInput = form.querySelector('input[type="email"]');
  var websiteInput = form.querySelector('input[name="website"]'); // honeypot
  var submitBtn = form.querySelector(".fs-submit");
  var row = form.querySelector(".fs-row");
  var msg = form.querySelector(".fs-msg");

  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var sending = false;

  function showMsg(text, kind) {
    msg.textContent = text;
    msg.classList.remove("fs-error", "fs-ok");
    if (kind) msg.classList.add(kind);
  }

  emailInput.addEventListener("input", function () {
    if (msg.classList.contains("fs-error")) showMsg("");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;

    var email = emailInput.value.trim();
    if (!EMAIL_RE.test(email)) {
      showMsg("That doesn't look like an email. Mind checking it?", "fs-error");
      emailInput.focus();
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "…";
    showMsg("");

    fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        website: websiteInput ? websiteInput.value : "" // honeypot: humans leave empty
      })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; })
          .then(function (data) { return { res: res, data: data }; });
      })
      .then(function (r) {
        if (r.res.ok && r.data.ok) {
          row.classList.add("is-hidden");
          showMsg("You're on the list. We'll be in touch when we have news.", "fs-ok");
        } else {
          showMsg(
            (r.data && r.data.error) ||
            "Hm, couldn't reach us just now. Try again in a minute?",
            "fs-error"
          );
        }
      })
      .catch(function () {
        showMsg("Hm, couldn't reach us just now. Try again in a minute?", "fs-error");
      })
      .then(function () {
        sending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Keep me posted";
      });
  });
})();
