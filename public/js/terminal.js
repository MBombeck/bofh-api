/**
 * Interactive terminal emulator for the BOFH Excuses API landing page.
 * Commands: help, excuse, excuse <n>, excuse #<id>, status, clear
 */
(function () {
  'use strict';

  const API_BASE = window.location.origin;
  const output = document.getElementById('terminal-output');
  const input = document.getElementById('terminal-input');
  const body = document.getElementById('terminal-body');
  const history = [];
  let historyIndex = -1;

  if (!output || !input) return;

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value.trim();
      if (cmd) {
        history.unshift(cmd);
        historyIndex = -1;
        processCommand(cmd);
      }
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        input.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      } else {
        historyIndex = -1;
        input.value = '';
      }
    }
  });

  // Focus input when clicking terminal body
  body.addEventListener('click', function () {
    input.focus();
  });

  function appendLine(html, className) {
    const div = document.createElement('div');
    div.className = 'terminal-line ' + (className || '');
    div.innerHTML = html;
    output.appendChild(div);
    scrollToBottom();
  }

  function appendCmd(cmd) {
    appendLine('<span class="terminal-prompt-echo">$ </span>' + escapeHtml(cmd), 'terminal-cmd');
  }

  function appendResult(text) {
    appendLine(text, 'terminal-result');
  }

  function appendError(text) {
    appendLine(text, 'terminal-error');
  }

  function scrollToBottom() {
    output.scrollTop = output.scrollHeight;
  }

  function escapeHtml(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  function formatJson(obj) {
    const raw = JSON.stringify(obj, null, 2);
    return raw
      .replace(/"([^"]+)":/g, '<span class="t-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="t-str">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="t-num">$1</span>')
      .replace(/: null/g, ': <span class="t-null">null</span>');
  }

  async function processCommand(raw) {
    const parts = raw.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1] || '';

    appendCmd(raw);

    switch (cmd) {
      case 'help':
        appendResult(
          '<span class="t-accent">Available commands:</span>\n' +
          '  excuse          Get a random excuse\n' +
          '  excuse &lt;n&gt;      Get n random excuses (1-50)\n' +
          '  excuse #&lt;id&gt;    Get excuse by ID (1-453)\n' +
          '  status          API health check\n' +
          '  clear           Clear terminal\n' +
          '  help            Show this message'
        );
        break;

      case 'excuse':
        await handleExcuse(arg);
        break;

      case 'status':
        await handleStatus();
        break;

      case 'clear':
        output.innerHTML = '';
        break;

      default:
        appendError('Unknown command: ' + escapeHtml(cmd) + '. Type <span class="t-accent">help</span> for commands.');
    }
  }

  async function handleExcuse(arg) {
    try {
      let url;
      if (!arg) {
        url = API_BASE + '/v1/excuses/random';
      } else if (arg.startsWith('#')) {
        const id = parseInt(arg.slice(1), 10);
        if (isNaN(id) || id < 1) {
          appendError('Invalid ID. Use excuse #1 through #453.');
          return;
        }
        url = API_BASE + '/v1/excuses/id/' + id;
      } else {
        const n = parseInt(arg, 10);
        if (isNaN(n) || n < 1 || n > 50) {
          appendError('Count must be between 1 and 50.');
          return;
        }
        url = API_BASE + '/v1/excuses/random/' + n;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.error) {
        appendError(escapeHtml(json.error));
      } else {
        appendResult(formatJson(json));
      }
    } catch (err) {
      appendError('Request failed: ' + escapeHtml(err.message));
    }
  }

  async function handleStatus() {
    try {
      const res = await fetch(API_BASE + '/health');
      const json = await res.json();
      appendResult(formatJson(json));
    } catch (err) {
      appendError('Health check failed: ' + escapeHtml(err.message));
    }
  }

  // Expose for external use
  window.bofhTerminal = { processCommand: processCommand };
})();
