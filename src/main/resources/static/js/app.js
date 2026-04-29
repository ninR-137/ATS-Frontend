/* ============================================================
   app.js — Recruitment Management System (RMS) Shared Utilities
   ============================================================ */
(function () {
    'use strict';

    const ATS = window.ATS = {};

    /* ---- Config ---- */
    ATS.API_BASE = (function () {
        const meta = document.querySelector('meta[name="api-base-url"]');
        return (meta && meta.content) || 'http://localhost:8080';
    })();

    /* ---- JWT Helpers ---- */
    ATS.parseJwt = function (jwt) {
        try {
            const part = jwt.split('.')[1] || '';
            const norm = part.replace(/-/g, '+').replace(/_/g, '/');
            const pad = (4 - (norm.length % 4)) % 4;
            return JSON.parse(atob(norm + '='.repeat(pad)));
        } catch (e) { return {}; }
    };

    ATS.collectNormalizedRoles = function (values) {
        const queue = Array.isArray(values) ? [...values] : [values];
        const out = [];
        while (queue.length) {
            const item = queue.shift();
            if (!item) continue;
            if (Array.isArray(item)) { queue.push(...item); continue; }
            if (typeof item === 'string') {
                item.split(',').map(p => p.trim()).filter(Boolean)
                    .forEach(p => out.push(p.toUpperCase()));
                continue;
            }
            if (typeof item === 'object') {
                queue.push(item.role, item.name, item.authority, item.value);
            }
        }
        return [...new Set(out)];
    };

    ATS.hasAdminRole = function (roleList) {
        return roleList.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN' || r.endsWith('_ADMIN'));
    };

    ATS.getStoredUserInfo = function () {
        try {
            return JSON.parse(localStorage.getItem('user_info') || '{}');
        } catch (e) {
            return {};
        }
    };

    ATS.setStoredUserInfo = function (info) {
        localStorage.setItem('user_info', JSON.stringify(info || {}));
    };

    ATS.persistAdminAccess = function () {
        const stored = ATS.getStoredUserInfo();
        const nextRoles = ATS.collectNormalizedRoles([
            stored.role,
            stored.roles,
            stored.authorities,
            'ADMIN'
        ]);
        ATS.setStoredUserInfo({
            ...stored,
            role: 'ADMIN',
            roles: nextRoles,
            authorities: nextRoles,
            email: stored.email || ATS.userEmail || ''
        });
    };

    ATS.applyAccessUi = function () {
        const badge = document.getElementById('roleBadge');
        if (badge) {
            badge.textContent = ATS.isAdmin ? 'ADMIN' : 'USER';
            badge.className = 'badge ' + (ATS.isAdmin ? 'bg-danger' : 'bg-secondary');
        }

        const emailEls = document.querySelectorAll('.user-email-display');
        emailEls.forEach(el => { el.textContent = ATS.userEmail; });

        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = ATS.isAdmin ? '' : 'none';
        });

        document.querySelectorAll('.non-admin-only').forEach(el => {
            el.style.display = ATS.isAdmin ? 'none' : '';
        });
    };

    ATS.refreshAdminAccess = async function () {
        if (ATS.isAdmin) {
            return true;
        }

        try {
            await ATS.apiFetch('/admin-requests/pending');
            ATS.isAdmin = true;
            ATS.persistAdminAccess();
            ATS.applyAccessUi();
            document.dispatchEvent(new CustomEvent('ats:access-changed', {
                detail: { isAdmin: true }
            }));
            return true;
        } catch (err) {
            if (err && err.status === 401) {
                ATS.logout();
            }
            return false;
        }
    };

    /* ---- Auth ---- */
    ATS.getToken = function () { return localStorage.getItem('jwt_token'); };

    ATS.requireAuth = function () {
        const token = ATS.getToken();
        if (!token) { window.location.href = '/login'; return null; }
        return token;
    };

    ATS.logout = function () {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
    };

    /* ---- API Fetch ---- */
    ATS.apiFetch = async function (path, options) {
        options = options || {};
        const token = ATS.getToken();
        const config = {
            ...options,
            headers: {
                ...(token ? { Authorization: 'Bearer ' + token } : {}),
                ...(options.body && !(options.body instanceof FormData)
                    ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        };
        const res = await fetch(ATS.API_BASE + path, config);
        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (e) { data = text; }
        }
        if (!res.ok) {
            const msg = (data && (data.message || data.error)) || ('Request failed (' + res.status + ')');
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        return data;
    };

    /* ---- Notifications ---- */
    ATS.notify = function (type, message) {
        if (typeof window.appNotify === 'function') {
            window.appNotify(type, message);
        } else {
            console.log('[' + type + ']', message);
        }
    };

    /* ---- Format Helpers ---- */
    ATS.formatDateTime = function (value) {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(d);
    };

    ATS.formatDate = function (value) {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric', month: 'short', day: '2-digit'
        }).format(d);
    };

    ATS.timeAgo = function (value) {
        if (!value) return '—';
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return diff + 's ago';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
    };

    /* ---- Status Badge ---- */
    ATS.statusBadgeHtml = function (status) {
        if (!status) return '<span class="status-badge status-default">—</span>';
        const s = status.toUpperCase().replace(/ /g, '_');
        let cls = 'status-default';
        let label = status;
        if (s === 'HIRED') { cls = 'status-hired'; label = 'Hired'; }
        else if (s === 'SCHEDULED') { cls = 'status-scheduled'; label = 'Scheduled'; }
        else if (s === 'INTERVIEW_COMPLETED') { cls = 'status-interview-completed'; label = 'Interviewed'; }
        else if (s === 'INVITING_FOR_INTERVIEW') { cls = 'status-inviting'; label = 'Inviting'; }
        else if (s === 'NOT_QUALIFIED') { cls = 'status-not-qualified'; label = 'Not Qualified'; }
        else if (s === 'NOT_INTERESTED') { cls = 'status-not-interested'; label = 'Not Interested'; }
        else if (s === 'ORIENTATION_SCHEDULED') { cls = 'status-orientation'; label = 'Orientation'; }
        return '<span class="status-badge ' + cls + '">' + label + '</span>';
    };

    /* ---- Sidebar Initialization ---- */
    ATS.initPage = function () {
        const token = ATS.requireAuth();
        if (!token) return null;

        const claims = ATS.parseJwt(token);
        const stored = ATS.getStoredUserInfo();
        const roles = ATS.collectNormalizedRoles([
            claims.role, claims.roles, claims.authorities,
            claims.scope, claims.scopes,
            stored.role, stored.roles, stored.authorities
        ]);

        ATS.isAdmin = ATS.hasAdminRole(roles);
        ATS.userEmail = claims.sub || stored.email || '';
        ATS.userClaims = claims;
        ATS.applyAccessUi();

        /* active nav link (best match only) */
        const path = window.location.pathname;
        const navLinks = Array.from(document.querySelectorAll('[data-nav-href]'));
        let bestLink = null;
        let bestScore = -1;
        navLinks.forEach(link => {
            const href = link.dataset.navHref || '';
            if (!href) return;
            const isMatch = (path === href) || path.startsWith(href + '/');
            if (!isMatch) return;
            const score = href.length;
            if (score > bestScore) {
                bestScore = score;
                bestLink = link;
            }
        });
        navLinks.forEach(link => link.classList.remove('active'));
        if (bestLink) {
            bestLink.classList.add('active');
        }

        /* logout */
        document.querySelectorAll('#logoutBtn, .logout-btn').forEach(btn => {
            btn.addEventListener('click', ATS.logout);
        });

        /* mobile sidebar toggle */
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar-v2');
        const overlay = document.getElementById('sidebarOverlay');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', function () {
                sidebar.classList.toggle('mobile-open');
                if (overlay) overlay.classList.toggle('show');
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function () {
                if (sidebar) sidebar.classList.remove('mobile-open');
                overlay.classList.remove('show');
            });
        }

        void ATS.refreshAdminAccess();

        return { isAdmin: ATS.isAdmin, roles, claims };
    };

    /* ---- Loading skeleton ---- */
    ATS.skeletonRows = function (cols, count) {
        count = count || 5;
        const cells = Array(cols).fill('<td><div class="placeholder-glow"><span class="placeholder col-8 rounded"></span></div></td>').join('');
        return Array(count).fill('<tr>' + cells + '</tr>').join('');
    };

    /* ---- Confirm helper ---- */
    ATS.confirm = function (message, options) {
        options = options || {};
        return new Promise(function (resolve) {
            var modal = document.getElementById('atsConfirmModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = 'atsConfirmModal';
                modal.tabIndex = -1;
                modal.setAttribute('aria-hidden', 'true');
                modal.innerHTML =
                    '<div class="modal-dialog modal-dialog-centered">' +
                        '<div class="modal-content">' +
                            '<div class="modal-header">' +
                                '<h5 class="modal-title" id="atsConfirmTitle">Confirm Action</h5>' +
                                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                            '</div>' +
                            '<div class="modal-body">' +
                                '<p id="atsConfirmMessage" class="mb-0"></p>' +
                            '</div>' +
                            '<div class="modal-footer">' +
                                '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="atsConfirmCancelBtn">Cancel</button>' +
                                '<button type="button" class="btn btn-primary" id="atsConfirmOkBtn">Confirm</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                document.body.appendChild(modal);
            }

            var titleEl = document.getElementById('atsConfirmTitle');
            var messageEl = document.getElementById('atsConfirmMessage');
            var okBtn = document.getElementById('atsConfirmOkBtn');
            var cancelBtn = document.getElementById('atsConfirmCancelBtn');

            if (titleEl) titleEl.textContent = options.title || 'Confirm Action';
            if (messageEl) messageEl.textContent = message || 'Are you sure?';
            if (okBtn) okBtn.textContent = options.confirmText || 'Confirm';
            if (cancelBtn) cancelBtn.textContent = options.cancelText || 'Cancel';

            var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            var resolved = false;
            var cleanup = function () {
                if (okBtn) okBtn.removeEventListener('click', onOk);
                modal.removeEventListener('hidden.bs.modal', onHidden);
            };
            var finish = function (value) {
                if (resolved) return;
                resolved = true;
                cleanup();
                resolve(value);
            };
            var onOk = function () {
                bsModal.hide();
                finish(true);
            };
            var onHidden = function () {
                finish(false);
            };

            if (okBtn) okBtn.addEventListener('click', onOk);
            modal.addEventListener('hidden.bs.modal', onHidden);
            bsModal.show();
        });
    };

    /* ---- Blocking overlay for long-running workflows ---- */
    ATS._blockerCount = 0;
    ATS._navigationBlocked = false;

    function ensureBlockingOverlay() {
        var existing = document.getElementById('atsBlockingOverlay');
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.id = 'atsBlockingOverlay';
        overlay.style.cssText = [
            'position:fixed',
            'inset:0',
            'background:rgba(15,23,42,0.55)',
            'display:none',
            'align-items:center',
            'justify-content:center',
            'z-index:3000',
            'padding:1rem'
        ].join(';');

        overlay.innerHTML =
            '<div style="background:#ffffff;border-radius:12px;max-width:420px;width:100%;padding:1rem 1rem 0.9rem 1rem;box-shadow:0 10px 35px rgba(2,6,23,0.2);">' +
                '<div class="d-flex align-items-center gap-3">' +
                    '<div class="spinner-border text-primary" role="status" aria-hidden="true"></div>' +
                    '<div>' +
                        '<div class="fw-semibold" style="font-size:0.95rem;">Processing request...</div>' +
                        '<div id="atsBlockingOverlayMessage" class="text-muted" style="font-size:0.82rem;line-height:1.35;">Please do not refresh or navigate away while backend processing is in progress.</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        return overlay;
    }

    ATS.setBlockingBusy = function (isBusy, message) {
        var overlay = ensureBlockingOverlay();
        var msgEl = document.getElementById('atsBlockingOverlayMessage');

        if (isBusy) {
            ATS._blockerCount += 1;
            ATS._navigationBlocked = true;
            if (msgEl) {
                msgEl.textContent = message || 'Please do not refresh or navigate away while backend processing is in progress.';
            }
            overlay.style.display = 'flex';
            return;
        }

        ATS._blockerCount = Math.max(0, ATS._blockerCount - 1);
        if (ATS._blockerCount === 0) {
            ATS._navigationBlocked = false;
            overlay.style.display = 'none';
        }
    };

    window.addEventListener('beforeunload', function (event) {
        if (!ATS._navigationBlocked) return;
        event.preventDefault();
        event.returnValue = '';
    });

})();
