/* ---------------------------------------------------------
   Portfolio behaviour: theme, nav indicator, scroll spy, reveals
   --------------------------------------------------------- */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- theme ---------- */
  var toggle = document.getElementById("themeToggle");
  var stored = null;
  try { stored = localStorage.getItem("dej-theme"); } catch (e) { /* private mode */ }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // The tab icon follows the page theme too: Himmel in light, Frieren in dark.
  // CSS can't reach the <link>, so it's swapped here.
  var favicon = document.getElementById("favicon");
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (favicon) {
      favicon.href = theme === "dark" ? "assets/favicon-dark.png" : "assets/favicon.png";
    }
  }

  applyTheme(stored || (prefersDark ? "dark" : "light"));

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("dej-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- nav indicator + scroll spy ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".navigation .list"));
  var sections = items
    .map(function (li) { return document.getElementById(li.dataset.target); })
    .filter(Boolean);

  function setActive(index) {
    items.forEach(function (li, i) { li.classList.toggle("active", i === index); });
  }

  items.forEach(function (li, i) {
    li.addEventListener("click", function () { setActive(i); });
  });

  // Which section occupies the middle of the viewport wins.
  var ticking = false;
  function spy() {
    var line = window.scrollY + window.innerHeight * 0.42;
    var current = 0;
    sections.forEach(function (sec, i) {
      if (sec.offsetTop <= line) current = i;
    });
    // pin the last section once the page is scrolled to the bottom
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
      current = sections.length - 1;
    }
    setActive(current);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(spy);
    }
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add("in"); });
  }

  /* ---------- skill tags: one scrolling line per card ----------
     The markup holds one copy of each set. Here it's wrapped in a clipping
     container and repeated until the track is at least twice the visible
     width, so translating by exactly one set length loops seamlessly. */
  var SCROLL_SPEED = 34; // px per second

  function buildMarquee(list) {
    var card = list.parentNode;
    if (!card || card.classList.contains("skill-marquee")) return;

    var wrap = document.createElement("div");
    wrap.className = "skill-marquee";
    card.insertBefore(wrap, list);
    wrap.appendChild(list);

    var styles = window.getComputedStyle(list);
    var gap = parseFloat(styles.columnGap || styles.gap) || 0;

    // measure one set before any cloning
    var setWidth = list.scrollWidth;
    if (!setWidth) return;
    var shift = setWidth + gap;

    var originals = Array.prototype.slice.call(list.children);
    var copiesNeeded = Math.max(1, Math.ceil((wrap.clientWidth * 2) / shift));

    for (var c = 0; c < copiesNeeded; c++) {
      for (var i = 0; i < originals.length; i++) {
        var clone = originals[i].cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        list.appendChild(clone);
      }
    }

    list.style.setProperty("--shift", shift + "px");
    list.style.setProperty("--dur", (shift / SCROLL_SPEED).toFixed(2) + "s");
  }

  var skillLists = document.querySelectorAll(".skill-card .tags");
  Array.prototype.forEach.call(skillLists, buildMarquee);

  // widths change with the layout, so rebuild the measurements on resize
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll(".skill-marquee .tags"), function (list) {
        var kept = [];
        Array.prototype.forEach.call(list.children, function (li) {
          if (!li.hasAttribute("aria-hidden")) kept.push(li);
        });
        list.innerHTML = "";
        kept.forEach(function (li) { list.appendChild(li); });
        var wrap = list.parentNode;
        wrap.parentNode.insertBefore(list, wrap);
        wrap.parentNode.removeChild(wrap);
        buildMarquee(list);
      });
    }, 250);
  });

  /* ---------- sparkle on every button ----------
     The stars are injected rather than written into the markup, so every
     button is decorated from one place and a new one picks it up for free. */
  var SPARKLE_TARGETS = ".btn, .paper-link, .theme-toggle";
  var STAR_PATH = "M12 0l2.6 8.6L22 12l-7.4 3.4L12 24l-2.6-8.6L2 12l7.4-3.4z";
  var SVG_NS = "http://www.w3.org/2000/svg";

  Array.prototype.forEach.call(document.querySelectorAll(SPARKLE_TARGETS), function (el) {
    if (el.querySelector(".stars")) return;
    el.classList.add("sparkle");

    var stars = document.createElement("span");
    stars.className = "stars";
    stars.setAttribute("aria-hidden", "true");

    for (var i = 1; i <= 4; i++) {
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", "star star-" + i); // SVG className is read-only
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", STAR_PATH);
      svg.appendChild(path);
      stars.appendChild(svg);
    }
    el.appendChild(stars);
  });

  /* ---------- headings decode out of scrambled characters ----------
     Each heading first renders as random symbols, then resolves left to right.
     It walks TEXT NODES rather than setting textContent, so markup inside a
     heading survives — the hero's <br> and the paper titles' <a> would both be
     destroyed by a textContent swap. */
  var SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#$%&abcdef0123456789";
  var SCRAMBLE_TARGETS = "h1, h2";   // main headings only; h3/h4 are subheadings
  var DECODE_MIN_MS = 3000;   // a decode always lasts at least this long
  var DECODE_MAX_MS = 5000;   // ...and never longer than this
  var ROLL_MS = 55;           // how often an unresolved glyph changes

  function randChar() {
    return SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length));
  }

  function decode(el) {
    if (el.dataset.decoded) return;
    el.dataset.decoded = "1";

    var nodes = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.trim()) nodes.push(n);
    }
    if (!nodes.length) return;

    // Screen readers would otherwise announce the gibberish mid-flight.
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());

    var originals = nodes.map(function (node) { return node.nodeValue; });
    var plan = [];
    var letterCount = 0;
    originals.forEach(function (text, ni) {
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        var isSpace = /\s/.test(ch);
        if (!isSpace) letterCount++;
        plan.push({ ni: ni, ch: ch, space: isSpace, revealAt: 0, cur: randChar() });
      }
    });

    // Scheduled in milliseconds, not frames: a frame count would run at half
    // the intended duration on a 120Hz display.
    // never under the 5s floor; capped so the longest title (the ~90-character
    // "Wheels of Burden" one) doesn't crawl for 10 seconds
    var duration = Math.min(DECODE_MAX_MS, Math.max(DECODE_MIN_MS, letterCount * 110));
    var k = 0;
    plan.forEach(function (p) {
      if (p.space) return;                      // spaces resolve immediately
      var span = letterCount > 1 ? k / (letterCount - 1) : 1;
      // start the first reveal a little in, so the heading is fully scrambled
      // for a beat before it begins resolving
      var at = duration * (0.12 + 0.88 * span);
      // jitter only ever pulls a glyph EARLIER; nudging the last one later
      // would overrun the duration, and letting it land early would end the
      // decode before the promised minimum
      at -= Math.random() * duration * 0.06;
      p.revealAt = Math.min(duration, Math.max(0, at));
      if (k === letterCount - 1) p.revealAt = duration;   // last glyph closes it out
      k++;
    });

    var startTime = null;
    var lastRoll = -1;
    var written = originals.map(function () { return null; });

    function tick(now) {
      if (startTime === null) startTime = now;
      var elapsed = now - startTime;
      var roll = Math.floor(elapsed / ROLL_MS);
      if (roll !== lastRoll) {
        lastRoll = roll;
        for (var r = 0; r < plan.length; r++) {
          if (!plan[r].space && elapsed < plan[r].revealAt) plan[r].cur = randChar();
        }
      }

      var buffers = [];
      var i;
      for (i = 0; i < originals.length; i++) buffers[i] = "";
      for (i = 0; i < plan.length; i++) {
        var p = plan[i];
        buffers[p.ni] += (p.space || elapsed >= p.revealAt) ? p.ch : p.cur;
      }

      // only touch the DOM when the text actually changed
      for (i = 0; i < nodes.length; i++) {
        if (buffers[i] !== written[i]) {
          nodes[i].nodeValue = buffers[i];
          written[i] = buffers[i];
        }
      }

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        for (i = 0; i < nodes.length; i++) nodes[i].nodeValue = originals[i];
        el.removeAttribute("aria-label");
      }
    }
    requestAnimationFrame(tick);
  }

  var scrambleTargets = document.querySelectorAll(SCRAMBLE_TARGETS);
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var decodeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          decode(entry.target);
          decodeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    Array.prototype.forEach.call(scrambleTargets, function (el) { decodeObserver.observe(el); });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
