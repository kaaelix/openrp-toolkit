// ==UserScript==
// @name         OpenRP CLI & MCP Auto-Auth Bridge
// @namespace    https://openrp.ai/
// @version      1.2.0
// @description  Automatically detects OpenRP session and syncs to local CLI & MCP server
// @author       Kaa
// @match        https://openrp.ai/*
// @match        https://*.openrp.ai/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(async function () {
  'use strict';

  const CLI_PORT = 45678;

  function extractToken() {
    let token = '';
    let refreshToken = '';
    let user = null;

    // 1. Chunked cookies
    const chunks = {};
    for (let c of document.cookie.split(';')) {
      c = c.trim();
      const m = c.match(/^sb-[^=]+-auth-token(?:\.(\d+))?=(.*)$/);
      if (m) {
        const idx = m[1] ? parseInt(m[1]) : 0;
        chunks[idx] = decodeURIComponent(m[2]);
      }
    }

    const keys = Object.keys(chunks).sort((a, b) => a - b);
    if (keys.length) {
      let combined = keys.map(k => chunks[k]).join('');
      if (combined.startsWith('base64-')) combined = combined.slice(7);
      try {
        const obj = JSON.parse(atob(combined));
        token = obj.access_token || '';
        refreshToken = obj.refresh_token || '';
        user = obj.user || null;
      } catch (e) {
        try {
          const obj = JSON.parse(combined);
          token = obj.access_token || '';
          refreshToken = obj.refresh_token || '';
          user = obj.user || null;
        } catch (e2) {}
      }
    }

    // 2. LocalStorage fallback
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('auth-token') || k.includes('supabase.auth'))) {
          try {
            let v = localStorage.getItem(k);
            if (v.startsWith('base64-')) v = atob(v.slice(7));
            const obj = JSON.parse(v);
            token = obj.access_token || (Array.isArray(obj) ? obj[0] : (obj.token || ''));
            refreshToken = obj.refresh_token || (Array.isArray(obj) ? obj[1] : '');
            user = obj.user || null;
            if (token) break;
          } catch (e) {}
        }
      }
    }

    return { token, refreshToken, user };
  }

  async function showAuthModal(token, refreshToken, user) {
    if (document.getElementById('openrp-auth-modal')) return;

    if (!user && token) {
      try {
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const json = await res.json();
        if (res.ok && json.data) user = json.data;
      } catch (e) {}
    }

    const name = (user && (user.user_metadata?.full_name || user.name || user.displayName || user.handle)) || 'Creator';
    const handle = (user && (user.handle ? ('@' + user.handle) : (user.user_metadata?.email || user.email || ''))) || '';
    const avatar = (user && (user.user_metadata?.avatar_url || user.avatar || user.avatarUrl || user.user_metadata?.picture)) || '';

    const overlay = document.createElement('div');
    overlay.id = 'openrp-auth-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999999;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#fafafa;';

    const card = document.createElement('div');
    card.style.cssText = 'background:#09090b;border:1px solid #27272a;border-radius:16px;padding:32px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.9);box-sizing:border-box;';

    const badge = '<div style="display:inline-block;padding:4px 12px;background:#18181b;border:1px solid #27272a;border-radius:9999px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:20px;">OpenRP CLI Auth</div>';
    const avatarHtml = `<div style="width:76px;height:76px;margin:0 auto 16px;position:relative;">${avatar ? `<img src="${avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #fafafa;">` : `<div style="width:100%;height:100%;border-radius:50%;background:#18181b;border:2px solid #fafafa;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fafafa;">${(name[0] || 'O').toUpperCase()}</div>`}</div>`;
    const titleHtml = `<div style="font-size:18px;font-weight:700;color:#fafafa;margin-bottom:2px;">${name}</div>${handle ? `<div style="font-size:13px;color:#a1a1aa;font-family:monospace;margin-bottom:16px;">${handle}</div>` : '<div style="margin-bottom:16px;"></div>'}`;
    const questionHtml = '<div style="font-size:15px;font-weight:600;color:#fafafa;margin-bottom:6px;">Is this you?</div><div style="font-size:13px;color:#71717a;line-height:1.5;margin-bottom:24px;">Authorize the OpenRP CLI & MCP Suite on this device.</div>';
    const btnsHtml = '<div style="display:flex;flex-direction:column;gap:10px;"><button id="openrp-confirm-btn" style="background:#fafafa;color:#18181b;font-weight:600;font-size:13px;padding:11px 18px;border-radius:8px;border:none;cursor:pointer;width:100%;">Yes, Authorize</button><button id="openrp-cancel-btn" style="background:#18181b;color:#a1a1aa;font-weight:500;font-size:13px;padding:10px 18px;border-radius:8px;border:1px solid #27272a;cursor:pointer;width:100%;">Cancel</button></div>';

    card.innerHTML = badge + avatarHtml + titleHtml + questionHtml + btnsHtml;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('openrp-cancel-btn').onclick = () => overlay.remove();
    document.getElementById('openrp-confirm-btn').onclick = async () => {
      const btn = document.getElementById('openrp-confirm-btn');
      btn.disabled = true;
      btn.textContent = 'Connecting...';

      try {
        await fetch(`http://127.0.0.1:${CLI_PORT}/_openrp_cli_auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, refreshToken, user })
        });
        card.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:#fafafa;color:#18181b;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">OK</div><div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#fafafa;">Authorized</div><div style="font-size:13px;color:#a1a1aa;margin-bottom:20px;">Credentials saved to CLI. You can close this window.</div><button onclick="document.getElementById(\'openrp-auth-modal\').remove()" style="background:#fafafa;color:#18181b;font-weight:600;font-size:13px;padding:9px 18px;border-radius:8px;border:none;cursor:pointer;">Close</button>';
      } catch (e) {
        window.location.href = `http://127.0.0.1:${CLI_PORT}/?token=` + encodeURIComponent(token) + '&refreshToken=' + encodeURIComponent(refreshToken);
      }
    };
  }

  // Auto trigger
  const { token, refreshToken, user } = extractToken();
  if (token) {
    showAuthModal(token, refreshToken, user);
  }
})();
