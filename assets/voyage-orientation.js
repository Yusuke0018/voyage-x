// Ultimate Screen Orientation Lock System
// 三者統合による最強の画面回転防止システム
(function() {
    'use strict';
    
    const OrientationController = {
        isLocked: false,
        lockAttempts: 0,
        maxAttempts: 5,
        isAndroid: /Android/i.test(navigator.userAgent),
        isChrome: /Chrome/i.test(navigator.userAgent),
        isSamsung: /SamsungBrowser/i.test(navigator.userAgent),
        isPWA: window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true,
        wakeLock: null,
        
        // 初期化
        init() {
            console.log('[Orient] Initializing Ultimate Orientation Lock System');
            console.log(`[Orient] Device: Android=${this.isAndroid}, PWA=${this.isPWA}`);
            
            // 即座にロック試行
            this.attemptLockWithRetry();
            
            // 複数のユーザーイベントでロック再試行
            ['click', 'touchstart', 'touchend', 'pointerdown'].forEach(event => {
                document.addEventListener(event, () => this.handleUserInteraction(), 
                    { once: true, passive: true });
            });
            
            // 画面回転検出と自動修正
            this.setupOrientationMonitoring();
            
            // Wake Lock取得（Android画面スリープ防止）
            this.requestWakeLock();
            
            // PWAモードで追加の対策
            if (this.isPWA) {
                this.enhancedPWALock();
            }
            
            // CSS フォールバック適用
            this.applyCSSFallback();
        },
        
        // リトライ付きロック試行
        async attemptLockWithRetry() {
            if (this.lockAttempts >= this.maxAttempts) {
                console.log('[Orient] Max attempts reached. Using fallback.');
                this.applyUltimateFallback();
                return;
            }
            
            this.lockAttempts++;
            console.log(`[Orient] Lock attempt ${this.lockAttempts}/${this.maxAttempts}`);
            
            const success = await this.tryAllLockMethods();
            
            if (!success && this.lockAttempts < this.maxAttempts) {
                // 指数バックオフで再試行
                const delay = Math.min(1000 * Math.pow(2, this.lockAttempts - 1), 5000);
                setTimeout(() => this.attemptLockWithRetry(), delay);
            }
        },
        
        // 全ロック方法を試行
        async tryAllLockMethods() {
            // 方法1: モダンScreen Orientation API
            if (await this.tryModernAPI()) return true;
            
            // 方法2: フルスクリーン + ロック
            if (await this.tryFullscreenLock()) return true;
            
            // 方法3: レガシーAPI
            if (this.tryLegacyAPIs()) return true;
            
            // 方法4: Android専用WebView API
            if (this.tryAndroidSpecific()) return true;
            
            return false;
        },
        
        // モダンAPI試行
        async tryModernAPI() {
            if (!screen.orientation || typeof screen.orientation.lock !== 'function') {
                return false;
            }
            
            try {
                // portrait-primaryを優先、失敗したらportraitを試行
                await screen.orientation.lock('portrait-primary');
                this.isLocked = true;
                console.log('[Orient] Modern API lock successful (portrait-primary)');
                document.body.classList.add('orientation-locked');
                return true;
            } catch (e1) {
                try {
                    await screen.orientation.lock('portrait');
                    this.isLocked = true;
                    console.log('[Orient] Modern API lock successful (portrait)');
                    document.body.classList.add('orientation-locked');
                    return true;
                } catch (e2) {
                    console.log('[Orient] Modern API failed:', e2.message);
                    return false;
                }
            }
        },
        
        // フルスクリーン経由のロック
        async tryFullscreenLock() {
            const elem = document.documentElement;
            
            // フルスクリーンAPI検出
            const requestFS = elem.requestFullscreen || 
                            elem.webkitRequestFullscreen || 
                            elem.mozRequestFullScreen || 
                            elem.msRequestFullscreen;
            
            if (!requestFS) return false;
            
            try {
                await requestFS.call(elem);
                console.log('[Orient] Fullscreen entered, attempting lock...');
                
                // フルスクリーンモードでロック再試行
                const lockSuccess = await this.tryModernAPI();
                
                // フルスクリーン解除（オプション）
                // if (document.exitFullscreen) {
                //     setTimeout(() => document.exitFullscreen(), 1000);
                // }
                
                return lockSuccess;
            } catch (e) {
                console.log('[Orient] Fullscreen lock failed:', e.message);
                return false;
            }
        },
        
        // レガシーAPI試行
        tryLegacyAPIs() {
            const apis = [
                { obj: screen, method: 'lockOrientation' },
                { obj: screen, method: 'mozLockOrientation' },
                { obj: screen, method: 'msLockOrientation' },
                { obj: window.screen, method: 'lockOrientation' }
            ];
            
            for (const api of apis) {
                if (api.obj && typeof api.obj[api.method] === 'function') {
                    try {
                        if (api.obj[api.method]('portrait-primary') || 
                            api.obj[api.method]('portrait')) {
                            this.isLocked = true;
                            console.log(`[Orient] Legacy API lock successful (${api.method})`);
                            return true;
                        }
                    } catch (e) {
                        console.log(`[Orient] Legacy ${api.method} failed:`, e.message);
                    }
                }
            }
            return false;
        },
        
        // Android専用対策
        tryAndroidSpecific() {
            if (!this.isAndroid) return false;
            
            // Android WebView特有のAPI試行
            if (window.AndroidInterface && 
                typeof window.AndroidInterface.lockOrientation === 'function') {
                try {
                    window.AndroidInterface.lockOrientation('portrait');
                    console.log('[Orient] Android WebView API lock successful');
                    return true;
                } catch (e) {
                    console.log('[Orient] Android WebView API failed:', e.message);
                }
            }
            
            return false;
        },
        
        // ユーザー操作ハンドラ
        handleUserInteraction() {
            console.log('[Orient] User interaction detected, retrying lock...');
            this.lockAttempts = 0; // リセット
            this.attemptLockWithRetry();
        },
        
        // 画面回転監視
        setupOrientationMonitoring() {
            // モダンAPI
            if (screen.orientation) {
                screen.orientation.addEventListener('change', () => {
                    this.handleOrientationChange();
                });
            }
            
            // レガシーAPI
            window.addEventListener('orientationchange', () => {
                this.handleOrientationChange();
            });
            
            // Visual Viewport API (Android Chrome)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', () => {
                    this.checkAndCorrectOrientation();
                });
            }
        },
        
        // 画面回転時の処理
        handleOrientationChange() {
            const orientation = this.getCurrentOrientation();
            console.log('[Orient] Orientation changed to:', orientation);
            
            if (!orientation.includes('portrait')) {
                console.log('[Orient] Wrong orientation detected! Correcting...');
                document.body.classList.add('force-portrait');
                this.attemptLockWithRetry();
            } else {
                document.body.classList.remove('force-portrait');
            }
        },
        
        // 現在の向き取得
        getCurrentOrientation() {
            if (screen.orientation) {
                return screen.orientation.type;
            }
            return window.orientation === 0 || window.orientation === 180 ? 
                   'portrait' : 'landscape';
        },
        
        // 向きチェックと修正
        checkAndCorrectOrientation() {
            const isPortrait = window.innerHeight > window.innerWidth;
            if (!isPortrait) {
                console.log('[Orient] Landscape detected via viewport, applying correction');
                document.body.classList.add('force-portrait');
            }
        },
        
        // Wake Lock取得
        async requestWakeLock() {
            if (!('wakeLock' in navigator)) return;
            
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('[Orient] Wake Lock acquired');
                
                this.wakeLock.addEventListener('release', () => {
                    console.log('[Orient] Wake Lock released');
                    // 再取得試行
                    setTimeout(() => this.requestWakeLock(), 1000);
                });
            } catch (e) {
                console.log('[Orient] Wake Lock failed:', e.message);
            }
        },
        
        // PWA強化モード
        enhancedPWALock() {
            console.log('[Orient] PWA mode detected, applying enhanced locks');
            
            // PWA用の追加CSS
            document.body.classList.add('pwa-mode');
            
            // より頻繁な再ロック試行
            setInterval(() => {
                if (!this.isLocked) {
                    this.tryAllLockMethods();
                }
            }, 5000);
        },
        
        // CSSフォールバック適用
        applyCSSFallback() {
            const style = document.createElement('style');
            style.textContent = `
                .force-portrait {
                    position: fixed !important;
                    transform: rotate(0deg) !important;
                    transform-origin: center center !important;
                }
                
                @media (orientation: landscape) and (max-width: 896px) {
                    .force-portrait body,
                    .force-portrait #app {
                        width: 100vh !important;
                        height: 100vw !important;
                        transform: rotate(-90deg) !important;
                        transform-origin: left top !important;
                        position: fixed !important;
                        top: 100% !important;
                        left: 0 !important;
                    }
                }
                
                /* PWAモード専用CSS */
                .pwa-mode {
                    touch-action: none !important;
                    overflow: hidden !important;
                }
                
                /* Android Samsung Browser対策 */
                @supports (-webkit-appearance: none) {
                    .orientation-locked {
                        position: fixed !important;
                        width: 100% !important;
                        height: 100% !important;
                    }
                }
            `;
            document.head.appendChild(style);
        },
        
        // 究極のフォールバック
        applyUltimateFallback() {
            console.log('[Orient] Applying ultimate fallback measures');
            document.body.classList.add('orientation-fallback', 'force-portrait');
            
            // デバイス固有の対策
            if (this.isSamsung) {
                document.body.style.webkitTransform = 'rotate(0deg)';
                document.body.style.webkitTransformOrigin = 'center center';
            }
        }
    };
    
    // 初期化タイミング
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => OrientationController.init());
    } else {
        OrientationController.init();
    }
    
    // グローバル公開（デバッグ用）
    window.OrientationController = OrientationController;
})();