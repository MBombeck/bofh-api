/**
 * BOFH Excuses API — Landing Page Orchestrator
 * Hero excuse generator, tab switcher, copy buttons.
 */
(function () {
  'use strict';

  // --- Hero: Random Excuse ---
  const excuseBtn = document.getElementById('new-excuse-btn');
  const excuseCode = document.getElementById('hero-excuse-code');

  if (excuseBtn && excuseCode) {
    excuseBtn.addEventListener('click', fetchNewExcuse);
    // Load one on page init
    fetchNewExcuse();
  }

  async function fetchNewExcuse() {
    try {
      excuseBtn.disabled = true;
      const res = await fetch('/v1/excuses/random');
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const pretty = JSON.stringify(json, null, 2);
        excuseCode.textContent = pretty;
      }
    } catch (err) {
      // Silently fail — keep existing content
    } finally {
      excuseBtn.disabled = false;
    }
  }

  // --- Tab Switcher ---
  const tabs = document.querySelectorAll('.tab[data-tab]');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.getAttribute('data-tab');

      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach(function (p) {
        p.classList.remove('active');
      });
      var panel = document.getElementById('panel-' + target);
      if (panel) panel.classList.add('active');
    });

    // Keyboard navigation for tabs
    tab.addEventListener('keydown', function (e) {
      var idx = Array.from(tabs).indexOf(tab);
      var next;
      if (e.key === 'ArrowRight') {
        next = tabs[(idx + 1) % tabs.length];
      } else if (e.key === 'ArrowLeft') {
        next = tabs[(idx - 1 + tabs.length) % tabs.length];
      }
      if (next) {
        e.preventDefault();
        next.focus();
        next.click();
      }
    });
  });

  // --- Copy Buttons ---
  document.querySelectorAll('.copy-btn[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (!text) return;

      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(function () {
        // Fallback: select text in code block
        var pre = btn.closest('.code-block').querySelector('pre');
        if (pre) {
          var range = document.createRange();
          range.selectNodeContents(pre);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    });
  });
})();
