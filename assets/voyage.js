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
    addVision(title, dueDate, completionNote = '') {
        const vision = {
            id: this.generateId('vision'),
            title,
            dueDate: DateUtil.normalizeToISO(dueDate, 'day'),
            completionNote: completionNote || '',
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
                    <div class="brand" id="brandButton"><span class="brand-mark"></span>Voyage</div>
                    <div class="header-actions">
                        <button id="addVisionHeader">新しいビジョン</button>
                    </div>
                    <div class="brand-menu" id="brandMenu" aria-hidden="true">
                        <button id="menuExport">📥 データをエクスポート</button>
                        <button id="menuImport">📤 データをインポート</button>
                        <input type="file" id="importFileBrand" accept=".json" hidden>
                    </div>
                </div>
            </header>
            <div class="container">
                <div class="hero">
                    <h1>Voyage</h1>
                    <p>あなたの目標への道のりを美しく可視化</p>
                    <button class="hero-button" id="addVision">✨ 新しいビジョンを作成</button>
                </div>
                <div class="vision-labels" id="visionLabels"></div>
                <div class="visions-grid" id="visionList"></div>
            </div>
        `;
        
        this.renderVisionLabels();
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
        
        const visions = UI.getVisionsSortedByProximity();
        list.innerHTML = visions.map(vision => {
            const days = DateUtil.daysUntil(vision.dueDate);
            const daysClass = days >= 0 ? 'future' : 'past';
            const iso = vision.dueDate || '';
            const [yy, mm = '', dd = ''] = iso.split('-');
            const dueShort = yy && mm && dd ? `${yy}/${String(mm).padStart(2,'0')}/${String(dd).padStart(2,'0')}` : DateUtil.formatForDisplay(vision.dueDate, 'day');
            const note = (vision.completionNote || '').trim();
            const noteHtml = note ? `<div class="vision-card-note"><span class="note-icon">📝</span><span class="note-text">${note.replace(/\n/g,' ')}</span></div>` : '';
            return `
            <div class="vision-card animate-in" data-id="${vision.id}">
                <div class="vision-card-header">
                    <h2 title="${vision.title}">${vision.title}</h2>
                    <div class="days-badge ${daysClass}">
                        ${days >= 0 ? '<span class="label">あと</span>' : '<span class="label">超過</span>'}
                        <span class="num">${Math.abs(days)}</span><span class="unit">日</span>
                    </div>
                </div>
                <div class="vision-card-meta">
                    <span class="chip due">📅 ${dueShort}</span>
                    <span class="chip count">📍 ${vision.milestones.length}個</span>
                    <button class="vision-expand-btn" data-id="${vision.id}">
                        <span class="expand-icon">▼</span>
                        <span class="expand-text">詳細</span>
                    </button>
                </div>
                ${noteHtml}
            </div>`;
        }).join('');
    }

    static renderVisionLabels() {
        const wrap = document.getElementById('visionLabels');
        if (!wrap) return;
        if (stateManager.state.visions.length === 0) { wrap.innerHTML = ''; return; }
        const visions = UI.getVisionsSortedByProximity();
        wrap.innerHTML = visions.map(v => {
            const d = DateUtil.daysUntil(v.dueDate);
            const text = d >= 0 ? `あと${d}日` : `${Math.abs(d)}日超過`;
            const cls = d >= 0 ? 'future' : 'past';
            return `<button class="vision-chip" data-id="${v.id}"><span class="name">${v.title}</span><span class="delta ${cls}">${text}</span></button>`;
        }).join('');
    }

    static getVisionsSortedByProximity() {
        const arr = [...stateManager.state.visions];
        const today = new Date();
        const sISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const withDays = arr.map(v => ({ v, days: DateUtil.getDaysBetween(sISO, v.dueDate) }));
        const future = withDays.filter(x => x.days >= 0).sort((a,b) => a.days - b.days);
        const past = withDays.filter(x => x.days < 0).sort((a,b) => Math.abs(a.days) - Math.abs(b.days));
        return future.concat(past).map(x => x.v);
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
                    <div class="brand" style="gap:10px;">
                        <span class="brand-mark"></span>${vision.title}
                    </div>
                    <div class="header-actions"></div>
                </div>
            </header>
            <button class="edge-home" id="edgeHome" title="ホームへ">🏠</button>
            <div class="timeline-container">
                <div class="timeline-bar">
                    <div class="timeline-meta">期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}</div>
                    <div class="timeline-today" id="todayBadge"></div>
                    <div class="timeline-controls">
                        <button id="addMilestoneDesktop" class="add-ms-btn">＋ マイルストーン</button>
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
        
        // 期日ピン（ルーラー右上に配置して月数字と重なり回避）
        const daysToDue = DateUtil.daysUntil(vision.dueDate);
        const dueSuffix = daysToDue >= 0 ? `（あと${daysToDue}日）` : `（${Math.abs(daysToDue)}日超過）`;
        const existingPin = ruler.querySelector('.due-date-pin');
        if (existingPin) existingPin.remove();
        const duePin = document.createElement('div');
        duePin.className = 'due-date-pin';
        duePin.textContent = `期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}${dueSuffix}`;
        ruler.appendChild(duePin);
        
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

    static toggleMilestoneExpansion(card) {
        const visionId = card.dataset.id;
        const vision = stateManager.state.visions.find(v => v.id === visionId);
        
        // 既存の展開を確認
        let expansionContainer = card.querySelector('.milestone-expansion');
        
        if (expansionContainer) {
            // 既に展開されている場合は閉じる
            card.classList.remove('expanded');
            expansionContainer.style.maxHeight = '0';
            setTimeout(() => expansionContainer.remove(), 300);
            
            // ボタンを更新
            const expandBtn = card.querySelector('.vision-expand-btn');
            if (expandBtn) {
                expandBtn.querySelector('.expand-icon').textContent = '▼';
                expandBtn.querySelector('.expand-text').textContent = '詳細';
            }
            return;
        }
        
        // 他のカードの展開を閉じる
        document.querySelectorAll('.vision-card.expanded').forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.classList.remove('expanded');
                const otherExpansion = otherCard.querySelector('.milestone-expansion');
                if (otherExpansion) {
                    otherExpansion.style.maxHeight = '0';
                    setTimeout(() => otherExpansion.remove(), 300);
                }
                // 他のボタンもリセット
                const otherBtn = otherCard.querySelector('.vision-expand-btn');
                if (otherBtn) {
                    otherBtn.querySelector('.expand-icon').textContent = '▼';
                    otherBtn.querySelector('.expand-text').textContent = '詳細';
                }
            }
        });
        
        // 展開コンテナを作成
        expansionContainer = document.createElement('div');
        expansionContainer.className = 'milestone-expansion';
        
        if (vision.milestones.length === 0) {
            expansionContainer.innerHTML = `
                <div class="milestone-expansion-empty">
                    <span class="milestone-empty-icon">🎯</span>
                    <p>マイルストーンを追加して、目標達成への道筋を可視化しましょう</p>
                    <button class="milestone-add-btn-inline">+ マイルストーンを追加</button>
                </div>
            `;
            
            const addBtn = expansionContainer.querySelector('.milestone-add-btn-inline');
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    stateManager.state.currentVisionId = vision.id;
                    UI.showMilestoneModal();
                });
            }
        } else {
            // タイムラインボタン
            const timelineBtn = document.createElement('div');
            timelineBtn.className = 'milestone-timeline-btn-wrapper';
            timelineBtn.innerHTML = `
                <button class="milestone-timeline-btn">
                    <span class="timeline-icon">📊</span>
                    <span>タイムラインで詳細を見る</span>
                </button>
            `;
            timelineBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                stateManager.state.currentVisionId = vision.id;
                try { history.pushState({ view: 'timeline', visionId: vision.id }, '', '#v/' + vision.id); } catch {}
                UI.renderApp();
            });
            expansionContainer.appendChild(timelineBtn);
            
            // マイルストーンリスト
            const milestoneList = document.createElement('div');
            milestoneList.className = 'milestone-list';
            
            // マイルストーンをソート（開始日順）
            const sortedMilestones = [...vision.milestones].sort((a, b) => {
                const dateA = new Date(a.startDate || '9999-12-31');
                const dateB = new Date(b.startDate || '9999-12-31');
                return dateA - dateB;
            });
            
            sortedMilestones.forEach((milestone, index) => {
                const item = document.createElement('div');
                item.className = 'milestone-item';
                
                const startDays = DateUtil.daysUntil(milestone.startDate);
                const endDays = DateUtil.daysUntil(milestone.endDate || milestone.startDate);
                const progress = this.calculateProgress(milestone.startDate, milestone.endDate);
                
                // カラーパレット
                const colors = [
                    { primary: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6' },
                    { primary: '#DC2626', light: '#FEE2E2', dark: '#991B1B' },
                    { primary: '#059669', light: '#D1FAE5', dark: '#047857' },
                    { primary: '#F59E0B', light: '#FEF3C7', dark: '#D97706' },
                    { primary: '#3B82F6', light: '#DBEAFE', dark: '#1D4ED8' },
                    { primary: '#EC4899', light: '#FCE7F3', dark: '#BE185D' },
                    { primary: '#8B5CF6', light: '#EDE9FE', dark: '#6D28D9' },
                    { primary: '#10B981', light: '#D1FAE5', dark: '#059669' }
                ];
                
                const color = colors[milestone.color || 0];
                
                // ステータスの判定
                let statusIcon, statusText, statusClass;
                if (startDays > 0) {
                    // 開始前は期間を表示（単日は「〜NaN」回避して「〜まで」表記）
                    statusIcon = '⏳';
                    if (!milestone.endDate || milestone.type === 'day') {
                        statusText = `${startDays}日後まで`;
                    } else {
                        const duration = DateUtil.getDaysBetween(milestone.startDate, milestone.endDate);
                        const endInDays = startDays + Math.max(0, duration);
                        statusText = `${startDays}日後〜${endInDays}日後`;
                    }
                    statusClass = 'future';
                } else if (endDays < 0) {
                    statusIcon = '✅';
                    statusText = `完了`;
                    statusClass = 'completed';
                } else {
                    statusIcon = '🔥';
                    statusText = `あと${endDays}日`;
                    statusClass = 'active';
                }
                
                item.innerHTML = `
                    <div class="milestone-item-header">
                        <div class="milestone-number" style="background: ${color.light}; color: ${color.dark};">${index + 1}</div>
                        <div class="milestone-item-content">
                            <h4 class="milestone-item-title">${milestone.title}</h4>
                            <div class="milestone-item-meta">
                                <span class="milestone-period">
                                    ${DateUtil.formatForDisplay(milestone.startDate, 'day')} 〜 ${DateUtil.formatForDisplay(milestone.endDate, 'day')}
                                </span>
                                <span class="milestone-status ${statusClass}">
                                    <span class="status-icon">${statusIcon}</span>
                                    <span class="status-text">${statusText}</span>
                                </span>
                            </div>
                            ${milestone.description ? `<p class="milestone-item-desc">${milestone.description}</p>` : ''}
                        </div>
                        <div class="milestone-item-actions">
                            <button class="milestone-edit-btn" data-id="${milestone.id}">
                                <span class="edit-icon">✏️</span>
                            </button>
                        </div>
                    </div>
                    <div class="milestone-progress-bar">
                        <div class="milestone-progress-track">
                            <div class="milestone-progress-fill" style="width: ${progress}%; background: linear-gradient(90deg, ${color.primary}, ${color.dark});"></div>
                        </div>
                        <span class="milestone-progress-text">${progress}%</span>
                    </div>
                `;
                
                // 編集ボタン
                const editBtn = item.querySelector('.milestone-edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        stateManager.state.currentVisionId = vision.id;
                        const ms = vision.milestones.find(m => m.id === editBtn.dataset.id);
                        UI.showMilestoneModal(ms);
                    });
                }
                
                // アイテムクリックでも編集
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.milestone-edit-btn')) {
                        e.stopPropagation();
                        stateManager.state.currentVisionId = vision.id;
                        UI.showMilestoneModal(milestone);
                    }
                });
                
                milestoneList.appendChild(item);
            });
            
            expansionContainer.appendChild(milestoneList);
            
            // 新規追加ボタン
            const addButton = document.createElement('div');
            addButton.className = 'milestone-add-footer';
            addButton.innerHTML = `
                <button class="milestone-add-btn-inline">
                    <span class="add-icon">+</span>
                    <span>新しいマイルストーンを追加</span>
                </button>
            `;
            addButton.addEventListener('click', (e) => {
                e.stopPropagation();
                stateManager.state.currentVisionId = vision.id;
                UI.showMilestoneModal();
            });
            expansionContainer.appendChild(addButton);
        }
        
        // カードに追加してアニメーション
        card.appendChild(expansionContainer);
        card.classList.add('expanded');
        
        // 高さをアニメーション
        requestAnimationFrame(() => {
            expansionContainer.style.maxHeight = expansionContainer.scrollHeight + 'px';
        });
    }
    
    static calculateProgress(startDate, endDate) {
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (today < start) return 0;
        if (today > end) return 100;
        
        const total = end - start;
        const elapsed = today - start;
        return Math.round((elapsed / total) * 100);
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
        
        // 左上ブランドメニュー（インポート/エクスポート）
        const brandBtn = document.getElementById('brandButton');
        const brandMenu = document.getElementById('brandMenu');
        const toggleMenu = (open) => {
            const willOpen = typeof open === 'boolean' ? open : !brandMenu.classList.contains('open');
            brandMenu.classList.toggle('open', willOpen);
            brandMenu.setAttribute('aria-hidden', String(!willOpen));
        };
        if (brandBtn && brandMenu) {
            brandBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
            brandMenu.addEventListener('click', (e) => e.stopPropagation());
            document.addEventListener('click', () => toggleMenu(false));
        }
        const menuExport = document.getElementById('menuExport');
        const menuImport = document.getElementById('menuImport');
        const importFileBrand = document.getElementById('importFileBrand');
        if (menuExport) menuExport.addEventListener('click', () => { DataPorter.exportData(stateManager.state); toggleMenu(false); });
        if (menuImport) menuImport.addEventListener('click', () => importFileBrand && importFileBrand.click());
        if (importFileBrand) importFileBrand.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const mode = confirm('既存データを置き換えますか？\nOK: 置き換え / キャンセル: マージ') ? 'replace' : 'merge';
                const imported = await DataPorter.importData(file, mode);
                if (mode === 'replace') {
                    stateManager.state = imported;
                } else {
                    const strategy = prompt('ID衝突時の処理:\n1: 上書き (overwrite)\n2: スキップ (skip)\n3: 複製 (duplicate)', 'skip');
                    stateManager.state = DataPorter.mergeData(stateManager.state, imported, strategy);
                }
                stateManager.notify();
                UI.renderApp();
            } catch (error) {
                alert(`インポートエラー: ${error}`);
            }
            e.target.value = '';
            toggleMenu(false);
        });
        
        // 上部ラベル（チップ）から対象カードへスクロール
        document.querySelectorAll('.vision-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const id = chip.getAttribute('data-id');
                const card = document.querySelector(`.vision-card[data-id="${id}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('flash');
                    setTimeout(() => card.classList.remove('flash'), 900);
                }
            });
        });
        
        // 展開ボタンのイベント
        document.querySelectorAll('.vision-expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.vision-card');
                this.toggleMilestoneExpansion(card);
                
                // ボタンのテキストとアイコンを更新
                const icon = btn.querySelector('.expand-icon');
                const text = btn.querySelector('.expand-text');
                if (card.classList.contains('expanded')) {
                    icon.textContent = '▲';
                    text.textContent = '閉じる';
                } else {
                    icon.textContent = '▼';
                    text.textContent = '詳細';
                }
            });
        });
        
        // カードのダブルクリックで編集
        document.querySelectorAll('.vision-card').forEach(card => {
            card.addEventListener('dblclick', (e) => {
                if (!e.target.closest('.vision-expand-btn') && !e.target.closest('.milestone-expansion')) {
                    e.preventDefault();
                    const id = card.dataset.id;
                    const vision = stateManager.state.visions.find(v => v.id === id);
                    this.showVisionModal(vision);
                }
            });
        });
    }
    
    static attachTimelineListeners() {
        const edgeHome = document.getElementById('edgeHome');
        if (edgeHome) edgeHome.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                stateManager.state.currentVisionId = null;
                UI.renderApp();
            }
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
        const addDeskBtn = document.getElementById('addMilestoneDesktop');
        if (addDeskBtn) addDeskBtn.addEventListener('click', () => this.showMilestoneModal());
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
                        // ドラッグ時は左右の移動を禁止（Xは固定）
                        // left は変更しない
                        const timeline = document.getElementById('timeline');
                        const maxY = Math.max(0, (timeline ? timeline.clientHeight - 60 : 540));
                        const newTop = Math.min(Math.max(0, startTop + deltaY), maxY);
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
                    
                    let updates = {};
                    
                    if (isResizing) {
                        // リサイズ時のみ日付を更新（ドラッグでは更新しない）
                        const baseDate = new Date();
                        baseDate.setDate(1);
                        // 新しい開始日を計算
                        const weeksOffset = Math.round(parseInt(milestone.style.left) / monthWidth);
                        const newStartDate = new Date(baseDate);
                        newStartDate.setDate(newStartDate.getDate() + (weeksOffset * 7));
                        
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
                    }
                    // 位置（Y）のみ常に保存
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
                
                <label style="margin-top: 12px;">達成時の詳細説明（任意）</label>
                <textarea id="visionCompletionNote" rows="4" placeholder="例: 達成時の状況、学び、次の一歩など" style="width: 100%; resize: vertical;">${(vision?.completionNote || '')}</textarea>
                
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
            const completionNote = (document.getElementById('visionCompletionNote')?.value || '').trim();
            
            if (!title || !dueDate) {
                alert('タイトルと期日は必須です');
                return;
            }
            
            if (isEdit) {
                stateManager.updateVision(vision.id, { title, dueDate, completionNote });
            } else {
                stateManager.addVision(title, dueDate, completionNote);
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
    // 戻るボタン（ブラウザ/端末）対応
    window.addEventListener('popstate', (e) => {
        const st = e.state || {};
        if (st.view === 'timeline' && st.visionId) {
            stateManager.state.currentVisionId = st.visionId;
        } else {
            stateManager.state.currentVisionId = null;
        }
        UI.renderApp();
    });
    
    // Service Worker登録（PWA対応）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
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
