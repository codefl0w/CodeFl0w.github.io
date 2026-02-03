document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        username: '',
        theme: 'dark',
        selectMethod: 'top_stars',
        limit: 20,
        manualRepos: '',
        artifacts: [createDefaultArtifact()] // Artifacts no longer store 'id' directly from user input
    };

    // --- DOM Elements ---
    const ui = {
        username: document.getElementById('username'),
        themeRadios: document.getElementsByName('theme'),
        selectMethodRadios: document.getElementsByName('select_method'),
        limit: document.getElementById('limit'),
        manualRepos: document.getElementById('manual-repos'),
        limitGroup: document.getElementById('limit-group'),
        manualReposGroup: document.getElementById('manual-repos-group'),
        artifactsList: document.getElementById('artifacts-list'),
        addArtifactBtn: document.getElementById('add-artifact-btn'),
        jsonPreview: document.getElementById('json-preview'),
        svgPreview: document.getElementById('svg-visual-preview'),
        copyBtn: document.getElementById('copy-json-btn'),
        downloadBtn: document.getElementById('download-btn'),
        filepathHint: document.getElementById('filepath-hint'),
        directLinkInput: document.getElementById('direct-link-input'),
        copyLinkBtn: document.getElementById('copy-link-btn'),
        addRotationBtn: document.getElementById('add-rotation-btn')
    };

    // --- Configuration ---
    // TODO: Replace with your actual Vercel App URL
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000' 
        : 'https://gh-boards.vercel.app'; 

    // --- Constants ---
    const VALID_TYPES = [
        { value: 'board', label: 'Board (Stars + Downloads)' },
        // { value: 'heading', label: 'Heading / Banner (Coming Soon)' }, 
        // { value: 'badge', label: 'Badge (Coming Soon)' }
    ];

    // --- Initialization ---
    init();

    function init() {
        bindEvents();
        renderArtifacts();
        updatePreview();
    }

    function createDefaultArtifact() {
        return {
            type: 'board',
            options: {
                max_repos: 10,
                show_stars: true
            }
        };
    }

    // --- Event Binding ---
    function bindEvents() {
        // Use 'input' for real-time updates
        if (ui.username) {
            ui.username.addEventListener('input', (e) => {
                state.username = e.target.value;
                updatePreview();
            });
        }

        ui.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.theme = e.target.value;
                updatePreview();
            });
        });

        ui.selectMethodRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.selectMethod = e.target.value;
                toggleRepoInputs();
                updatePreview();
            });
        });

        if (ui.limit) {
            ui.limit.addEventListener('input', (e) => {
                state.limit = parseInt(e.target.value) || 20;
                updatePreview();
            });
        }

        if (ui.manualRepos) {
            ui.manualRepos.addEventListener('input', (e) => {
                state.manualRepos = e.target.value;
                updatePreview();
            });
        }

        if (ui.addArtifactBtn) {
            ui.addArtifactBtn.addEventListener('click', () => {
                state.artifacts.push(createDefaultArtifact());
                renderArtifacts();
                updatePreview();
            });
        }

        if (ui.copyBtn) ui.copyBtn.addEventListener('click', copyToClipboard);
        if (ui.downloadBtn) ui.downloadBtn.addEventListener('click', downloadJson);
        
        if (ui.copyLinkBtn) {
            ui.copyLinkBtn.addEventListener('click', () => {
                const text = ui.directLinkInput.value;
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = ui.copyLinkBtn.textContent;
                    ui.copyLinkBtn.textContent = 'Copied!';
                    setTimeout(() => ui.copyLinkBtn.textContent = 'Copy', 2000);
                });
            });
        }

        if (ui.addRotationBtn) {
            ui.addRotationBtn.addEventListener('click', openGitHubIssue);
        }
    }

    function toggleRepoInputs() {
        if (state.selectMethod === 'manual') {
            ui.limitGroup.classList.add('hidden');
            ui.manualReposGroup.classList.remove('hidden');
        } else {
            ui.limitGroup.classList.remove('hidden');
            ui.manualReposGroup.classList.add('hidden');
        }
    }

    // --- Rendering UI ---
    function renderArtifacts() {
        ui.artifactsList.innerHTML = '';
        state.artifacts.forEach((art, index) => {
            const el = document.createElement('div');
            el.className = 'artifact-item';

            const typeOptions = VALID_TYPES.map(t =>
                `<option value="${t.value}" ${art.type === t.value ? 'selected' : ''}>${t.label}</option>`
            ).join('');

            el.innerHTML = `
                <div class="form-group">
                    <label>Type</label>
                    <select class="art-type" data-idx="${index}" style="width:100%; padding:0.75rem; border-radius:8px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:var(--text-main);">
                        ${typeOptions}
                    </select>
                </div>

                <div class="grid-layout" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Max Repos</label>
                        <input type="number" class="art-max" value="${art.options.max_repos}" data-idx="${index}">
                    </div>
                    <div class="form-group" style="display: flex; align-items: center; padding-top: 1.5rem;">
                        <input type="checkbox" id="art-stars-${index}" class="art-stars" ${art.options.show_stars ? 'checked' : ''} data-idx="${index}" style="width: auto; margin-right: 0.5rem;">
                        <label for="art-stars-${index}" style="margin-bottom: 0;">Show Stars</label>
                    </div>
                </div>
                ${state.artifacts.length > 1 ? `<button class="remove-artifact" data-idx="${index}">×</button>` : ''}
            `;
            ui.artifactsList.appendChild(el);
        });

        bindArtifactInputs();
    }

    function bindArtifactInputs() {
        document.querySelectorAll('.art-type').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].type = e.target.value;
                updatePreview();
            });
        });

        document.querySelectorAll('.art-max').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.max_repos = parseInt(e.target.value) || 10;
                updatePreview();
            });
        });

        document.querySelectorAll('.art-stars').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.show_stars = e.target.checked;
                updatePreview();
            });
        });

        document.querySelectorAll('.remove-artifact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                state.artifacts.splice(idx, 1);
                renderArtifacts();
                updatePreview();
            });
        });
    }

    // --- Output Generator ---
    function generateManifest() {
        // Auto-generate IDs
        const uniqueIds = {};
        const safeArtifacts = state.artifacts.map(art => {
            // Base ID on type
            let baseId = art.type;
            if (!uniqueIds[baseId]) uniqueIds[baseId] = 0;
            uniqueIds[baseId]++;

            let finalId = baseId;
            if (uniqueIds[baseId] > 1) {
                finalId = `${baseId}-${uniqueIds[baseId]}`;
            }

            return {
                id: finalId,
                type: art.type,
                options: { ...art.options }
            };
        });

        const manifest = {
            user: state.username || "YOUR_USERNAME",
            defaults: {
                theme: state.theme,
                output_dir: "out"
            },
            select: {
                method: state.selectMethod,
                limit: state.limit
            },
            artifacts: safeArtifacts
        };

        if (state.selectMethod === 'manual') {
            const repoList = state.manualRepos.split(',').map(s => s.trim()).filter(s => s);
            manifest.select.method = 'explicit';
            delete manifest.select.limit;
            manifest.targets = {
                repos: repoList
            };
        }

        return manifest;
    }

    function updatePreview() {
        try {
            const manifest = generateManifest();
            const jsonStr = JSON.stringify(manifest, null, 2);
            ui.jsonPreview.textContent = jsonStr;

            // Update helper text
            let safeUser = (state.username || 'YOUR_NAME').trim();
            if (!safeUser) safeUser = 'YOUR_NAME';
            safeUser = safeUser.replace(/[^a-z0-9-_]/gi, '');
            if (!safeUser) safeUser = 'YOUR_NAME';

            if (ui.filepathHint) {
                ui.filepathHint.textContent = `users/${safeUser}.json`;
            }

            // Render Live Preview
            renderLivePreview(manifest);
        } catch (e) {
            console.error("Preview update error:", e);
        }
    }

    // --- Live SVG Render Logic (Using Vercel API) ---
    function renderLivePreview(manifest) {
        if (!ui.svgPreview) return;

        ui.svgPreview.innerHTML = '';
        
        // 1. Construct Vercel API URL
        const user = state.username || 'preview_user';
        const theme = state.theme;
        
        // Determine params based on first board artifact
        const artifact = manifest.artifacts.find(a => a.type === 'board');
        const showStars = artifact ? (artifact.options.show_stars !== false) : true;
        const maxRepos = artifact ? (artifact.options.max_repos || 10) : 10;
        
        const params = new URLSearchParams({
            user: user,
            theme: theme,
            show_stars: showStars,
            max_repos: maxRepos
        });

        const apiUrl = `${API_BASE_URL}/api/board?${params.toString()}`;
        
        // 2. Update Direct Link Input
        if (ui.directLinkInput) {
            ui.directLinkInput.value = apiUrl;
        }

        // 3. Render Image from API
        // Use an img tag so it fetches from the server
        const img = document.createElement('img');
        img.src = apiUrl;
        img.alt = "Board Preview";
        img.style.maxWidth = "100%";
        
        ui.svgPreview.classList.add('loading');
        
        img.onload = () => {
            ui.svgPreview.classList.remove('loading');
        };
        img.onerror = () => {
            ui.svgPreview.classList.remove('loading');
            ui.svgPreview.innerHTML = '<div style="color:red">Failed to load preview. Ensure API is running.</div>';
        };
        
        ui.svgPreview.appendChild(img);
    }
    
    function openGitHubIssue() {
        const manifest = generateManifest();
        const jsonStr = JSON.stringify(manifest, null, 2);
        
        const title = `Add User [${manifest.user}]`;
        const body = `Please add my user configuration to the daily rotation.\n\n\`\`\`json\n${jsonStr}\n\`\`\``;
        
        // TODO: Replace with your actual repository
        const repo = 'codefl0w/gh-boards'; 
        const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        
        window.open(url, '_blank');
    }

    // --- Helpers ---
    function copyToClipboard() {
        const text = ui.jsonPreview.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = ui.copyBtn.textContent;
            ui.copyBtn.textContent = 'Copied!';
            setTimeout(() => ui.copyBtn.textContent = originalText, 2000);
        });
    }

    function downloadJson() {
        const text = ui.jsonPreview.textContent;
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = (state.username || 'manifest') + '.json';

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});
