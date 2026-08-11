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
