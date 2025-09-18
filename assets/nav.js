// Simple nav toggle for mobile
document.addEventListener('DOMContentLoaded', function () {
  var btns = document.querySelectorAll('.nav-toggle');
  btns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var targetId = btn.getAttribute('aria-controls');
      var nav = document.getElementById(targetId);
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (nav) nav.classList.toggle('open');
    });
  });
});
