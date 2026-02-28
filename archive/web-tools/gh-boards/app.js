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
        addRotationBtn: document.getElementById('add-rotation-btn'),
        importBtn: document.getElementById('import-btn'),
        importFileInput: document.getElementById('import-file-input'),
        importModal: document.getElementById('import-modal'),
        importTextarea: document.getElementById('import-textarea'),
        importConfirmBtn: document.getElementById('import-confirm-btn'),
        importCancelBtn: document.getElementById('import-cancel-btn'),
        importFileLink: document.getElementById('import-file-link')
    };

    // --- Configuration ---
    const API_BASE_URL = 'https://gh-boards.vercel.app';

    // --- Constants ---
    const VALID_TYPES = [
        { value: 'board', label: 'Board (Stars + Downloads)' },
        { value: 'badge_stars', label: 'Badge — Stars' },
        { value: 'badge_downloads', label: 'Badge — Downloads' },
        { value: 'badge_followers', label: 'Badge — Followers' },
        { value: 'badge_watchers', label: 'Badge — Watchers' },
        { value: 'badge_workflow', label: 'Badge — Workflow Status' },
        { value: 'badge_license', label: 'Badge — License' },
        { value: 'badge_forks', label: 'Badge — Forks' },
        { value: 'badge_custom', label: 'Badge — Custom' },
    ];

    // --- Initialization ---
    init();

    function init() {
        bindEvents();
        renderArtifacts();
        updatePreview();
    }

    function createDefaultArtifact(type) {
        // Badge types with repo + color customization
        if (type === 'badge_stars' || type === 'badge_downloads' || type === 'badge_watchers' || type === 'badge_license' || type === 'badge_forks') {
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
        // Followers — user-level, no repo needed
        if (type === 'badge_followers') {
            return {
                type: type,
                options: {
                    color: '#2ea44f',
                    label_color: '#555555',
                    text_style: 'normal'
                }
            };
        }
        // Workflow status — repo + optional workflow file
        if (type === 'badge_workflow') {
            return {
                type: type,
                options: {
                    repo: '',
                    workflow: '',
                    label_color: '#555555',
                    text_style: 'normal'
                }
            };
        }
        // Custom badge — no repo, just left/right text
        if (type === 'badge_custom') {
            return {
                type: type,
                options: {
                    label: '',
                    value: '',
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

        // Import functionality
        if (ui.importBtn) {
            ui.importBtn.addEventListener('click', () => {
                ui.importModal.classList.remove('hidden');
                ui.importTextarea.value = '';
                ui.importTextarea.focus();
            });
        }
        if (ui.importCancelBtn) {
            ui.importCancelBtn.addEventListener('click', () => {
                ui.importModal.classList.add('hidden');
            });
        }
        if (ui.importModal) {
            ui.importModal.addEventListener('click', (e) => {
                if (e.target === ui.importModal) ui.importModal.classList.add('hidden');
            });
        }
        if (ui.importConfirmBtn) {
            ui.importConfirmBtn.addEventListener('click', () => {
                try {
                    const json = JSON.parse(ui.importTextarea.value);
                    importManifest(json);
                    ui.importModal.classList.add('hidden');
                } catch (err) {
                    alert('Invalid JSON: ' + err.message);
                }
            });
        }
        if (ui.importFileLink) {
            ui.importFileLink.addEventListener('click', (e) => {
                e.preventDefault();
                ui.importFileInput.click();
            });
        }
        if (ui.importFileInput) {
            ui.importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const json = JSON.parse(ev.target.result);
                        importManifest(json);
                        ui.importModal.classList.add('hidden');
                    } catch (err) {
                        alert('Invalid JSON file: ' + err.message);
                    }
                };
                reader.readAsText(file);
                e.target.value = ''; // reset so same file can be re-imported
            });
        }
    }

    function toggleRepoInputs() {
        if (state.selectMethod === 'manual') {
            if (ui.limitGroup) ui.limitGroup.classList.add('hidden');
            if (ui.manualReposGroup) ui.manualReposGroup.classList.remove('hidden');
        } else {
            if (ui.limitGroup) ui.limitGroup.classList.remove('hidden');
            if (ui.manualReposGroup) ui.manualReposGroup.classList.add('hidden');
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

            // Build type-specific options HTML
            let optionsHTML = '';

            // Helper: color + text style row
            const colorRow = (art, index) => {
                const textStyleOptions = ['normal', 'bold', 'italic'].map(s =>
                    `<option value="${s}" ${art.options.text_style === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                ).join('');
                return `
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
                    </div>`;
            };

            if (art.type === 'board') {
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
            } else if (art.type === 'badge_followers') {
                // No repo field — user-level badge
                optionsHTML = colorRow(art, index);
            } else if (art.type === 'badge_workflow') {
                // Repo + optional workflow file + optional custom label
                optionsHTML = `
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Repository Name</label>
                            <input type="text" class="art-repo" value="${art.options.repo || ''}" data-idx="${index}" placeholder="e.g. my-project">
                        </div>
                        <div class="form-group">
                            <label>Workflow File <small style="color:var(--text-muted)">(optional)</small></label>
                            <input type="text" class="art-workflow" value="${art.options.workflow || ''}" data-idx="${index}" placeholder="e.g. ci.yml">
                        </div>
                        <div class="form-group">
                            <label>Custom Label <small style="color:var(--text-muted)">(optional)</small></label>
                            <input type="text" class="art-label" value="${art.options.label || ''}" data-idx="${index}" placeholder="e.g. Windows Build">
                        </div>
                    </div>
                ` + colorRow(art, index);
            } else if (art.type === 'badge_custom') {
                // Custom badge — left text + right text, no repo
                optionsHTML = `
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Left Text (Label)</label>
                            <input type="text" class="art-label" value="${art.options.label || ''}" data-idx="${index}" placeholder="e.g. version">
                        </div>
                        <div class="form-group">
                            <label>Right Text (Value)</label>
                            <input type="text" class="art-value" value="${art.options.value || ''}" data-idx="${index}" placeholder="e.g. v1.2.3">
                        </div>
                    </div>
                ` + colorRow(art, index);
            } else {
                // stars, downloads, watchers — repo + colors
                optionsHTML = `
                    <div class="form-group">
                        <label>Repository Name</label>
                        <input type="text" class="art-repo" value="${art.options.repo || ''}" data-idx="${index}" placeholder="e.g. my-project">
                    </div>
                ` + colorRow(art, index);
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

        // Workflow file input
        document.querySelectorAll('.art-workflow').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.workflow = e.target.value;
                updatePreview();
            });
        });

        // Custom label input
        document.querySelectorAll('.art-label').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.label = e.target.value;
                updatePreview();
            });
        });

        // Custom badge value input
        document.querySelectorAll('.art-value').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = e.target.dataset.idx;
                state.artifacts[idx].options.value = e.target.value;
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
            'board': { type: 'board', style: 'board_stars_downloads', badge_type: null },
            'badge_stars': { type: 'badge', style: 'badge_stars', badge_type: 'stars' },
            'badge_downloads': { type: 'badge', style: 'badge_downloads', badge_type: 'downloads' },
            'badge_followers': { type: 'badge', style: 'badge_followers', badge_type: 'followers' },
            'badge_watchers': { type: 'badge', style: 'badge_watchers', badge_type: 'watchers' },
            'badge_workflow': { type: 'badge', style: 'badge_workflow', badge_type: 'workflow_status' },
            'badge_license': { type: 'badge', style: 'badge_license', badge_type: 'license' },
            'badge_forks': { type: 'badge', style: 'badge_forks', badge_type: 'forks' },
            'badge_custom': { type: 'badge', style: 'badge_custom', badge_type: 'custom' },
        };

        // Auto-generate IDs
        const uniqueIds = {};
        const safeArtifacts = state.artifacts.map(art => {
            const mapping = typeMapping[art.type] || { type: art.type, style: art.type, badge_type: null };
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
                    badge_type: mapping.badge_type,
                    color: art.options.color || '#2ea44f',
                    label_color: art.options.label_color || '#555555',
                    text_style: art.options.text_style || 'normal',
                };
                // Include repo if present
                if (art.options.repo) result.options.repo = art.options.repo;
                // Include workflow file if present
                if (art.options.workflow) result.options.workflow = art.options.workflow;
                // Include custom label if present
                if (art.options.label) result.options.label = art.options.label;
                // Include custom value if present
                if (art.options.value !== undefined) result.options.value = art.options.value;
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
            const badgeType = firstArt.options.badge_type || 'stars';
            const params = new URLSearchParams({
                user,
                type: badgeType,
                label_color: firstArt.options.label_color || '#555555',
                text_style: firstArt.options.text_style || 'normal',
            });
            // Add repo if applicable (not needed for followers)
            if (firstArt.options.repo) params.set('repo', firstArt.options.repo);
            // Add color (workflow_status overrides on server, but still send user's preference)
            if (firstArt.options.color) params.set('color', firstArt.options.color);
            // Add workflow file if set
            if (firstArt.options.workflow) params.set('workflow', firstArt.options.workflow);
            // Add custom label if set
            if (firstArt.options.label) params.set('label', firstArt.options.label);
            // Add custom value if set
            if (firstArt.options.value !== undefined && firstArt.options.value !== '') params.set('value', firstArt.options.value);
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
            ui.svgPreview.innerHTML = '<div style="color:red">Failed to load preview. Make sure the values are correct.</div>';
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

    // --- Import ---
    function importManifest(json) {
        // Reverse badge_type → frontend type mapping
        const reverseTypeMap = {
            'stars': 'badge_stars',
            'downloads': 'badge_downloads',
            'followers': 'badge_followers',
            'watchers': 'badge_watchers',
            'workflow_status': 'badge_workflow',
            'license': 'badge_license',
            'forks': 'badge_forks',
            'custom': 'badge_custom',
        };

        // Set username
        state.username = json.user || '';
        if (ui.username) ui.username.value = state.username;

        // Set theme
        state.theme = (json.defaults && json.defaults.theme) || 'dark';
        ui.themeRadios.forEach(r => { r.checked = r.value === state.theme; });

        // Set select method
        const method = (json.select && json.select.method) || 'top_stars';
        state.selectMethod = method === 'explicit' ? 'manual' : method;
        ui.selectMethodRadios.forEach(r => { r.checked = r.value === state.selectMethod; });

        // Set manual repos
        if (state.selectMethod === 'manual' && json.targets && json.targets.repos) {
            state.manualRepos = json.targets.repos.join(', ');
            if (ui.manualRepos) ui.manualRepos.value = state.manualRepos;
        }
        toggleRepoInputs();

        // Reverse-map artifacts
        state.artifacts = (json.artifacts || []).map(art => {
            if (art.type === 'board') {
                return {
                    type: 'board',
                    options: {
                        max_repos: (art.options && art.options.max_repos) || 10,
                        show_stars: art.options ? art.options.show_stars !== false : true
                    }
                };
            }
            if (art.type === 'badge') {
                const bt = (art.options && art.options.badge_type) || 'stars';
                const frontendType = reverseTypeMap[bt] || 'badge_stars';
                return {
                    type: frontendType,
                    options: {
                        badge_type: bt,
                        repo: (art.options && art.options.repo) || '',
                        color: (art.options && art.options.color) || '#2ea44f',
                        label_color: (art.options && art.options.label_color) || '#555555',
                        text_style: (art.options && art.options.text_style) || 'normal',
                        workflow: (art.options && art.options.workflow) || '',
                        label: (art.options && art.options.label) || '',
                        value: (art.options && art.options.value) || '',
                    }
                };
            }
            // Fallback
            return createDefaultArtifact('board');
        });

        if (state.artifacts.length === 0) {
            state.artifacts = [createDefaultArtifact('board')];
        }

        renderArtifacts();
        updatePreview();
    }
});
