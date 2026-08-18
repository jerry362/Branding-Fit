// public/js/auth.js

const AUTH_RETURN_TO_KEY = 'branding_fit_return_to';
const protectedHashes = ['#/workspace', '#/mypage'];

window.brandingFitAuth = {
    authenticated: false,
    user: null,
    status: 'loading'
};
exposeAuthControls();

document.addEventListener('DOMContentLoaded', () => {
    showAuthErrorFromQuery();
    checkLoginStatus().then(restoreReturnToAfterLogin);
    setupModalListeners();
    guardProtectedNavigation();
    setupMyPageAccountActions();

    const homeFrame = document.getElementById('home-page-frame');
    if (homeFrame) {
        homeFrame.addEventListener('load', notifyEmbeddedHomeAuthState);
    }
});

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        setAuthState({
            authenticated: Boolean(data.authenticated),
            user: data.user || null,
            status: 'ready'
        });

        renderAuthNavigation(window.brandingFitAuth);
        return window.brandingFitAuth;
    } catch (error) {
        console.error('Failed to check login status:', error);
        setAuthState({ status: 'error' });
        renderAuthNavigation(window.brandingFitAuth);
        return window.brandingFitAuth;
    }
}

function getScopedBrandStorageKey() {
    const auth = window.brandingFitAuth || {};
    const userId = auth.authenticated && auth.user ? auth.user.id : null;
    return userId ? `branding_fit_saved_brands:user:${userId}` : 'branding_fit_saved_brands:guest';
}

function setAuthState(nextState) {
    window.brandingFitAuth = {
        ...window.brandingFitAuth,
        ...nextState
    };
    exposeAuthControls();
    notifyEmbeddedHomeAuthState();
}

function exposeAuthControls() {
    window.openLoginModal = openLoginModal;
    window.closeLoginModal = closeLoginModal;
    window.brandingFitAuth.openLoginModal = openLoginModal;
    window.brandingFitAuth.closeLoginModal = closeLoginModal;
    window.brandingFitAuth.checkLoginStatus = checkLoginStatus;
}

function notifyEmbeddedHomeAuthState() {
    const homeFrame = document.getElementById('home-page-frame');
    const homeBridge = homeFrame && homeFrame.contentWindow && homeFrame.contentWindow.brandingFitBridge;
    if (homeBridge && typeof homeBridge.syncAuthState === 'function') {
        homeBridge.syncAuthState(window.brandingFitAuth);
    }
}

function showAuthErrorFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('auth_error');
    if (!provider) return;

    const providerLabel = provider === 'github' ? 'GitHub' : provider === 'google' ? 'Google' : '소셜';
    const cleanUrl = window.location.pathname + (window.location.hash || '#/');
    window.history.replaceState(null, '', cleanUrl);
    alert(providerLabel + ' 로그인에 실패했습니다. OAuth Client ID/Secret과 Authorized redirect URI 설정을 확인해 주세요.');
}

function renderAuthNavigation(authState) {
    const loginTrigger = document.getElementById('nav-login-trigger');
    const mypageLink = document.getElementById('nav-mypage');
    const authenticated = Boolean(authState?.authenticated);

    if (loginTrigger) {
        if (mypageLink) {
            loginTrigger.style.display = authenticated ? 'none' : '';
            if (!loginTrigger.dataset.authBound) {
                loginTrigger.dataset.authBound = 'true';
                loginTrigger.addEventListener('click', (e) => {
                    e.preventDefault();
                    openLoginModal();
                });
            }
        } else {
            loginTrigger.style.display = '';
            loginTrigger.textContent = authenticated ? '마이페이지' : '로그인';
            loginTrigger.setAttribute('href', authenticated ? '#/mypage' : '#');
            loginTrigger.dataset.authenticated = authenticated ? 'true' : 'false';
            if (!loginTrigger.dataset.authBound) {
                loginTrigger.dataset.authBound = 'true';
                loginTrigger.addEventListener('click', (e) => {
                    if (loginTrigger.dataset.authenticated === 'true') {
                        return;
                    }
                    e.preventDefault();
                    openLoginModal();
                });
            }
        }
    }

    if (mypageLink) {
        mypageLink.style.display = authenticated ? 'inline-flex' : 'none';
        mypageLink.textContent = '마이페이지';
        mypageLink.classList.toggle('is-authenticated', authenticated);
        mypageLink.setAttribute('aria-disabled', 'false');
    }
}

function guardProtectedNavigation() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#/"]');
        if (!link) return;

        const targetHash = link.getAttribute('href');
        if (!isProtectedHash(targetHash)) return;
        if (window.brandingFitAuth.authenticated) return;

        event.preventDefault();
        localStorage.setItem(AUTH_RETURN_TO_KEY, targetHash);
        openLoginModal();
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#/';
        if (isProtectedHash(hash) && !window.brandingFitAuth.authenticated && window.brandingFitAuth.status === 'ready') {
            localStorage.setItem(AUTH_RETURN_TO_KEY, hash);
            window.location.hash = '#/';
            openLoginModal();
        }
    });
}

function isProtectedHash(hash) {
    return protectedHashes.some(prefix => hash === prefix || hash.startsWith(prefix + '/'));
}

function restoreReturnToAfterLogin() {
    if (!window.brandingFitAuth.authenticated) return;

    const returnTo = localStorage.getItem(AUTH_RETURN_TO_KEY);
    if (!returnTo) return;

    localStorage.removeItem(AUTH_RETURN_TO_KEY);
    if (window.location.hash !== returnTo) {
        window.location.hash = returnTo;
    }
}

async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            localStorage.removeItem(AUTH_RETURN_TO_KEY);
            window.location.hash = '#/';
            await checkLoginStatus();
            alert('로그아웃이 완료되었습니다.');
        }
    } catch (error) {
        console.error('Logout failed:', error);
        alert('로그아웃에 실패했습니다.');
    }
}

async function handleWithdraw() {
    if (!confirm('회원 탈퇴 시 저장된 브랜드 데이터는 복구할 수 없습니다. 탈퇴하시겠습니까?')) return;

    try {
        const response = await fetch('/api/auth/withdraw', { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'withdraw failed');
        }

        localStorage.removeItem(AUTH_RETURN_TO_KEY);
        localStorage.removeItem(getScopedBrandStorageKey());
        window.location.hash = '#/';
        await checkLoginStatus();
        alert('회원 탈퇴가 완료되었습니다.');
    } catch (error) {
        console.error('Withdraw failed:', error);
        alert('회원탈퇴 처리에 실패했습니다. 로그인 상태를 확인해 주세요.');
    }
}

function setupMyPageAccountActions() {
    const logoutBtn = document.getElementById('btn-mypage-logout');
    const withdrawBtn = document.getElementById('btn-mypage-withdraw');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (withdrawBtn) withdrawBtn.addEventListener('click', handleWithdraw);
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupModalListeners() {
    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLoginModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLoginModal();
            }
        });
    }
}
