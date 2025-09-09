// Dashboard HTML
export function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Generative UI Dashboard</title>

  <!-- Inter + Tailwind -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] },
          colors: {
            brand: {
              50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',
              400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81'
            }
          }
        }
      }
    }
  </script>

  <!-- Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    /* ===== Ultra-flat, square, light-only ===== */
    .card        { background:#fff; border:1px solid #e5e7eb; border-radius:0; }
    .toolbar     { border:1px solid #e5e7eb; background:#fff; }
    .input       { background:#fff; border:1px solid #e5e7eb; border-radius:0; padding:.5rem .75rem; font-size:0.95rem; }
    .input:focus { outline:2px solid #c7d2fe; outline-offset:0; border-color:#c7d2fe; }
    .btn         { border:1px solid #e5e7eb; background:#fff; color:#111827; border-radius:0; padding:.5rem .75rem; font-weight:500; }
    .btn:hover   { background:#f8fafc; }
    .btn-primary { background:#4f46e5; color:#fff; border-color:#4f46e5; }
    .btn-primary:hover { background:#4338ca; border-color:#4338ca; }
    .badge       { font-size:11px; line-height:1; border:1px solid #e5e7eb; background:#fff; color:#475569; padding:.25rem .5rem; border-radius:0; }

    /* Progress (square) */
    @keyframes bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
    .bar { animation: bar 1.2s linear infinite; }

    /* No rounding, no shadows anywhere */
    :where([class*="rounded"]) { border-radius:0 !important; }
    :where([class*="shadow"])  { box-shadow:none !important; }

    /* Modal (flat) */
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.2); }
    .modal-panel    { background:#fff; border:1px solid #e5e7eb; width:100%; max-width:720px; }
  </style>

  <script>
    let ws;
    // =====================
    // TOASTS (flat)
    // =====================
    function toast(msg, type='info') {
      const wrap = document.getElementById('toastWrap');
      const el = document.createElement('div');
      el.className = 'card px-4 py-3 text-sm flex items-center gap-2';
      el.innerHTML = \`
        <span class="badge \${type==='success' ? 'text-green-600 border-green-200 bg-green-50' : type==='error' ? 'text-red-600 border-red-200 bg-red-50' : 'text-indigo-600 border-indigo-200 bg-indigo-50'}">
          <i data-lucide="\${type==='success' ? 'check' : type==='error' ? 'alert-triangle' : 'info'}" class="h-4 w-4"></i>
        </span>
        <span class="text-slate-800">\${msg}</span>\`;
      wrap.appendChild(el);
      lucide.createIcons();
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .2s ease';
        setTimeout(()=> wrap.removeChild(el), 220);
      }, 3000);
    }

    // =====================
    // AGENT STATE (with local fallback)
    // =====================
    const DEFAULT_STATE = {
      config: { models: {
        requirementAnalysis: "qwen/qwen3-235b-a22b-2507",
        webDSL: "qwen/qwen3-235b-a22b-2507",
        coding: "moonshotai/kimi-k2-0905",
        evaluation: "qwen/qwen3-235b-a22b-2507",
        validation: "qwen/qwen3-235b-thinking-2507",
      }}
    };
    const LOCAL_KEY = "ui:agentState";
    let USING_MOCK = false;
    let AGENT_STATE = null;
    let DIRTY = false;

    function openAgentModal() {
      document.getElementById('agentModalBackdrop').classList.remove('hidden');
      document.getElementById('agentModal').classList.remove('hidden');
      document.getElementById('model_requirementAnalysis').focus();
    }
    function closeAgentModal() {
      document.getElementById('agentModalBackdrop').classList.add('hidden');
      document.getElementById('agentModal').classList.add('hidden');
    }

    function markDirty(d=true){
      DIRTY = d;
      const badge = document.getElementById('dirtyBadge');
      if (badge) badge.style.visibility = DIRTY ? 'visible' : 'hidden';
    }
    function setSourceBadge() {
      const el = document.getElementById('agentStateSourceBadge');
      if (!el) return;
      el.textContent = USING_MOCK ? "Mocked (local)" : "Server";
      el.className = "badge";
    }
    function getFormValues() {
      return {
        config: { models: {
          requirementAnalysis: document.getElementById('model_requirementAnalysis').value.trim(),
          webDSL: document.getElementById('model_webDSL').value.trim(),
          coding: document.getElementById('model_coding').value.trim(),
          evaluation: document.getElementById('model_evaluation').value.trim(),
          validation: document.getElementById('model_validation').value.trim(),
        }}
      };
    }
    function putValuesIntoForm(state) {
      const m = state?.config?.models || {};
      document.getElementById('model_requirementAnalysis').value = m.requirementAnalysis ?? "";
      document.getElementById('model_webDSL').value = m.webDSL ?? "";
      document.getElementById('model_coding').value = m.coding ?? "";
      document.getElementById('model_evaluation').value = m.evaluation ?? "";
      document.getElementById('model_validation').value = m.validation ?? "";
      validateForm(); markDirty(false);
    }
    function validateForm() {
      const ids = ['model_requirementAnalysis','model_webDSL','model_coding','model_evaluation','model_validation'];
      let ok = true;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el.value.trim()) { el.style.borderColor = '#f43f5e'; ok = false; }
        else { el.style.borderColor = '#e5e7eb'; }
      }
      return ok;
    }
    async function loadAgentState(fromUser=false) {
      try {
        USING_MOCK = false;
        ws = new WebSocket('/api/ws');
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "cf_agent_state") {
                    AGENT_STATE = data.state;
                    ALL_GENERATIONS = Object.values(data.state.generations ?? {});
                    renderGenerations();
                    putValuesIntoForm(AGENT_STATE);
                    setSourceBadge();
                }
            } catch (error) {
                console.error('ws.onmessage failed:', error);
            }
        };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(AGENT_STATE));
        setSourceBadge(); putValuesIntoForm(AGENT_STATE);
        if (fromUser) toast('Loaded Agent state from server','success');
      } catch {
        USING_MOCK = true;
        const cached = localStorage.getItem(LOCAL_KEY);
        AGENT_STATE = cached ? JSON.parse(cached) : DEFAULT_STATE;
        ALL_GENERATIONS = Object.values(AGENT_STATE.generations ?? {});
        localStorage.setItem(LOCAL_KEY, JSON.stringify(AGENT_STATE));
        setSourceBadge(); putValuesIntoForm(AGENT_STATE);
        if (fromUser) toast('Server not ready. Using mocked local state.','error');
      }
    }
    async function saveAgentState() {
      const candidate = getFormValues();
      if (!validateForm()) { toast('Fill every model field.','error'); return; }
      AGENT_STATE = candidate;
      try {
        ws.send(JSON.stringify({ type: "cf_agent_state", state: candidate }));
        USING_MOCK = false; localStorage.setItem(LOCAL_KEY, JSON.stringify(candidate));
        setSourceBadge(); markDirty(false); toast('Agent state saved.','success');
      } catch {
        USING_MOCK = true; localStorage.setItem(LOCAL_KEY, JSON.stringify(candidate));
        setSourceBadge(); markDirty(false); toast('Server not ready. Saved locally.','error');
      }
    }
    async function resetAgentState() {
      AGENT_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
      putValuesIntoForm(AGENT_STATE);
      try {
        const res = await fetch('/api/state/reset', { method:'POST' });
        if (!res.ok) throw new Error('Non-200');
        USING_MOCK = false; localStorage.setItem(LOCAL_KEY, JSON.stringify(AGENT_STATE));
        setSourceBadge(); toast('Agent state reset on server.','success');
      } catch {
        USING_MOCK = true; localStorage.setItem(LOCAL_KEY, JSON.stringify(AGENT_STATE));
        setSourceBadge(); toast('Server not ready. Reset locally.','error');
      }
    }
    function attachStateListeners() {
      ['model_requirementAnalysis','model_webDSL','model_coding','model_evaluation','model_validation'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => { markDirty(true); validateForm(); });
        el.addEventListener('keydown', (e) => { if ((e.metaKey||e.ctrlKey) && e.key === 'Enter') saveAgentState(); });
      });
    }

    // =====================
    // GENERATIONS
    // =====================
    let ALL_GENERATIONS = [];
    let ACTIVE_FILTER = 'all';
    let SEARCH_QUERY = '';

    async function startGeneration() {
      const promptEl = document.getElementById('prompt');
      const prompt = promptEl.value.trim();
      if (!prompt) { toast('Type a prompt first.','error'); return; }
      try {
        const response = await fetch('/api/generate', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ prompt })
        });
        if (response.ok) {
          const result = await response.json();
          promptEl.value = '';
          toast('Generation started • ID: ' + result.id, 'success');
        //   setTimeout(refreshGenerations, 600);
        } else {
          toast('Failed to start generation','error');
        }
      } catch {
        toast('Network error starting generation','error');
      }
    }

    // async function refreshGenerations() {
    //   try {
    //     const response = await fetch('/api/generations');
    //     const generations = await response.json();
    //     ALL_GENERATIONS = generations;
    //     renderGenerations();
    //   } catch (error) {
    //     console.error('refreshGenerations failed:', error);
    //   }
    // }

    function setFilter(f) { ACTIVE_FILTER = f; renderGenerations(); }
    function setSearch(q) { SEARCH_QUERY = (q||'').toLowerCase(); renderGenerations(); }

    function renderGenerations() {
      const container = document.getElementById('generations');
      const empty = document.getElementById('generationsEmpty');
      let list = [...ALL_GENERATIONS];

      if (ACTIVE_FILTER !== 'all') list = list.filter(g => g.status === ACTIVE_FILTER);
      if (SEARCH_QUERY) list = list.filter(g => (g.title||'').toLowerCase().includes(SEARCH_QUERY) || (g.id||'').toLowerCase().includes(SEARCH_QUERY));

      if (!list.length) { container.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');

      container.innerHTML = list.map(gen => generationCard(gen)).join('');
      lucide.createIcons();
    }

    function generationCard(gen) {
      // DISPLAY RULES:
      // - If failed: show error message, but status text must be "Working..." and keep progress bar.
      const displayStatus = (gen.status === 'failed') ? 'Working...' : gen.status;
      const progress = (gen.status === 'generating' || gen.status === 'pending' || gen.status === 'failed');

      return \`
        <div class="card p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div class="h-10 w-10 border border-slate-200 bg-white flex items-center justify-center">
                <i data-lucide="sparkles" class="h-5 w-5 text-brand-600"></i>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-slate-900">\${escapeHtml((gen.title.substring(0, 100) + (gen.title.length > 100 ? "..." : "")) || '(no title)')}</h3>
                  <span class="badge">\${displayStatus}</span>
                </div>
                <div class="text-xs text-slate-500 mt-1">
                  <span>Created: \${formatDate(gen.createdAt)}</span>
                  \${gen.completedAt ? \` • <span>Completed: \${formatDate(gen.completedAt)}</span>\` : ''}
                </div>
                \${gen.error ? \`<div class="text-xs text-red-600 mt-2">Error: \${escapeHtml(gen.error)}</div>\` : ''}
              </div>
            </div>
            <div class="flex items-center gap-8">
              <div class="text-xs text-slate-500">
                <div><span class="text-slate-400">ID:</span> \${gen.id}</div>
              </div>
              <div class="flex items-center gap-2">
                \${gen.status === 'completed'
                  ? \`<a href="/api/view/\${gen.id}" target="_blank" class="btn btn-primary text-xs">View</a>\`
                  : \`<button disabled class="btn text-slate-500 text-xs cursor-not-allowed">Working...</button>\`
                }
              </div>
            </div>
          </div>
          \${progress ? \`
            <div class="mt-3 h-1.5 w-full overflow-hidden bg-slate-200">
              <div class="h-full bg-brand-500 bar origin-left"></div>
            </div>\` : ''}
        </div>\`;
    }

    // helpers
    function formatDate(s){ try { return new Date(s).toLocaleString(); } catch { return s; } }
    function escapeHtml(text){ const div=document.createElement('div'); div.textContent=text ?? ''; return div.innerHTML; }

    // init
    // setInterval(refreshGenerations, 10000);
    window.addEventListener('load', async () => {
      // skeletons
      const genWrap = document.getElementById('generations');
      genWrap.innerHTML = \`
        <div class="space-y-3">
          <div class="card p-4 animate-pulse h-24"></div>
          <div class="card p-4 animate-pulse h-24"></div>
          <div class="card p-4 animate-pulse h-24"></div>
        </div>\`;
      await loadAgentState(false);
      attachStateListeners();
    //   await refreshGenerations();
      lucide.createIcons();

      // Modal close handlers
      document.getElementById('agentModalBackdrop').addEventListener('click', closeAgentModal);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAgentModal(); });
    });
  </script>
</head>

<body class="h-full bg-slate-50 text-slate-900">
  <!-- TOASTS -->
  <div id="toastWrap" class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"></div>

  <div class="min-h-screen">
    <!-- Top Bar -->
    <header class="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 border border-slate-200 bg-white flex items-center justify-center">
            <i data-lucide="bot" class="h-4 w-4 text-brand-600"></i>
          </div>
          <div class="font-semibold">Generative UI</div>
          <span class="badge ml-1">Dashboard</span>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden md:flex items-center gap-2 toolbar px-3 py-2">
            <i data-lucide="search" class="h-4 w-4 text-slate-500"></i>
            <input id="searchInput" oninput="setSearch(this.value)" placeholder="Search runs…" class="bg-transparent outline-none text-sm w-56 placeholder:text-slate-400">
          </div>
          <button class="btn" onclick="openAgentModal()">
            <i data-lucide="settings-2" class="h-4 w-4 mr-1"></i> Agent State
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <!-- Quick Start -->
      <section class="grid md:grid-cols-3 gap-4">
        <!-- Start Generation -->
        <div class="md:col-span-3 card p-5">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-base font-semibold">Start a new generation</h2>
            <span class="text-xs text-slate-500">⌘ / Ctrl + Enter to run</span>
          </div>
          <div class="space-y-2.5">
            <textarea id="prompt" rows="3" placeholder="Describe the UI you want…" class="input w-full"></textarea>
            <div class="flex flex-wrap gap-2">
              <button onclick="startGeneration()" class="btn btn-primary">Generate</button>
              <button onclick="document.getElementById('prompt').value='Marketing landing page with hero, features, CTA, and pricing';" class="btn">Landing</button>
              <button onclick="document.getElementById('prompt').value='Dashboard with KPIs, line chart, table, filter panel';" class="btn">Dashboard</button>
              <button onclick="document.getElementById('prompt').value='Auth screens (Sign in / Sign up / Reset password) with modern styling';" class="btn">Auth</button>
            </div>
          </div>
          <script>
            document.getElementById('prompt').addEventListener('keydown', (e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') startGeneration();
            });
          </script>
        </div>
      </section>

      <!-- Runs -->
      <section class="card p-5">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-semibold">Recent Runs</h2>
            <div class="flex overflow-hidden border border-slate-200">
              <button onclick="setFilter('all')" class="px-3 py-1.5 text-xs hover:bg-slate-50">All</button>
              <button onclick="setFilter('pending')" class="px-3 py-1.5 text-xs hover:bg-slate-50">Pending</button>
              <button onclick="setFilter('generating')" class="px-3 py-1.5 text-xs hover:bg-slate-50">Generating</button>
              <button onclick="setFilter('completed')" class="px-3 py-1.5 text-xs hover:bg-slate-50">Completed</button>
              <button onclick="setFilter('failed')" class="px-3 py-1.5 text-xs hover:bg-slate-50">Failed</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="hidden md:flex items-center gap-2">
              <div class="input flex items-center gap-2">
                <i data-lucide="search" class="h-4 w-4 text-slate-500"></i>
                <input oninput="setSearch(this.value)" placeholder="Search runs…" class="bg-transparent outline-none text-sm w-56 placeholder:text-slate-400">
              </div>
            </div>
          </div>
        </div>

        <div id="generationsEmpty" class="hidden text-center text-slate-500 py-8">
          <div class="mx-auto h-12 w-12 border border-slate-200 bg-white flex items-center justify-center mb-3">
            <i data-lucide="inbox" class="h-5 w-5"></i>
          </div>
          No runs yet. Kick one off above.
        </div>

        <div id="generations" class="space-y-3"></div>
      </section>
    </main>
  </div>

  <!-- Agent State Modal -->
  <div id="agentModalBackdrop" class="modal-backdrop hidden z-50"></div>
  <div id="agentModal" class="fixed inset-0 hidden z-50" role="dialog" aria-modal="true" aria-labelledby="agentModalTitle">
    <div class="w-full h-full flex items-start justify-center p-6">
      <div class="modal-panel">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 id="agentModalTitle" class="text-base font-semibold">Agent State</h2>
          <div class="flex items-center gap-2">
            <span id="agentStateSourceBadge" class="badge">…</span>
            <button class="btn" onclick="closeAgentModal()">
              <i data-lucide="x" class="h-4 w-4"></i> Close
            </button>
          </div>
        </div>

        <div class="p-4 space-y-2.5">
          <p class="text-xs text-slate-600">Edit model IDs used by the Agent. <span class="text-slate-500">⌘ / Ctrl + Enter saves.</span></p>

          <label class="block">
            <span class="text-xs text-slate-600">Requirement Analysis</span>
            <input id="model_requirementAnalysis" class="input w-full mt-1" placeholder="qwen/qwen3-235b-a22b-2507">
          </label>
          <label class="block">
            <span class="text-xs text-slate-600">Web DSL</span>
            <input id="model_webDSL" class="input w-full mt-1" placeholder="qwen/qwen3-235b-a22b-2507">
          </label>
          <label class="block">
            <span class="text-xs text-slate-600">Coding</span>
            <input id="model_coding" class="input w-full mt-1" placeholder="moonshotai/kimi-k2-0905">
          </label>
          <label class="block">
            <span class="text-xs text-slate-600">Evaluation</span>
            <input id="model_evaluation" class="input w-full mt-1" placeholder="qwen/qwen3-235b-a22b-2507">
          </label>
          <label class="block">
            <span class="text-xs text-slate-600">Validation</span>
            <input id="model_validation" class="input w-full mt-1" placeholder="qwen/qwen3-235b-thinking-2507">
          </label>

          <div class="flex items-center gap-2 pt-1">
            <button onclick="saveAgentState()" class="btn btn-primary">Save</button>
            <button onclick="loadAgentState(true)" class="btn">Load</button>
            <button onclick="resetAgentState()" class="btn text-red-600 border-red-200">Reset</button>
            <span id="dirtyBadge" title="Unsaved changes" class="ml-auto inline-block h-2.5 w-2.5 bg-amber-500" style="visibility:hidden"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>lucide.createIcons();</script>
</body>
</html>`;
}
