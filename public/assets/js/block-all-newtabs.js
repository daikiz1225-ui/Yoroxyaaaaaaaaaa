(function () {
  'use strict';

  try {
    Object.defineProperty(window, 'open', {
      value: function () {
        return null;
      },
      writable: false,
      configurable: false
    });
  } catch {}

  const sanitizeTarget = (el) => {
    if (!el || !el.setAttribute) return;
    if (el.getAttribute('target') === '_blank') {
      el.setAttribute('target', '_self');
    }
  };

  const _setAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (name && name.toLowerCase() === 'target' && value === '_blank') {
      value = '_self';
    }
    return _setAttribute.call(this, name, value);
  };

  ['HTMLAnchorElement', 'HTMLFormElement'].forEach((cls) => {
    const proto = window[cls]?.prototype;
    if (!proto) return;
    Object.defineProperty(proto, 'target', {
      get() {
        return this.getAttribute('target') || '';
      },
      set(v) {
        this.setAttribute('target', v === '_blank' ? '_self' : v);
      }
    });
  });

  const blockClick = (e) => {
    const a = e.target.closest?.('a,form');
    if (!a) return;

    sanitizeTarget(a);

    if (
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.button === 1
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  document.addEventListener('click', blockClick, true);
  document.addEventListener('auxclick', blockClick, true);
  document.addEventListener('mousedown', blockClick, true);

  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes') {
        sanitizeTarget(m.target);
      }
      if (m.addedNodes) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            sanitizeTarget(n);
            n.querySelectorAll?.('a,form').forEach(sanitizeTarget);
          }
        });
      }
    }
  });

  mo.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['target']
  });

})();
