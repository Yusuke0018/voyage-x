// Voyage.js - Core Application

// ===== A1: Date Utilities =====
const DateUtil = {
    // ISO形式への正規化
    normalizeToISO(input, type) {
        if (!input) return null;
        
        // スラッシュをハイフンに変換
        const normalized = input.replace(/\//g, '-');
        
        if (type === 'day') {
            // YYYY-MM-DD形式
            const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (match) {
                return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            }
        } else if (type === 'month') {
            // YYYY-MM形式
            const match = normalized.match(/^(\d{4})-(\d{1,2})$/);
            if (match) {
                return `${match[1]}-${match[2].padStart(2, '0')}`;
            }
        }
        
        return normalized;
    },
    
    // 表示用フォーマット（和式）
    formatForDisplay(isoDate, type) {
        if (!isoDate) return '';
        
        if (type === 'day') {
            const [year, month, day] = isoDate.split('-');
            return `${year}年${parseInt(month)}月${parseInt(day)}日`;
        } else if (type === 'month') {
            const [year, month] = isoDate.split('-');
            return `${year}年${parseInt(month)}月`;
        }
        
        return isoDate;
    },
    
    // 月の日数を取得
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    },
    
    // うるう年判定
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },
    
    // 日付間の月数を計算
    getMonthsBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (end.getFullYear() - start.getFullYear()) * 12 + 
               (end.getMonth() - start.getMonth());
    },
    // 日数差（end - start, 日単位）
    getDaysBetween(startISO, endISO) {
        try {
            const s = new Date(startISO);
            const e = new Date(endISO);
            return Math.round((e - s) / (1000*60*60*24));
        } catch { return 0; }
    },
    // 今日からの残日数（対象が過去なら負数）
    daysUntil(targetISO) {
        const today = new Date();
        const t = new Date(targetISO);
        const sISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        return this.getDaysBetween(sISO, targetISO);
    }
};

// ===== A2: State Management =====
class StateManager {
    constructor() {
        this.state = {
            version: "1.0.0",
            visions: [],
            currentVisionId: null,
            theme: 'light',
            zoom: 100
        };
        this.listeners = [];
    }
    
    // ID生成
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ビジョン追加
    addVision(title, dueDate) {
        const vision = {
            id: this.generateId('vision'),
            title,
            dueDate: DateUtil.normalizeToISO(dueDate, 'day'),
            milestones: []
        };
        this.state.visions.push(vision);
        this.notify();
        return vision.id;
    }
    
    // ビジョン更新
    updateVision(id, updates) {
        const vision = this.state.visions.find(v => v.id === id);
        if (vision) {
            Object.assign(vision, updates);
            if (updates.dueDate) {
                vision.dueDate = DateUtil.normalizeToISO(updates.dueDate, 'day');
            }
            this.notify();
        }
    }
    
    // ビジョン削除
    deleteVision(id) {
        this.state.visions = this.state.visions.filter(v => v.id !== id);
        if (this.state.currentVisionId === id) {
            this.state.currentVisionId = null;
        }
        this.notify();
    }
    
    // マイルストーン追加
    addMilestone(visionId, type, startDate, endDate, title, description = '', color = 0) {
        const vision = this.state.visions.find(v => v.id === visionId);
        if (!vision) return null;
        
        // 月タイプは廃止 -> dayに強制
        if (type === 'month') type = 'day';

        const milestone = {
            id: this.generateId('ms'),
            type,
            startDate: DateUtil.normalizeToISO(startDate, 'day'),
            endDate: type === 'range' ? DateUtil.normalizeToISO(endDate, 'day') : undefined,
            title,
            description,
            color: Math.max(0, Math.min(9, parseInt(color) || 0)),
            y: 120
        };
        
        vision.milestones.push(milestone);
        this.notify();
        return milestone.id;
    }
    
    // マイルストーン更新
    updateMilestone(visionId, milestoneId, updates) {
        const vision = this.state.visions.find(v => v.id === visionId);
        if (!vision) return;
        
        const milestone = vision.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            Object.assign(milestone, updates);
            if (updates.startDate) {
                const type = updates.type || milestone.type;
                milestone.startDate = DateUtil.normalizeToISO(updates.startDate, 'day');
            }
            if (updates.endDate && milestone.type === 'range') {
                milestone.endDate = DateUtil.normalizeToISO(updates.endDate, 'day');
            }
            this.notify();
        }
    }
    
    // マイルストーン削除
    deleteMilestone(visionId, milestoneId) {
        const vision = this.state.visions.find(v => v.id === visionId);
        if (vision) {
            vision.milestones = vision.milestones.filter(m => m.id !== milestoneId);
            this.notify();
        }
    }
    
    // リスナー登録
    subscribe(listener) {
        this.listeners.push(listener);
    }
    
    // 状態変更通知
    notify() {
        this.listeners.forEach(listener => listener(this.state));
        this.save();
    }
    
    // LocalStorage保存
    save() {
        try {
            localStorage.setItem('voyage:v1', JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    
    // LocalStorage読み込み
    load() {
        try {
            const saved = localStorage.getItem('voyage:v1');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.version === "1.0.0") {
                    this.state = parsed;
                    // 月タイプのマイルストーンを日付タイプへ移行
                    this.state.visions.forEach(v => {
                        v.milestones = v.milestones.map(m => {
                            if (m.type === 'month') {
                                const iso = DateUtil.normalizeToISO(m.startDate, 'month');
                                // YYYY-MM -> YYYY-MM-01
                                const [yy, mm] = (iso || '').split('-');
                                const dayIso = (yy && mm) ? `${yy}-${mm.padStart(2,'0')}-01` : iso;
                                return { ...m, type: 'day', startDate: dayIso };
                            }
                            return m;
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

// ===== B1: LocalStorage Wrapper =====
class StorageManager {
    static KEY = 'voyage:v1';
    
    static save(state) {
        try {
            const data = JSON.stringify(state);
            const size = new Blob([data]).size;
            
            // 容量警告（4MB以上）
            if (size > 4 * 1024 * 1024) {
                UI.showWarning('データ容量が大きくなっています。バックアップをお勧めします。');
            }
            
            localStorage.setItem(this.KEY, data);
            return true;
        } catch (e) {
            UI.showError('保存に失敗しました。容量を確認してください。');
            return false;
        }
    }
    
    static load() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            UI.showError('データの読み込みに失敗しました。');
            return null;
        }
    }
    
    static clear() {
        localStorage.removeItem(this.KEY);
    }
    
    static getSize() {
        const data = localStorage.getItem(this.KEY) || '';
        return new Blob([data]).size;
    }
}

// ===== B2: Export/Import =====
class DataPorter {
    static exportData(state) {
        const exportData = {
            ...state,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], 
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        a.href = url;
        a.download = `voyage-backup-${date}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    static async importData(file, mode, conflictStrategy = 'skip') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    
                    // バリデーション
                    if (!this.validateImportData(imported)) {
                        reject('無効なデータ形式です。');
                        return;
                    }
                    
                    if (imported.version !== "1.0.0") {
                        reject(`バージョン ${imported.version} はサポートされていません。`);
                        return;
                    }
                    
                    resolve(imported);
                } catch (err) {
                    reject('JSONの解析に失敗しました。');
                }
            };
            
            reader.onerror = () => reject('ファイルの読み込みに失敗しました。');
            reader.readAsText(file);
        });
    }
    
    static validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.version || !Array.isArray(data.visions)) return false;
        
        return data.visions.every(vision => 
            vision.id && 
            vision.title && 
            vision.dueDate &&
            Array.isArray(vision.milestones)
        );
    }
    
    static mergeData(current, imported, strategy) {
        const merged = { ...current };
        const idMap = new Map();
        
        // 既存IDをマップに登録
        current.visions.forEach(v => {
            idMap.set(v.id, true);
            v.milestones.forEach(m => idMap.set(m.id, true));
        });
        
        imported.visions.forEach(vision => {
            const existingIndex = merged.visions.findIndex(v => v.id === vision.id);
            
            if (existingIndex >= 0) {
                // ID衝突時の処理
                if (strategy === 'overwrite') {
                    merged.visions[existingIndex] = vision;
                } else if (strategy === 'duplicate') {
                    const newVision = { ...vision, id: stateManager.generateId('vision') };
                    newVision.milestones = newVision.milestones.map(m => ({
                        ...m,
                        id: stateManager.generateId('ms')
                    }));
                    merged.visions.push(newVision);
                }
                // skipの場合は何もしない
            } else {
                merged.visions.push(vision);
            }
        });
        
        return merged;
    }
}

// ===== UI Manager =====
class UI {
    static deletedItem = null;
    static undoTimer = null;
    static colorCount = 10;
    static colorStream = [];
    static colorPtr = 0;
    static prepareColorStream(n) {
        const cycles = Math.ceil(n / this.colorCount) || 1;
        const arr = [];
        for (let c = 0; c < cycles; c++) {
            for (let i = 0; i < this.colorCount; i++) arr.push(i);
        }
        // shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        this.colorStream = arr;
        this.colorPtr = 0;
    }
    static nextColorIndex() {
        if (this.colorStream.length === 0) this.prepareColorStream(10);
        const idx = this.colorStream[this.colorPtr % this.colorStream.length];
        this.colorPtr++;
        return idx;
    }
    
    static init() {
        // デフォルトをライトテーマに変更
        if (!stateManager.state.theme) {
            stateManager.state.theme = 'light';
        }
        document.body.setAttribute('data-theme', stateManager.state.theme);
        this.renderApp();
        // 白基調へ統一のためテーマトグルは無効化
    }
    
    static renderApp() {
        const app = document.getElementById('app');
        
        if (!stateManager.state.currentVisionId) {
            this.renderHome(app);
        } else {
            this.renderTimeline(app);
        }
    }
    
    static addThemeToggle() { /* 白基調固定のため非表示 */ }
    
    static renderHome(container) {
        container.innerHTML = `
            <header class="app-header">
                <div class="app-header-inner">
                    <div class="brand"><span class="brand-mark"></span>Voyage</div>
                    <div class="header-actions">
                        <button id="addVisionHeader">新しいビジョン</button>
                    </div>
                </div>
            </header>
            <div class="container">
                <div class="hero">
                    <h1>Voyage</h1>
                    <p>あなたの目標への道のりを美しく可視化</p>
                    <button class="hero-button" id="addVision">✨ 新しいビジョンを作成</button>
                </div>
                <div class="visions-grid" id="visionList"></div>
                <div style="text-align: center; margin-top: 40px;">
                    <button id="exportData" style="margin-right: 12px;">📥 データをエクスポート</button>
                    <button id="importData">📤 データをインポート</button>
                    <input type="file" id="importFile" accept=".json" style="display: none;">
                </div>
            </div>
        `;
        
        this.renderVisionList();
        this.attachHomeListeners();
    }
    
    static renderVisionList() {
        const list = document.getElementById('visionList');
        
        if (stateManager.state.visions.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text); opacity: 0.6;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                    <p style="font-size: 18px;">まだビジョンがありません</p>
                    <p style="font-size: 14px;">上のボタンから最初のビジョンを作成しましょう</p>
                </div>
            `;
            return;
        }
        
        list.innerHTML = stateManager.state.visions.map(vision => `
            <div class="vision-card animate-in" data-id="${vision.id}">
                <h2>${vision.title}</h2>
                <div class="due-date">📅 ${DateUtil.formatForDisplay(vision.dueDate, 'day')}</div>
                <div class="milestone-count">📍 マイルストーン: ${vision.milestones.length}個</div>
            </div>
        `).join('');
    }
    
    static renderTimeline(container) {
        const vision = stateManager.state.visions.find(
            v => v.id === stateManager.state.currentVisionId
        );
        
        if (!vision) {
            stateManager.state.currentVisionId = null;
            this.renderApp();
            return;
        }
        
        container.innerHTML = `
            <header class="app-header">
                <div class="app-header-inner">
                    <div class="brand" style="gap:14px;">
                        <button id="backToHome" style="background:#F3F4F6;color:#111827;border:1px solid rgba(0,0,0,0.06);">← ホーム</button>
                        <span class="brand-mark"></span>${vision.title}
                    </div>
                    <div class="header-actions">
                        <button id="addMilestone">マイルストーンを追加</button>
                    </div>
                </div>
            </header>
            <div class="timeline-container">
                <div class="timeline-bar">
                    <div class="timeline-meta">期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}</div>
                    <div class="timeline-today" id="todayBadge"></div>
                    <div class="timeline-controls">
                        <label for="zoomRange">ズーム</label>
                        <input type="range" id="zoomRange" min="40" max="160" step="20" value="${stateManager.state.zoom || 100}">
                    </div>
                </div>
                <div class="timeline" id="timeline">
                    <div class="timeline-ruler" id="timelineRuler"></div>
                    <div class="timeline-track" id="timelineTrack"></div>
                </div>
            </div>
            <div class="bottom-bar" id="bottomBar">
                <button id="mobileAddMilestone">＋ マイルストーン</button>
                <button id="mobileJumpToday">今日へ</button>
            </div>
        `;
        
        this.renderTimelineContent(vision);
        this.attachTimelineListeners();
    }
    
    static renderTimelineContent(vision) {
        const track = document.getElementById('timelineTrack');
        const ruler = document.getElementById('timelineRuler');
        const timeline = document.getElementById('timeline');
        const now = new Date();
        // 週単位の開始（週の先頭: 日曜）
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const endDate = new Date(vision.dueDate);
        // 期日を含む週の末まで表示
        const endTmp = new Date(endDate);
        endTmp.setDate(endTmp.getDate() + (6 - endTmp.getDay()));
        endDate.setTime(endTmp.getTime());
        
        // 週ラベルとグリッドの描画
        let currentDate = new Date(startDate);
        let position = 0;
        const weekWidth = Math.max(20, Math.min(40, Math.round((stateManager.state.zoom || 100) / 4)));
        const monthWidth = weekWidth; // 既存計算互換のため
        ruler.innerHTML = '';
        track.innerHTML = '';
        // 月境界と月番号（シンプル表示）
        let weekIndex = 0;
        while (currentDate <= endDate) {
            // 週グリッド
            const grid = document.createElement('div');
            grid.className = 'grid-week';
            grid.style.left = `${position}px`;
            track.appendChild(grid);

            // 週ラベルは表示しない（シンプル化）

            currentDate.setDate(currentDate.getDate() + 7);
            position += weekWidth;
            weekIndex++;
        }

        // 月境界線と数字の描画（開始月から終了月まで）
        const baseISO = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-${String(startDate.getDate()).padStart(2,'0')}`;
        const monthIter = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        while (monthIter <= lastMonth) {
            const mStart = new Date(monthIter.getFullYear(), monthIter.getMonth(), 1);
            const wStart = Math.floor(DateUtil.getDaysBetween(baseISO, `${mStart.getFullYear()}-${String(mStart.getMonth()+1).padStart(2,'0')}-01`) / 7);
            const left = Math.max(0, wStart * weekWidth);
            const divider = document.createElement('div');
            divider.className = 'month-divider';
            divider.style.left = `${left}px`;
            track.appendChild(divider);
            const num = document.createElement('div');
            num.className = 'month-number';
            num.style.left = `${left}px`;
            num.textContent = `${mStart.getMonth()+1}`;
            ruler.appendChild(num);
            monthIter.setMonth(monthIter.getMonth()+1);
        }
        
        // 現在地ライン
        const monthsFromStart = DateUtil.getDaysBetween(startDate.toISOString().slice(0,10), `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`) / 7;
        const currentLine = document.createElement('div');
        currentLine.className = 'current-line';
        currentLine.style.left = `${monthsFromStart * monthWidth}px`;
        track.appendChild(currentLine);
        if (timeline) timeline.dataset.currentX = String(monthsFromStart * monthWidth);
        // 今日の日付（トラック上のラベルは非表示にする）
        const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        // 上部バーにも今日バッジを表示
        const todayBadge = document.getElementById('todayBadge');
        if (todayBadge) {
            todayBadge.innerHTML = `<span class="today-badge">今日 ${DateUtil.formatForDisplay(todayISO,'day')}</span>`;
        }
        
        // 期日ピン
        const duePin = document.createElement('div');
        duePin.className = 'due-date-pin';
        const daysToDue = DateUtil.daysUntil(vision.dueDate);
        const dueSuffix = daysToDue >= 0 ? `（あと${daysToDue}日）` : `（${Math.abs(daysToDue)}日超過）`;
        duePin.textContent = `期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}${dueSuffix}`;
        timeline.appendChild(duePin);
        
        // マイルストーンの描画（位置は保存されたyを尊重）
        vision.milestones.forEach((milestone) => {
            const element = this.createMilestoneElement(milestone, startDate, monthWidth);
            track.appendChild(element);
            this.decorateMilestoneETA(element, milestone, startDate, monthWidth, monthsFromStart*monthWidth, track);
        });
        
        track.style.width = `${position}px`;
        ruler.style.width = `${position}px`;

        // ラベルの見切れ補正
        setTimeout(() => UI.adjustAllMilestoneLabels(), 0);
    }
    
    static createMilestoneElement(milestone, baseDate, monthWidth) {
        const element = document.createElement('div');
        element.className = 'milestone';
        element.dataset.id = milestone.id;
        
        const startDate = new Date(milestone.startDate);
        const weeksFromBase = DateUtil.getDaysBetween(baseDate.toISOString().slice(0,10), milestone.startDate) / 7;
        const leftPosition = weeksFromBase * monthWidth;
        
        element.style.left = `${leftPosition}px`;
        element.classList.add(`type-${milestone.type}`);
        element.dataset.type = milestone.type;
        // カラーパレットを選択制で適用
        const colorIdx = Math.max(0, Math.min(9, parseInt(milestone.color) || 0));
        element.classList.add(`ms-color-${colorIdx}`);
        // Y位置（保存値が無ければデフォルト）
        const defaultTop = 120;
        element.style.top = `${typeof milestone.y === 'number' ? milestone.y : defaultTop}px`;
        
        if (milestone.type === 'range' && milestone.endDate) {
            const endDate = new Date(milestone.endDate);
            const duration = DateUtil.getDaysBetween(milestone.startDate, milestone.endDate) / 7;
            element.innerHTML = `
                <div class="milestone-bar" style="width: ${duration * monthWidth}px;">
                    <div class="milestone-resize left"></div>
                    <div class="milestone-resize right"></div>
                </div>
                <div class="milestone-label">${milestone.title}</div>
            `;
        } else {
            element.innerHTML = `
                <div class="milestone-dot"></div>
                <div class="milestone-label">${milestone.title}</div>
            `;
        }
        
        return element;
    }

    static adjustAllMilestoneLabels() {
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        const trackRect = track.getBoundingClientRect();
        document.querySelectorAll('.milestone .milestone-label').forEach(label => {
            // 初期化
            label.style.marginLeft = '0px';
            label.style.maxWidth = '';
            const rect = label.getBoundingClientRect();
            // 左はみ出し
            const leftOverflow = Math.floor((trackRect.left + 8) - rect.left);
            if (leftOverflow > 0) {
                label.style.marginLeft = `${leftOverflow}px`;
            }
            // 右はみ出し
            const allowedRight = trackRect.right - 8;
            if (rect.right > allowedRight) {
                const allowedWidth = Math.max(80, Math.floor(allowedRight - rect.left));
                label.style.maxWidth = `${allowedWidth}px`;
            }
        });

        // 残日数バッジのはみ出し補正
        document.querySelectorAll('.milestone .eta-badge').forEach(badge => {
            badge.style.marginLeft = '0px';
            const rect = badge.getBoundingClientRect();
            const leftOverflow = Math.floor((trackRect.left + 8) - rect.left);
            const rightOverflow = Math.floor(rect.right - (trackRect.right - 8));
            if (leftOverflow > 0) {
                badge.style.marginLeft = `${leftOverflow}px`;
            } else if (rightOverflow > 0) {
                badge.style.marginLeft = `${-rightOverflow}px`;
            }
        });
    }

    static decorateMilestoneETA(element, milestone, baseDate, monthWidth, currentX, track) {
        const targetISO = milestone.type === 'range' && milestone.endDate ? milestone.endDate : milestone.startDate;
        if (!targetISO) return;
        const days = DateUtil.daysUntil(targetISO);
        // バッジ
        const badge = document.createElement('span');
        badge.className = `eta-badge ${days >= 0 ? 'future' : 'past'}`;
        badge.textContent = days >= 0 ? `あと${days}日` : `${Math.abs(days)}日超過`;
        element.appendChild(badge);
        // 点線接続は不要のため描画しない
    }
    
    static attachHomeListeners() {
        document.getElementById('addVision').addEventListener('click', () => {
            this.showVisionModal();
        });
        const addHead = document.getElementById('addVisionHeader');
        if (addHead) addHead.addEventListener('click', () => this.showVisionModal());
        
        document.getElementById('exportData').addEventListener('click', () => {
            DataPorter.exportData(stateManager.state);
        });
        
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const mode = confirm('既存データを置き換えますか？\n' +
                    'OK: 置き換え / キャンセル: マージ') ? 'replace' : 'merge';
                
                const imported = await DataPorter.importData(file, mode);
                
                if (mode === 'replace') {
                    stateManager.state = imported;
                } else {
                    const strategy = prompt('ID衝突時の処理:\n' +
                        '1: 上書き (overwrite)\n' +
                        '2: スキップ (skip)\n' +
                        '3: 複製 (duplicate)', 'skip');
                    stateManager.state = DataPorter.mergeData(
                        stateManager.state, imported, strategy
                    );
                }
                
                stateManager.notify();
                UI.renderApp();
            } catch (error) {
                alert(`インポートエラー: ${error}`);
            }
            
            e.target.value = '';
        });
        
        document.querySelectorAll('.vision-card').forEach(card => {
            let clickTimer = null;
            card.addEventListener('click', () => {
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    stateManager.state.currentVisionId = card.dataset.id;
                    UI.renderApp();
                }, 250);
            });
            card.addEventListener('dblclick', (e) => {
                e.preventDefault();
                clearTimeout(clickTimer);
                const id = card.dataset.id;
                const vision = stateManager.state.visions.find(v => v.id === id);
                this.showVisionModal(vision);
            });
        });
    }
    
    static attachTimelineListeners() {
        document.getElementById('backToHome').addEventListener('click', () => {
            stateManager.state.currentVisionId = null;
            UI.renderApp();
        });
        
        document.getElementById('addMilestone').addEventListener('click', () => {
            this.showMilestoneModal();
        });
        
        const zoom = document.getElementById('zoomRange');
        if (zoom) {
            zoom.addEventListener('input', (e) => {
                stateManager.state.zoom = parseInt(e.target.value, 10) || 100;
                stateManager.save();
                this.renderApp();
            });
        }

        // ラベル見切れ補正（スクロール・リサイズ時）
        const timeline = document.getElementById('timeline');
        let adjustTimer = null;
        const scheduleAdjust = () => {
            if (adjustTimer) cancelAnimationFrame(adjustTimer);
            adjustTimer = requestAnimationFrame(() => UI.adjustAllMilestoneLabels());
        };
        if (timeline) timeline.addEventListener('scroll', scheduleAdjust);
        window.addEventListener('resize', scheduleAdjust);
        
        // マイルストーンのドラッグ機能（クリック=詳細、ドラッグ=移動）
        const timelineEl = document.getElementById('timeline');
        // Mobile bottom bar actions
        const addMsBtn = document.getElementById('mobileAddMilestone');
        if (addMsBtn) addMsBtn.addEventListener('click', () => this.showMilestoneModal());
        const jumpBtn = document.getElementById('mobileJumpToday');
        if (jumpBtn) jumpBtn.addEventListener('click', () => {
            const tl = document.getElementById('timeline');
            if (!tl) return;
            const x = parseFloat(tl.dataset.currentX || '0');
            tl.scrollTo({ left: Math.max(0, x - tl.clientWidth * 0.5), behavior: 'smooth' });
        });
        document.querySelectorAll('.milestone').forEach(milestone => {
            let isDragging = false;
            let isResizing = false;
            let resizeSide = null;
            let startX = 0;
            let startY = 0;
            let startLeft = 0;
            let startTop = 0;
            let startWidth = 0;
            let moved = false;
            let pressed = false;
            const monthWidth = Math.max(20, Math.min(40, Math.round((stateManager.state.zoom || 100)/4)));
            
            // リサイズハンドル
            const resizeHandles = milestone.querySelectorAll('.milestone-resize');
            resizeHandles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    resizeSide = handle.classList.contains('left') ? 'left' : 'right';
                    startX = e.clientX;
                    startLeft = parseInt(milestone.style.left);
                    const bar = milestone.querySelector('.milestone-bar');
                    startWidth = bar ? parseInt(bar.style.width) : 0;
                    document.body.classList.add('dragging');
                    e.stopPropagation();
                    e.preventDefault();
                });
            });
            
            // マウスイベント
            milestone.addEventListener('mousedown', (e) => {
                if (e.target.closest('.milestone-resize')) return;
                isDragging = false; // しきい値超過までドラッグ扱いにしない
                moved = false;
                pressed = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(milestone.style.left);
                startTop = parseInt(milestone.style.top);
                milestone.style.cursor = 'grabbing';
                if (timelineEl) timelineEl.classList.add('no-scroll');
                document.body.classList.add('dragging');
                e.preventDefault();
            });
            
            // タッチイベント
            milestone.addEventListener('touchstart', (e) => {
                if (e.target.closest('.milestone-resize')) return;
                isDragging = false;
                moved = false;
                pressed = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startLeft = parseInt(milestone.style.left);
                startTop = parseInt(milestone.style.top);
                if (timelineEl) timelineEl.classList.add('no-scroll');
                document.body.classList.add('dragging');
                e.preventDefault();
            });
            
            // マウス移動
            const handleMove = (clientX, clientY) => {
                if (isResizing) {
                    const deltaX = clientX - startX;
                    const bar = milestone.querySelector('.milestone-bar');
                    
                    if (resizeSide === 'left') {
                        const newLeft = Math.max(0, startLeft + deltaX);
                        const newWidth = Math.max(monthWidth, startWidth - deltaX);
                        milestone.style.left = `${newLeft}px`;
                        bar.style.width = `${newWidth}px`;
                    } else {
                        const newWidth = Math.max(monthWidth, startWidth + deltaX);
                        bar.style.width = `${newWidth}px`;
                    }
                } else {
                    const deltaX = clientX - startX;
                    const deltaY = clientY - startY;
                    if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                        isDragging = true;
                    }
                    if (isDragging) {
                        moved = true;
                        const newLeft = Math.max(0, startLeft + deltaX);
                        milestone.style.left = `${newLeft}px`;
                        const timeline = document.getElementById('timeline');
                        const maxY = Math.max(0, (timeline ? timeline.clientHeight - 60 : 540));
                        const newTop = Math.min(Math.max(60, startTop + deltaY), maxY);
                        milestone.style.top = `${newTop}px`;
                    }
                }
            };
            
            let rafId = null;
            document.addEventListener('mousemove', (e) => {
                if (pressed || isResizing) {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        handleMove(e.clientX, e.clientY);
                    });
                }
            });
            
            if (timelineEl) {
                timelineEl.addEventListener('touchmove', (e) => {
                    if (pressed || isResizing) {
                        if (rafId) cancelAnimationFrame(rafId);
                        rafId = requestAnimationFrame(() => {
                            handleMove(e.touches[0].clientX, e.touches[0].clientY);
                        });
                        e.preventDefault();
                    }
                }, { passive: false });
            }
            
            // 終了処理（クリックは詳細表示、移動/リサイズ時のみ更新）
            const handleEnd = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                if (!pressed) return; // このマイルストーンでの操作でなければ無視
                if (isResizing || moved) {
                    const visionId = stateManager.state.currentVisionId;
                    const vision = stateManager.state.visions.find(v => v.id === visionId);
                    const ms = vision.milestones.find(m => m.id === milestone.dataset.id);
                    
                    const baseDate = new Date();
                    baseDate.setDate(1);
                    
                    // 新しい開始日を計算
                    const weeksOffset = Math.round(parseInt(milestone.style.left) / monthWidth);
                    const newStartDate = new Date(baseDate);
                    newStartDate.setDate(newStartDate.getDate() + (weeksOffset * 7));
                    
                    let updates = {};
                    
                    if (ms.type === 'range') {
                        const bar = milestone.querySelector('.milestone-bar');
                        const duration = Math.round(parseInt(bar.style.width) / monthWidth);
                        const newEndDate = new Date(newStartDate);
                        newEndDate.setDate(newEndDate.getDate() + (duration * 7));
                        
                        updates.startDate = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
                        updates.endDate = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-${String(newEndDate.getDate()).padStart(2, '0')}`;
                    } else if (ms.type === 'day') {
                        updates.startDate = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
                    }
                    // Y位置を保存
                    updates.y = parseInt(milestone.style.top) || 120;
                    
                    stateManager.updateMilestone(visionId, milestone.dataset.id, updates);
                    UI.adjustAllMilestoneLabels();
                } else {
                    // クリック扱い: 詳細モーダルを開く
                    const visionId = stateManager.state.currentVisionId;
                    const vision = stateManager.state.visions.find(v => v.id === visionId);
                    const ms = vision.milestones.find(m => m.id === milestone.dataset.id);
                    this.showMilestoneModal(ms);
                }
                // 共通の後処理
                isDragging = false;
                isResizing = false;
                moved = false;
                pressed = false;
                resizeSide = null;
                milestone.style.cursor = 'move';
                document.body.classList.remove('dragging');
                if (timelineEl) timelineEl.classList.remove('no-scroll');
            };
            
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
            
            // クリックはhandleEndで処理（モーダル表示）
        });
    }
    
    static showMilestoneModal(milestone = null) {
        const isEdit = !!milestone;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${isEdit ? 'マイルストーンを編集' : '新しいマイルストーン'}</h2>
                <label>タイトル</label>
                <input type="text" id="msTitle" value="${milestone?.title || ''}">
                
                <label>タイプ</label>
                <select id="msType">
                    <option value="day" ${milestone?.type === 'day' ? 'selected' : ''}>単日</option>
                    <option value="range" ${milestone?.type === 'range' ? 'selected' : ''}>期間</option>
                </select>
                
                <label>開始日</label>
                <input type="date" 
                       id="msStartDate" 
                       value="${milestone?.startDate || ''}">
                
                <div id="endDateContainer" style="${milestone?.type === 'range' ? '' : 'display:none'}">
                    <label>終了日</label>
                    <input type="date" id="msEndDate" 
                           value="${milestone?.endDate || ''}">
                </div>
                
                <label>カラー</label>
                <div class="color-palette" id="msColorPalette">
                    ${Array.from({length: 10}).map((_,i)=>`<button type="button" class="color-swatch ms-color-${i} ${ (milestone?.color ?? 0)===i ? 'selected' : '' }" data-color="${i}"></button>`).join('')}
                </div>
                
                <label>詳細説明</label>
                <textarea id="msDescription" rows="10" 
                          placeholder="自由に記述できます（文字数制限なし）">${milestone?.description || ''}</textarea>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button id="saveMs">保存</button>
                    <button id="cancelMs" style="background: #666;">キャンセル</button>
                    ${isEdit ? '<button id="deleteMs" style="background: #d32f2f;">削除</button>' : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        document.body.classList.add('modal-open');
        const content = modal.querySelector('.modal-content');
        const closeModal = () => { modal.remove(); document.body.classList.remove('modal-open'); };
        // 背景クリックで閉じる
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        // コンテンツ内クリックは伝播させない
        if (content) content.addEventListener('click', (e) => e.stopPropagation());
        // ESCで閉じる
        const escHandler = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } };
        document.addEventListener('keydown', escHandler);
        
        // タイプ変更時の表示制御
        document.getElementById('msType').addEventListener('change', (e) => {
            document.getElementById('endDateContainer').style.display = 
                e.target.value === 'range' ? '' : 'none';
        });
        
        // カラーパレット
        let selectedColor = typeof milestone?.color === 'number' ? milestone.color : 0;
        const palette = document.getElementById('msColorPalette');
        if (palette) {
            palette.querySelectorAll('.color-swatch').forEach(btn => {
                btn.addEventListener('click', () => {
                    palette.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedColor = parseInt(btn.dataset.color) || 0;
                });
            });
        }
        
        // 保存
        document.getElementById('saveMs').addEventListener('click', () => {
            const title = document.getElementById('msTitle').value;
            const type = document.getElementById('msType').value;
            const startDate = document.getElementById('msStartDate').value;
            const endDate = document.getElementById('msEndDate').value;
            const description = document.getElementById('msDescription').value;
            
            if (!title || !startDate) {
                alert('タイトルと開始日は必須です');
                return;
            }
            
            const visionId = stateManager.state.currentVisionId;
            
            if (isEdit) {
                stateManager.updateMilestone(visionId, milestone.id, {
                    title, type, startDate, endDate, description, color: selectedColor
                });
            } else {
                stateManager.addMilestone(visionId, type, startDate, endDate, title, description, selectedColor);
            }
            
            closeModal();
            UI.renderApp();
        });
        
        // キャンセル
        document.getElementById('cancelMs').addEventListener('click', () => { closeModal(); });
        
        // 削除（取り消し機能付き）
        if (isEdit) {
            document.getElementById('deleteMs').addEventListener('click', () => {
                if (confirm('このマイルストーンを削除しますか？')) {
                    const visionId = stateManager.state.currentVisionId;
                    const vision = stateManager.state.visions.find(v => v.id === visionId);
                    const msData = vision.milestones.find(m => m.id === milestone.id);
                    
                    // 削除データを保存
                    this.deletedItem = {
                        type: 'milestone',
                        visionId: visionId,
                        data: { ...msData }
                    };
                    
                    stateManager.deleteMilestone(visionId, milestone.id);
                    closeModal();
                    UI.renderApp();
                    
                    // 取り消しトースト表示
                    this.showUndoToast();
                }
            });
        }
        
        // 自動保存（説明欄）
        let saveTimer;
        document.getElementById('msDescription').addEventListener('input', () => {
            if (!isEdit) return;
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                const visionId = stateManager.state.currentVisionId;
                stateManager.updateMilestone(visionId, milestone.id, {
                    description: document.getElementById('msDescription').value
                });
            }, 1000);
        });
    }
    
    static showVisionModal(vision = null) {
        const isEdit = !!vision;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        
        // 今日の日付をデフォルトに
        const today = new Date();
        const defaultDate = vision ? vision.dueDate : 
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${isEdit ? 'ビジョンを編集' : '新しいビジョンを作成'}</h2>
                
                <label>タイトル</label>
                <input type="text" id="visionTitle" value="${vision?.title || ''}" 
                       placeholder="例: 新しいプロジェクトを完成させる">
                
                <label>期日</label>
                <input type="date" id="visionDueDate" value="${defaultDate}">
                
                <div style="margin-top: 24px; display: flex; gap: 12px;">
                    <button id="saveVision" style="flex: 1;">保存</button>
                    <button id="cancelVision" style="flex: 1; background: #6B7280;">キャンセル</button>
                    ${isEdit ? '<button id="deleteVision" style="flex: 1; background: #EF4444;">削除</button>' : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 保存
        document.getElementById('saveVision').addEventListener('click', () => {
            const title = document.getElementById('visionTitle').value;
            const dueDate = document.getElementById('visionDueDate').value;
            
            if (!title || !dueDate) {
                alert('タイトルと期日は必須です');
                return;
            }
            
            if (isEdit) {
                stateManager.updateVision(vision.id, { title, dueDate });
            } else {
                stateManager.addVision(title, dueDate);
            }
            
            modal.remove();
            document.body.classList.remove('modal-open');
            UI.renderApp();
        });
        
        // キャンセル
        document.getElementById('cancelVision').addEventListener('click', () => {
            modal.remove();
            document.body.classList.remove('modal-open');
        });
        
        // 削除（ダブルクリックのためのモーダル内操作）
        if (isEdit) {
            const del = document.getElementById('deleteVision');
            if (del) {
                del.addEventListener('click', () => {
                    if (confirm('このビジョンを削除しますか？')) {
                        // 削除データを保存（取り消し対応）
                        UI.deletedItem = {
                            type: 'vision',
                            data: { ...vision, milestones: [...vision.milestones] }
                        };
                        stateManager.deleteVision(vision.id);
                        modal.remove();
                        document.body.classList.remove('modal-open');
                        UI.renderApp();
                        UI.showUndoToast();
                    }
                });
            }
        }

        // ESCキーで閉じる
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.classList.remove('modal-open');
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    static showUndoToast() {
        // 既存のトーストを削除
        const existing = document.querySelector('.undo-toast');
        if (existing) existing.remove();
        
        // タイマーをクリア
        if (this.undoTimer) {
            clearTimeout(this.undoTimer);
        }
        
        // トースト作成
        const toast = document.createElement('div');
        toast.className = 'undo-toast';
        toast.innerHTML = `
            <span>削除しました</span>
            <button id="undoBtn">取り消し</button>
        `;
        document.body.appendChild(toast);
        
        // 取り消しボタン
        document.getElementById('undoBtn').addEventListener('click', () => {
            if (this.deletedItem) {
                if (this.deletedItem.type === 'milestone') {
                    const vision = stateManager.state.visions.find(
                        v => v.id === this.deletedItem.visionId
                    );
                    if (vision) {
                        vision.milestones.push(this.deletedItem.data);
                        stateManager.notify();
                        UI.renderApp();
                    }
                } else if (this.deletedItem.type === 'vision') {
                    stateManager.state.visions.push(this.deletedItem.data);
                    stateManager.notify();
                    UI.renderApp();
                }
                this.deletedItem = null;
            }
            toast.remove();
            clearTimeout(this.undoTimer);
        });
        
        // 2秒後に自動削除
        this.undoTimer = setTimeout(() => {
            toast.remove();
            this.deletedItem = null;
        }, 2000);
    }
    
    static showError(message) {
        alert(`エラー: ${message}`);
    }
    
    static showWarning(message) {
        alert(`警告: ${message}`);
    }
}

// ===== Application Bootstrap =====
const stateManager = new StateManager();

document.addEventListener('DOMContentLoaded', () => {
    stateManager.load();
    // 初期表示は必ずホームにする
    stateManager.state.currentVisionId = null;
    // 常時ライトモードへ統一（永続状態を上書き）
    stateManager.state.theme = 'light';
    stateManager.save();
    stateManager.subscribe(() => UI.renderApp());
    UI.init();
    
    // Service Worker登録（PWA対応）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/voyage-x/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    }
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + S: データエクスポート
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            DataPorter.exportData(stateManager.state);
        }
        
        // Cmd/Ctrl + N: 新規追加
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
            e.preventDefault();
            if (!stateManager.state.currentVisionId) {
                // ホーム画面なら新規ビジョン
                UI.showVisionModal();
            } else {
                // 年表画面なら新規マイルストーン
                UI.showMilestoneModal();
            }
        }
        
        // Cmd/Ctrl + T: テーマ切替
        if ((e.metaKey || e.ctrlKey) && e.key === 't') {
            e.preventDefault();
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.click();
        }
        
        // ESC: ホームに戻る
        if (e.key === 'Escape') {
            if (stateManager.state.currentVisionId) {
                stateManager.state.currentVisionId = null;
                UI.renderApp();
            }
        }
    });
});

// キャッシュ強制クリア（常時）
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => {
            caches.delete(name);
            console.log(`Cache cleared: ${name}`);
        });
    });
}

// Service Workerも更新
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.update();
        });
    });
}
