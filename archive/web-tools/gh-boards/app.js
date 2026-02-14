document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        username: '',
        theme: 'dark',
        selectMethod: 'top_stars',
        limit: 20,
        manualRepos: '',
        artifacts: [createDefaultArtifact('board')]
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
    const API_BASE_URL = 'https://gh-boards.vercel.app';

    // --- Constants ---
    const VALID_TYPES = [
        { value: 'board', label: 'Board (Stars + Downloads)' },
        { value: 'badge_stars', label: 'Badge — Stars' },
        { value: 'badge_downloads', label: 'Badge — Downloads' },
    ];

    // --- Initialization ---
    init();

    function init() {
        bindEvents();
        renderArtifacts();
        updatePreview();
    }

    function createDefaultArtifact(type) {
        if (type === 'badge_stars' || type === 'badge_downloads') {
            return {
                type: type,
                options: {
                    repo: '',
                    color: '#2ea44f',
                    label_color: '#555555',
                    text_style: 'normal'
                }
            };
        }
        // Default: board
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
                state.artifacts.push(createDefaultArtifact('board'));
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

            const isBadge = art.type === 'badge_stars' || art.type === 'badge_downloads';

            // Build type-specific options HTML
            let optionsHTML = '';
            if (isBadge) {
                const textStyleOptions = ['normal', 'bold', 'italic'].map(s =>
                    `<option value="${s}" ${art.options.text_style === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                ).join('');

                optionsHTML = `
                    <div class="form-group">
                        <label>Repository Name</label>
                        <input type="text" class="art-repo" value="${art.options.repo || ''}" data-idx="${index}" placeholder="e.g. my-project">
                    </div>
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Badge Color</label>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="color" class="art-color" value="${art.options.color || '#2ea44f'}" data-idx="${index}" style="width: 40px; height: 34px; border: none; cursor: pointer; background: none;">
                                <input type="text" class="art-color-text" value="${art.options.color || '#2ea44f'}" data-idx="${index}" style="flex:1; font-family: var(--font-mono); font-size: 0.85rem;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Label Color</label>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="color" class="art-label-color" value="${art.options.label_color || '#555555'}" data-idx="${index}" style="width: 40px; height: 34px; border: none; cursor: pointer; background: none;">
                                <input type="text" class="art-label-color-text" value="${art.options.label_color || '#555555'}" data-idx="${index}" style="flex:1; font-family: var(--font-mono); font-size: 0.85rem;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Text Style</label>
                            <select class="art-text-style" data-idx="${index}" style="width:100%; padding:0.75rem; border-radius:8px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:var(--text-main);">
                                ${textStyleOptions}
                            </select>
                        </div>
                    </div>
                `;
            } else {
                // Board options
                optionsHTML = `
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
                `;
            }

            el.innerHTML = `
                <div class="form-group">
                    <label>Type</label>
                    <select class="art-type" data-idx="${index}" style="width:100%; padding:0.75rem; border-radius:8px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:var(--text-main);">
                        ${typeOptions}
                    </select>
                </div>
                ${optionsHTML}
                ${state.artifacts.length > 1 ? `<button class="remove-artifact" data-idx="${index}">×</button>` : ''}
            `;
            ui.artifactsList.appendChild(el);
        });

        bindArtifactInputs();
    }

    function bindArtifactInputs() {
        // Type dropdown — triggers full re-render when changed
        document.querySelectorAll('.art-type').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                const newType = e.target.value;
                // Replace artifact with correct default options for new type
                state.artifacts[idx] = createDefaultArtifact(newType);
                renderArtifacts();
                updatePreview();
            });
        });

        // Board-specific
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

        // Badge-specific
        document.querySelectorAll('.art-repo').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.repo = e.target.value;
                updatePreview();
            });
        });

        // Color pickers (sync with text inputs)
        document.querySelectorAll('.art-color').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.color = e.target.value;
                const textInput = document.querySelector(`.art-color-text[data-idx="${idx}"]`);
                if (textInput) textInput.value = e.target.value;
                updatePreview();
            });
        });
        document.querySelectorAll('.art-color-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    state.artifacts[idx].options.color = val;
                    const picker = document.querySelector(`.art-color[data-idx="${idx}"]`);
                    if (picker) picker.value = val;
                    updatePreview();
                }
            });
        });
        document.querySelectorAll('.art-label-color').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.label_color = e.target.value;
                const textInput = document.querySelector(`.art-label-color-text[data-idx="${idx}"]`);
                if (textInput) textInput.value = e.target.value;
                updatePreview();
            });
        });
        document.querySelectorAll('.art-label-color-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    state.artifacts[idx].options.label_color = val;
                    const picker = document.querySelector(`.art-label-color[data-idx="${idx}"]`);
                    if (picker) picker.value = val;
                    updatePreview();
                }
            });
        });
        document.querySelectorAll('.art-text-style').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.text_style = e.target.value;
                updatePreview();
            });
        });

        // Remove button
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
        const username = state.username || "YOUR_USERNAME";
        const now = new Date().toISOString();

        // Map frontend types to manifest schema
        const typeMapping = {
            'board': { type: 'board', style: 'board_stars_downloads' },
            'badge_stars': { type: 'badge', style: 'badge_stars' },
            'badge_downloads': { type: 'badge', style: 'badge_downloads' },
        };

        // Auto-generate IDs
        const uniqueIds = {};
        const safeArtifacts = state.artifacts.map(art => {
            const mapping = typeMapping[art.type] || { type: art.type, style: art.type };
            let baseId = mapping.style;
            if (!uniqueIds[baseId]) uniqueIds[baseId] = 0;
            uniqueIds[baseId]++;

            let finalId = baseId;
            if (uniqueIds[baseId] > 1) {
                finalId = `${baseId}_${uniqueIds[baseId]}`;
            }

            const result = {
                id: finalId,
                type: mapping.type,
                style: mapping.style,
                target: "profile",
                theme: state.theme,
                status: "active"
            };

            // Type-specific options
            if (mapping.type === 'badge') {
                result.options = {
                    badge_type: art.type === 'badge_stars' ? 'stars' : 'downloads',
                    repo: art.options.repo || '',
                    color: art.options.color || '#2ea44f',
                    label_color: art.options.label_color || '#555555',
                    text_style: art.options.text_style || 'normal',
                };
            } else {
                result.options = {
                    max_repos: art.options.max_repos || 10,
                    show_stars: art.options.show_stars !== false,
                    show_downloads: true
                };
            }

            return result;
        });

        const manifest = {
            schema_version: 1,
            user: username,
            created_on: now,
            defaults: {
                theme: state.theme
            },
            select: {
                method: state.selectMethod
            },
            artifacts: safeArtifacts,
            cache: {
                repos_etag: null,
                last_checked: null
            },
            meta: {
                requested_by: "web-ui",
                requested_at: now
            }
        };

        if (state.selectMethod === 'manual') {
            const repoList = state.manualRepos.split(',').map(s => s.trim()).filter(s => s);
            manifest.select.method = 'explicit';
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

            let safeUser = (state.username || 'YOUR_NAME').trim();
            if (!safeUser) safeUser = 'YOUR_NAME';
            safeUser = safeUser.replace(/[^a-z0-9-_]/gi, '');
            if (!safeUser) safeUser = 'YOUR_NAME';

            if (ui.filepathHint) {
                ui.filepathHint.textContent = `users/${safeUser}.json`;
            }

            renderLivePreview(manifest);
        } catch (e) {
            console.error("Preview update error:", e);
        }
    }

    // --- Live Preview ---
    function renderLivePreview(manifest) {
        if (!ui.svgPreview) return;
        ui.svgPreview.innerHTML = '';

        const user = state.username || 'preview_user';
        const theme = state.theme;

        // Find first artifact to preview
        const firstArt = manifest.artifacts[0];
        if (!firstArt) {
            ui.svgPreview.innerHTML = '<div class="placeholder-text">Add an artifact to see preview</div>';
            return;
        }

        let apiUrl = '';

        if (firstArt.type === 'board') {
            const showStars = firstArt.options.show_stars !== false;
            const maxRepos = firstArt.options.max_repos || 10;
            const params = new URLSearchParams({
                user, theme, show_stars: showStars, max_repos: maxRepos
            });
            apiUrl = `${API_BASE_URL}/api/board?${params.toString()}`;
        } else if (firstArt.type === 'badge') {
            const repo = firstArt.options.repo || 'example-repo';
            const params = new URLSearchParams({
                user,
                repo,
                type: firstArt.options.badge_type || 'stars',
                color: firstArt.options.color || '#2ea44f',
                label_color: firstArt.options.label_color || '#555555',
                text_style: firstArt.options.text_style || 'normal',
            });
            apiUrl = `${API_BASE_URL}/api/badge?${params.toString()}`;
        }

        // Update Direct Link
        if (ui.directLinkInput) {
            ui.directLinkInput.value = apiUrl;
        }

        // Render preview image
        const img = document.createElement('img');
        img.src = apiUrl;
        img.alt = firstArt.type === 'badge' ? 'Badge Preview' : 'Board Preview';
        img.style.maxWidth = '100%';

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
