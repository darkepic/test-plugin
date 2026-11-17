export function activate(lyte) {
  const mounted = new Map();
  let opens = Number(lyte.storage.get('opens', 0)) || 0;
  let clicks = Number(lyte.storage.get('clicks', 0)) || 0;

  const extraStyle = lyte.styles.add(
    '.lyte-test-plugin-pill { transition: transform 0.14s ease, border-color 0.14s ease; } .lyte-test-plugin-pill:active { transform: scale(0.96); }',
    'desktop'
  );

  const labelText = (winKind) => `Test Plugin · ${winKind} · ${opens} opens · ${clicks} clicks`;

  const syncAll = () => {
    const visible = lyte.options.get('show-badge') !== false;
    for (const entry of mounted.values()) {
      entry.node.hidden = !visible;
      entry.node.textContent = labelText(entry.winKind);
      entry.node.setAttribute('data-window-kind', entry.winKind);
    }
  };

  const attachPopup = (popup) => {
    const doc = popup?.document;
    const body = doc?.body;
    if (!doc || !body || mounted.has(doc)) return () => {};
    opens += 1;
    lyte.storage.set('opens', opens);

    const handle = lyte.dom.mount(body, (ownerDoc) => {
      const btn = ownerDoc.createElement('button');
      btn.type = 'button';
      btn.className = 'lyte-test-plugin-pill';
      return btn;
    });
    if (!handle?.node) return () => {};

    const entry = { node: handle.node, winKind: popup.window || 'desktop' };
    mounted.set(doc, entry);

    const unlisten = lyte.dom.on(handle.node, 'click', () => {
      clicks += 1;
      lyte.storage.set('clicks', clicks);
      syncAll();
      if (lyte.options.get('notify-on-start')) {
        lyte.notify('Test Plugin', `Clicks: ${clicks} (${entry.winKind})`);
      }
    });

    syncAll();

    return () => {
      mounted.delete(doc);
      unlisten();
      handle.remove();
    };
  };

  const offPopup = lyte.popups.onOpen(attachPopup);
  const offOption = lyte.options.onChange(() => {
    syncAll();
  });

  if (lyte.options.get('notify-on-start')) {
    lyte.notify('Test Plugin active', `Attached to ${lyte.popups.list().length} desktop window(s).`);
  }

  return () => {
    offOption();
    offPopup();
    mounted.clear();
    extraStyle.remove();
  };
}

export function deactivate() {}
