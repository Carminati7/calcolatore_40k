// Simple nav toggle for mobile
document.addEventListener('DOMContentLoaded', function () {
  var btns = document.querySelectorAll('.nav-toggle');
  btns.forEach(function(btn){
    var targetId = btn.getAttribute('aria-controls');
    var nav = document.getElementById(targetId);
    // ensure initial state
    if (nav && !nav.hasAttribute('aria-hidden')) nav.setAttribute('aria-hidden', 'true');
    btn.addEventListener('click', function(e){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (nav) {
        nav.classList.toggle('open');
        nav.setAttribute('aria-hidden', String(expanded));
        if (nav.classList.contains('open')) {
          // move focus to first link for accessibility
          var firstLink = nav.querySelector('a');
          if (firstLink) firstLink.focus();
        } else {
          btn.focus();
        }
      }
      e.stopPropagation();
    });

    // close when clicking a link inside nav (mobile behavior)
    if (nav) {
      nav.addEventListener('click', function(ev){
        var tgt = ev.target.closest('a');
        if (tgt && window.matchMedia('(max-width: 700px)').matches) {
          // close
          nav.classList.remove('open');
          nav.setAttribute('aria-hidden', 'true');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    }
  });

  // close nav on Escape or click outside when open
  document.addEventListener('keydown', function(ev){
    if (ev.key === 'Escape') {
      var openNav = document.querySelector('.main-nav.open');
      var toggle = document.querySelector('.nav-toggle');
      if (openNav) {
        openNav.classList.remove('open');
        openNav.setAttribute('aria-hidden', 'true');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      }
    }
  });

  document.addEventListener('click', function(ev){
    var openNav = document.querySelector('.main-nav.open');
    var toggle = document.querySelector('.nav-toggle');
    if (!openNav) return;
    var isClickInside = openNav.contains(ev.target) || (toggle && toggle.contains(ev.target));
    if (!isClickInside) {
      openNav.classList.remove('open');
      openNav.setAttribute('aria-hidden', 'true');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }
  });
});
