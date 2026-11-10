/*!
 * Illuminator Brothers site interactions
 */

(function ($) {
  "use strict";

  $("a.page-scroll").bind("click", function (event) {
    var $anchor = $(this);
    var target = $($anchor.attr("href"));
    if (!target.length) {
      return;
    }
    $("html, body").stop().animate(
      {
        scrollTop: target.offset().top - 56,
      },
      900,
      "easeInOutExpo"
    );
    event.preventDefault();
  });

  $("body").scrollspy({
    target: ".navbar-fixed-top",
    offset: 60,
  });

  $(".navbar-collapse ul li a").click(function () {
    $(".navbar-toggle:visible").click();
  });

  $("#mainNav").affix({
    offset: {
      top: 80,
    },
  });

  var revealNodes = document.querySelectorAll(".reveal, .service-item");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealNodes.forEach(function (node, index) {
      if (node.classList.contains("service-item")) {
        node.style.transitionDelay = index * 90 + "ms";
      }
      observer.observe(node);
    });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add("is-visible");
    });
  }

  if (typeof WOW !== "undefined") {
    new WOW().init();
  }
})(jQuery);
