// Lightweight browser shim for window.api used in Electron builds
// Provides: openFileDialog(), fetchAudio(path), resolvePath(base, rel)
// Uses file inputs (with webkitdirectory fallback) to let users pick a manifest and audio files

(function () {
  if (window.api) return; // don't override Electron preload

  const fileMap = new Map();
  let manifestDir = '';

  function dirname(p) {
    if (!p) return '';
    const i = p.lastIndexOf('/');
    return i === -1 ? '' : p.slice(0, i);
  }

  function normalizePath(p) {
    if (!p) return '';
    const parts = p.split('/');
    const stack = [];
    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        if (stack.length) stack.pop();
      } else stack.push(part);
    }
    return stack.join('/');
  }

  function commonDir(paths) {
    if (!paths || paths.length === 0) return '';
    const splitPaths = paths.map(p => p.split('/'));
    const first = splitPaths[0];
    let idx = 0;
    while (true) {
      const seg = first[idx];
      if (seg === undefined) break;
      for (let i = 1; i < splitPaths.length; i++) {
        if (splitPaths[i][idx] !== seg) return first.slice(0, idx).join('/');
      }
      idx++;
    }
    return first.slice(0, idx).join('/');
  }

  function pickFiles({ accept = '', multiple = false, directory = false } = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) input.accept = accept;
      if (multiple) input.multiple = true;
      if (directory) input.webkitdirectory = true; // chromium-only but useful
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const files = input.files ? Array.from(input.files) : [];
        document.body.removeChild(input);
        resolve(files);
      });
      input.click();
    });
  }

  async function openFileDialog() {
    const manifestFiles = await pickFiles({ accept: '.json,.jsong', multiple: false, directory: false });
    if (!manifestFiles || manifestFiles.length === 0) return null;
    const manifestFile = manifestFiles[0];
    const text = await manifestFile.text();
    let content;
    try {
      content = JSON.parse(text);
    } catch (err) {
      throw new Error('Failed to parse manifest: ' + err.message);
    }

    // Determine whether manifest references external (non-data) audio resources.
    function _containsExternalResources(obj) {
      const audioExt = /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm|mp4)(\?.*)?$/i;
      let foundExternal = false;
      (function walk(v) {
        if (foundExternal) return;
        if (Array.isArray(v)) {
          for (const item of v) walk(item);
        } else if (v && typeof v === 'object') {
          for (const k in v) walk(v[k]);
        } else if (typeof v === 'string') {
          const s = v.trim();
          // embedded data URIs are not external
          if (s.startsWith('data:')) return;
          // URLs, file: URIs, strings that look like paths or have common audio extensions
          if (/^https?:\/\//i.test(s) || /^file:\/\//i.test(s) || audioExt.test(s) || s.includes('/')) {
            foundExternal = true;
          }
        }
      })(obj);
      return foundExternal;
    }

    const needsExternal = _containsExternalResources(content);
    let audioFiles = [];
    if (needsExternal) {
      // Show a custom modal that supports both Chromium (folder pick) and non-Chromium (Firefox) multi-file selection
      async function showResourceModal() {
        return new Promise((resolve) => {
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:2147483647;padding:20px;';

          const box = document.createElement('div');
          box.style.cssText = 'background:#fff;color:#000;border-radius:8px;max-width:640px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,0.3);padding:18px;font-family:system-ui, sans-serif;';

          const title = document.createElement('h3');
          title.textContent = 'External audio resources detected';
          title.style.margin = '0 0 8px 0';

          const desc = document.createElement('p');
          desc.style.margin = '0 0 12px 0';
          desc.textContent = 'This manifest references external audio files. Choose whether to upload local files/folders for playback, or allow the player to fetch remote URLs when needed.';

          const hint = document.createElement('p');
          hint.style.margin = '0 0 14px 0; color:#444; font-size:0.9em';
          hint.textContent = 'On Chromium you can select a folder (recommended). In Firefox select multiple files (hold Shift/Ctrl while choosing files).';

          const btnRow = document.createElement('div');
          btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:8px;';

          const uploadBtn = document.createElement('button');
          uploadBtn.textContent = 'Upload files/folder';
          uploadBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#0b66ff;color:#fff;cursor:pointer';

          const fetchBtn = document.createElement('button');
          fetchBtn.textContent = 'Fetch remote URLs';
          fetchBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#000;cursor:pointer';

          const embeddedBtn = document.createElement('button');
          embeddedBtn.textContent = 'Treat as embedded';
          embeddedBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#000;cursor:pointer;margin-right:auto';

          const note = document.createElement('div');
          note.style.cssText = 'color:#b00;margin-top:8px;font-size:0.9em;display:none';
          note.textContent = 'No files selected. Please choose files/folder or pick another option.';

          btnRow.appendChild(embeddedBtn);
          btnRow.appendChild(note);
          btnRow.appendChild(fetchBtn);
          btnRow.appendChild(uploadBtn);

          box.appendChild(title);
          box.appendChild(desc);
          box.appendChild(hint);
          box.appendChild(btnRow);
          overlay.appendChild(box);
          document.body.appendChild(overlay);

          function cleanup() {
            try { document.body.removeChild(overlay); } catch (e) {}
            window.removeEventListener('keydown', onKey);
          }

          function onKey(e) {
            if (e.key === 'Escape') {
              cleanup();
              resolve({ action: 'fetch' });
            }
          }

          window.addEventListener('keydown', onKey);

          embeddedBtn.addEventListener('click', () => {
            cleanup();
            resolve({ action: 'embedded' });
          });

          fetchBtn.addEventListener('click', () => {
            cleanup();
            resolve({ action: 'fetch' });
          });

          uploadBtn.addEventListener('click', async () => {
            // Attempt folder picker first (webkitdirectory). If no files selected, fall back to multi-file selection.
            const files1 = await pickFiles({ multiple: true, directory: true });
            let files = files1 || [];
            if (!files.length) {
              const files2 = await pickFiles({ multiple: true, directory: false });
              files = files2 || [];
            }
            if (files && files.length) {
              cleanup();
              resolve({ action: 'upload', files });
            } else {
              // show message and stay in modal
              note.style.display = 'block';
            }
          });
        });
      }

      const choice = await showResourceModal();
      if (choice && choice.action === 'upload') {
        audioFiles = choice.files;
      } else {
        audioFiles = [];
      }
    } else {
      // all-in-one manifest (embedded resources) — no need to ask for audio files
      audioFiles = [];
    }

    // Determine manifest directory if possible
    manifestDir = '';
    if (manifestFile.webkitRelativePath && manifestFile.webkitRelativePath.includes('/')) {
      manifestDir = dirname(manifestFile.webkitRelativePath);
    } else {
      // try to find manifest inside the selected files
      const found = (audioFiles || []).find(f => f.webkitRelativePath && f.webkitRelativePath.endsWith('/' + manifestFile.name));
      if (found) manifestDir = dirname(found.webkitRelativePath);
      else {
        const dirs = (audioFiles || []).map(f => f.webkitRelativePath ? dirname(f.webkitRelativePath) : '').filter(Boolean);
        const common = commonDir(dirs);
        if (common) manifestDir = common;
      }
    }

    fileMap.clear();
    for (const f of audioFiles || []) {
      const full = f.webkitRelativePath && f.webkitRelativePath.length ? f.webkitRelativePath : f.name;
      // compute path relative to manifestDir if possible
      let rel;
      if (manifestDir && full.startsWith(manifestDir + '/')) {
        rel = full.slice(manifestDir.length + 1);
      } else {
        rel = full;
      }
      rel = normalizePath(rel);
      // store by normalized relative path
      fileMap.set(rel, f);
      // also store variant with './' prefix
      fileMap.set('./' + rel, f);
      // and by basename for leniency
      const parts = rel.split('/');
      fileMap.set(parts[parts.length - 1], f);
      // also store the original full path
      fileMap.set(normalizePath(full), f);
    }

    // For compatibility with existing code, return filePath and folder (folder is manifestDir relative path)
    return { filePath: manifestFile.name, folder: manifestDir || '', content };
  }

  function resolvePath(base, relative) {
    // Base is expected to be the manifest folder (as returned above)
    const b = base || manifestDir || '';
    if (!relative) return '';
    // Strip file:// if present
    const rel = relative.replace(/^file:\/\//, '');
    const combined = b ? (b + '/' + rel) : rel;
    return normalizePath(combined);
  }

  async function fetchAudio(path) {
    if (!path) throw new Error('Audio file not found for path: ' + path);
    const orig = path;

    // Support data: URIs (embedded base64)
    if (/^data:/i.test(orig)) {
      const comma = orig.indexOf(',');
      if (comma === -1) throw new Error('Invalid data URI: ' + orig);
      const header = orig.slice(0, comma);
      const data = orig.slice(comma + 1);
      if (/;base64/i.test(header)) {
        const binary = atob(data);
        const len = binary.length;
        const ab = new ArrayBuffer(len);
        const view = new Uint8Array(ab);
        for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
        return ab;
      } else {
        const str = decodeURIComponent(data);
        return new TextEncoder().encode(str).buffer;
      }
    }

    // Support network URLs
    if (/^https?:\/\//i.test(orig)) {
      const res = await fetch(orig);
      if (!res.ok) throw new Error('Network fetch failed: ' + res.statusText);
      return await res.arrayBuffer();
    }

    // strip file:// if present and normalize
    let cleaned = orig.replace(/^file:\/\//, '');
    const p = normalizePath(cleaned || '');
    const candidates = [];
    candidates.push(p);
    if (!p.startsWith('./')) candidates.push('./' + p);
    // try basename
    const parts = p.split('/');
    if (parts.length) candidates.push(parts[parts.length - 1]);
    // also try entries that endWith
    for (const c of candidates) {
      const f = fileMap.get(c);
      if (f) return await f.arrayBuffer();
    }

    for (const [k, f] of fileMap.entries()) {
      if (k.endsWith(p) || k.endsWith('/' + p)) return await f.arrayBuffer();
    }

    throw new Error('Audio file not found for path: ' + path);
  }

  window.api = { openFileDialog, fetchAudio, resolvePath };
})();
