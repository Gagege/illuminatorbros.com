(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  document.documentElement.classList.add("js");

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Navigation */

  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var menu = document.getElementById("site-menu");

  if (nav) {
    var setScrolled = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  if (nav && toggle && menu) {
    var setMenu = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    };

    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    var desktop = window.matchMedia("(min-width: 921px)");
    var onDesktop = function (e) {
      if (e.matches) setMenu(false);
    };
    if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);
  }

  /* Highlight the nav link for the section in view */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav__links a"));
  if (hasIO && navLinks.length) {
    var linkFor = {};
    navLinks.forEach(function (a) {
      if (a.hash) linkFor[a.hash.slice(1)] = a;
    });

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
            l.removeAttribute("aria-current");
          });
          var link = linkFor[entry.target.id];
          if (link) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    document.querySelectorAll("main > section[id], footer[id]").forEach(function (s) {
      spy.observe(s);
    });
  }

  /* Anchor jumps only. Wheel and trackpad scrolling stay native. */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest("a[href]");
    if (!link) return;
    var url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (err) {
      return;
    }
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (window.history && history.pushState) history.pushState(null, "", url.hash);
  });

  /* Gentle snowfall over the hero */

  var canvas = document.querySelector("[data-snow]");
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var flakes = [];
    var width = 0;
    var height = 0;
    var frame = null;
    var heroVisible = true;

    var makeFlake = function (anywhere) {
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -8,
        r: Math.random() * 1.7 + 0.5,
        speed: Math.random() * 0.5 + 0.25,
        drift: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.45 + 0.2
      };
    };

    var resize = function () {
      var dpr = 1;
      var newWidth = canvas.clientWidth;
      var widthChanged = newWidth !== width;
      width = newWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (widthChanged) {
        var count = Math.round(Math.min(48, (width * height) / 22000));
        flakes = [];
        for (var i = 0; i < count; i++) flakes.push(makeFlake(true));
      }
    };

    var lastDraw = 0;
    var draw = function (now) {
      frame = requestAnimationFrame(draw);
      if (now - lastDraw < 32) return;
      var step = lastDraw ? Math.min(3, (now - lastDraw) / 32) : 1;
      lastDraw = now;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += (f.speed + f.r * 0.12) * step;
        f.drift += 0.012 * step;
        f.x += Math.sin(f.drift) * 0.3 * step;
        if (f.y > height + 6) {
          flakes[i] = makeFlake(false);
          continue;
        }
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    var start = function () {
      if (frame === null && heroVisible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    var stop = function () {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };

    resize();
    window.addEventListener("resize", debounce(resize, 150));

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) start();
        else stop();
      }).observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    var scrollIdle = null;
    window.addEventListener(
      "scroll",
      function () {
        stop();
        clearTimeout(scrollIdle);
        scrollIdle = setTimeout(start, 140);
      },
      { passive: true }
    );

    start();
  }

  /* Design your display */

  var studio = document.querySelector("[data-studio]");
  if (studio) {
    var NS = "http://www.w3.org/2000/svg";
    var bulbGroup = studio.querySelector("[data-studio-bulbs]");
    var styleSelect = document.querySelector("[data-style-select]");
    var lightSwitch = studio.querySelector("[data-studio-switch]");
    var switchState = lightSwitch && lightSwitch.querySelector(".switch__state");
    var styleNames = { warm: "Warm white", multi: "Multicolor", cool: "Cool white" };
    var interacted = false;
    var bulbsBuilt = false;

    var buildBulbs = function () {
      if (bulbsBuilt) return;
      bulbsBuilt = true;
      var fragment = document.createDocumentFragment();
      var probes = [];

      studio.querySelectorAll("[data-lights]").forEach(function (path) {
        var spacing = parseFloat(path.getAttribute("data-lights")) || 16;
        var radius = parseFloat(path.getAttribute("data-r")) || 3.6;
        path.getAttribute("d").split(/(?=M)/).forEach(function (segment) {
          var probe = document.createElementNS(NS, "path");
          probe.setAttribute("d", segment);
          probe._spacing = spacing;
          probe._radius = radius;
          probes.push(probe);
        });
      });

      probes.forEach(function (probe) {
        bulbGroup.appendChild(probe);
      });
      probes.forEach(function (probe) {
        var length = probe.getTotalLength();
        var count = Math.max(1, Math.round(length / probe._spacing));
        var step = length / count;
        for (var k = 0; k <= count; k++) {
          var point = probe.getPointAtLength(k * step);
          var bulb = document.createElementNS(NS, "circle");
          bulb.setAttribute("cx", point.x.toFixed(1));
          bulb.setAttribute("cy", point.y.toFixed(1));
          bulb.setAttribute("r", String(probe._radius));
          bulb.setAttribute("class", "bulb");
          fragment.appendChild(bulb);
        }
      });
      probes.forEach(function (probe) {
        bulbGroup.removeChild(probe);
      });
      bulbGroup.appendChild(fragment);
    };

    var setLights = function (on) {
      studio.classList.toggle("is-on", on);
      if (lightSwitch) lightSwitch.setAttribute("aria-checked", String(on));
      if (switchState) switchState.textContent = on ? "On" : "Off";
    };

    if (lightSwitch) {
      lightSwitch.addEventListener("click", function () {
        interacted = true;
        setLights(!studio.classList.contains("is-on"));
      });
    }

    studio.querySelectorAll('input[name="studio-style"]').forEach(function (input) {
      input.addEventListener("change", function () {
        interacted = true;
        studio.setAttribute("data-mode", input.value);
        if (!studio.classList.contains("is-on")) setLights(true);
        if (styleSelect && styleNames[input.value]) styleSelect.value = styleNames[input.value];
      });
    });

    // Build and switch the lights on after first paint, not while the section scrolls in.
    var lightUp = function () {
      buildBulbs();
      if (!interacted) setLights(true);
    };
    if (window.requestAnimationFrame) {
      requestAnimationFrame(function () {
        requestAnimationFrame(lightUp);
      });
    } else {
      lightUp();
    }
  }

  /* Estimate form */

  var form = document.querySelector("[data-estimate-form]");
  if (form && window.fetch && window.FormData) {
    var statusEl = form.querySelector("[data-form-status]");
    var submit = form.querySelector("[data-submit]");
    var submitLabel = submit.querySelector("span");
    var defaultLabel = submitLabel.textContent;
    var success = document.querySelector("[data-form-success]");
    var resetButton = document.querySelector("[data-form-reset]");
    var email = form.getAttribute("data-email");

    var setBusy = function (busy) {
      submit.disabled = busy;
      submitLabel.textContent = busy ? "Sending\u2026" : defaultLabel;
    };

    var showError = function (message) {
      statusEl.classList.add("is-error");
      statusEl.textContent = message + " ";
      if (email) {
        var link = document.createElement("a");
        link.href = "mailto:" + email;
        link.textContent = "Or email us at " + email + ".";
        statusEl.appendChild(link);
      }
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");
      setBusy(true);

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            form.hidden = true;
            success.hidden = false;
            success.focus();
            return;
          }
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              var fieldErrors = (data && data.errors ? data.errors : []).filter(function (err) {
                return err.field;
              });
              if (fieldErrors.length) {
                showError(
                  fieldErrors
                    .map(function (err) {
                      return err.message;
                    })
                    .join(" ")
                );
              } else {
                // Let Formspree handle anything it can't do over AJAX (e.g. a CAPTCHA challenge).
                HTMLFormElement.prototype.submit.call(form);
              }
            });
        })
        .catch(function () {
          showError("We couldn't send your request. Please check your connection and try again.");
        })
        .then(function () {
          setBusy(false);
        });
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        success.hidden = true;
        form.hidden = false;
        var first = form.querySelector("input:not([type=hidden])");
        if (first) first.focus();
      });
    }
  }

  /* Sticky mobile call to action */

  var mobileCta = document.querySelector("[data-mobile-cta]");
  var hero = document.querySelector(".hero");
  if (mobileCta && hero && hasIO) {
    var hidden = { hero: true, form: false, footer: false };
    var targets = [
      [hero, "hero"],
      [document.getElementById("contact-form"), "form"],
      [document.querySelector(".site-footer"), "footer"]
    ];
    var updateCta = function () {
      mobileCta.classList.toggle("is-visible", !hidden.hero && !hidden.form && !hidden.footer);
    };
    var ctaObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        targets.forEach(function (t) {
          if (t[0] === entry.target) hidden[t[1]] = entry.isIntersecting;
        });
      });
      updateCta();
    });
    targets.forEach(function (t) {
      if (t[0]) ctaObserver.observe(t[0]);
    });
  }
})();
