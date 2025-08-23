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
    }
};

// ===== A2: State Management =====
class StateManager {
    constructor() {
        this.state = {
            version: "1.0.0",
            visions: [],
            currentVisionId: null,
            theme: 'dark'
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
    addMilestone(visionId, type, startDate, endDate, title, description = '') {
        const vision = this.state.visions.find(v => v.id === visionId);
        if (!vision) return null;
        
        const milestone = {
            id: this.generateId('ms'),
            type,
            startDate: DateUtil.normalizeToISO(startDate, type === 'month' ? 'month' : 'day'),
            endDate: type === 'range' ? DateUtil.normalizeToISO(endDate, 'day') : undefined,
            title,
            description
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
                milestone.startDate = DateUtil.normalizeToISO(updates.startDate, 
                    type === 'month' ? 'month' : 'day');
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
    
    static init() {
        // デフォルトをライトテーマに変更
        if (!stateManager.state.theme) {
            stateManager.state.theme = 'light';
        }
        document.body.setAttribute('data-theme', stateManager.state.theme);
        this.renderApp();
        this.addThemeToggle();
    }
    
    static renderApp() {
        const app = document.getElementById('app');
        
        if (!stateManager.state.currentVisionId) {
            this.renderHome(app);
        } else {
            this.renderTimeline(app);
        }
    }
    
    static addThemeToggle() {
        if (document.getElementById('themeToggle')) return;
        
        const toggle = document.createElement('div');
        toggle.id = 'themeToggle';
        toggle.className = 'theme-toggle';
        toggle.innerHTML = stateManager.state.theme === 'dark' ? '☀️' : '🌙';
        toggle.title = 'テーマを切り替え';
        
        toggle.addEventListener('click', () => {
            const newTheme = stateManager.state.theme === 'dark' ? 'light' : 'dark';
            stateManager.state.theme = newTheme;
            document.body.setAttribute('data-theme', newTheme);
            toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            stateManager.save();
        });
        
        document.body.appendChild(toggle);
    }
    
    static renderHome(container) {
        container.innerHTML = `
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
                <div class="vision-actions">
                    <button class="edit-vision" data-id="${vision.id}">編集</button>
                    <button class="delete-vision delete" data-id="${vision.id}">削除</button>
                </div>
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
            <div class="timeline-container">
                <div style="padding: 20px;">
                    <button id="backToHome">← ホームに戻る</button>
                    <h1>${vision.title}</h1>
                    <p>期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}</p>
                </div>
                <div class="timeline" id="timeline">
                    <div class="timeline-track" id="timelineTrack"></div>
                </div>
                <button id="addMilestone" style="margin: 20px;">マイルストーンを追加</button>
            </div>
        `;
        
        this.renderTimelineContent(vision);
        this.attachTimelineListeners();
    }
    
    static renderTimelineContent(vision) {
        const track = document.getElementById('timelineTrack');
        const timeline = document.getElementById('timeline');
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const endDate = new Date(vision.dueDate);
        endDate.setMonth(endDate.getMonth() + 6);
        
        // 月ラベルと四半期ラインの描画
        let currentDate = new Date(startDate);
        let position = 0;
        const monthWidth = 100; // px per month
        
        while (currentDate <= endDate) {
            // 月ラベル
            const label = document.createElement('div');
            label.className = 'month-label';
            label.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
            label.style.left = `${position}px`;
            track.appendChild(label);
            
            // 四半期ライン（1,4,7,10月）
            if ([0, 3, 6, 9].includes(currentDate.getMonth())) {
                const quarterLine = document.createElement('div');
                quarterLine.className = 'quarter-line';
                quarterLine.style.left = `${position}px`;
                track.appendChild(quarterLine);
            }
            
            currentDate.setMonth(currentDate.getMonth() + 1);
            position += monthWidth;
        }
        
        // 現在地ライン
        const monthsFromStart = DateUtil.getMonthsBetween(startDate, now);
        const currentLine = document.createElement('div');
        currentLine.className = 'current-line';
        currentLine.style.left = `${monthsFromStart * monthWidth}px`;
        track.appendChild(currentLine);
        
        // 期日ピン
        const duePin = document.createElement('div');
        duePin.className = 'due-date-pin';
        duePin.textContent = `期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}`;
        timeline.appendChild(duePin);
        
        // マイルストーンの描画
        vision.milestones.forEach(milestone => {
            const element = this.createMilestoneElement(milestone, startDate, monthWidth);
            track.appendChild(element);
        });
        
        track.style.width = `${position}px`;
    }
    
    static createMilestoneElement(milestone, baseDate, monthWidth) {
        const element = document.createElement('div');
        element.className = 'milestone';
        element.dataset.id = milestone.id;
        
        const startDate = new Date(milestone.startDate);
        const monthsFromBase = DateUtil.getMonthsBetween(baseDate, startDate);
        const leftPosition = monthsFromBase * monthWidth;
        
        element.style.left = `${leftPosition}px`;
        
        // 重なり回避のための高さ調整
        const existingMilestones = document.querySelectorAll('.milestone');
        let topPosition = 100;
        let foundPosition = false;
        
        while (!foundPosition && topPosition < 400) {
            foundPosition = true;
            for (const existing of existingMilestones) {
                const existingLeft = parseInt(existing.style.left);
                const existingTop = parseInt(existing.style.top);
                const existingWidth = existing.querySelector('.milestone-bar') ? 
                    parseInt(existing.querySelector('.milestone-bar').style.width) : 50;
                
                // 重なり判定
                if (Math.abs(existingTop - topPosition) < 40) {
                    const elementWidth = milestone.type === 'range' && milestone.endDate ? 
                        DateUtil.getMonthsBetween(startDate, new Date(milestone.endDate)) * monthWidth : 50;
                    
                    if ((leftPosition < existingLeft + existingWidth) && 
                        (leftPosition + elementWidth > existingLeft)) {
                        foundPosition = false;
                        topPosition += 50;
                        break;
                    }
                }
            }
        }
        
        element.style.top = `${topPosition}px`;
        
        if (milestone.type === 'range' && milestone.endDate) {
            const endDate = new Date(milestone.endDate);
            const duration = DateUtil.getMonthsBetween(startDate, endDate);
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
    
    static attachHomeListeners() {
        document.getElementById('addVision').addEventListener('click', () => {
            this.showVisionModal();
        });
        
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
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-vision') || 
                    e.target.classList.contains('delete-vision')) {
                    return;
                }
                stateManager.state.currentVisionId = card.dataset.id;
                UI.renderApp();
            });
        });
        
        document.querySelectorAll('.edit-vision').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const vision = stateManager.state.visions.find(v => v.id === id);
                this.showVisionModal(vision);
            });
        });
        
        document.querySelectorAll('.delete-vision').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('このビジョンを削除しますか？')) {
                    const vision = stateManager.state.visions.find(v => v.id === btn.dataset.id);
                    
                    // 削除データを保存
                    this.deletedItem = {
                        type: 'vision',
                        data: { ...vision, milestones: [...vision.milestones] }
                    };
                    
                    stateManager.deleteVision(btn.dataset.id);
                    UI.renderApp();
                    
                    // 取り消しトースト表示
                    this.showUndoToast();
                }
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
        
        // マイルストーンのドラッグ機能
        document.querySelectorAll('.milestone').forEach(milestone => {
            let isDragging = false;
            let isResizing = false;
            let resizeSide = null;
            let startX = 0;
            let startLeft = 0;
            let startWidth = 0;
            const monthWidth = 100;
            
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
                    e.stopPropagation();
                    e.preventDefault();
                });
            });
            
            // マウスイベント
            milestone.addEventListener('mousedown', (e) => {
                if (e.target.closest('.milestone-resize')) return;
                isDragging = true;
                startX = e.clientX;
                startLeft = parseInt(milestone.style.left);
                milestone.style.cursor = 'grabbing';
                e.preventDefault();
            });
            
            // タッチイベント
            milestone.addEventListener('touchstart', (e) => {
                if (e.target.closest('.milestone-resize')) return;
                isDragging = true;
                startX = e.touches[0].clientX;
                startLeft = parseInt(milestone.style.left);
                e.preventDefault();
            });
            
            // マウス移動
            const handleMove = (clientX) => {
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
                } else if (isDragging) {
                    const deltaX = clientX - startX;
                    const newLeft = Math.max(0, startLeft + deltaX);
                    milestone.style.left = `${newLeft}px`;
                }
            };
            
            let rafId = null;
            document.addEventListener('mousemove', (e) => {
                if (isDragging || isResizing) {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        handleMove(e.clientX);
                    });
                }
            });
            
            document.addEventListener('touchmove', (e) => {
                if (isDragging || isResizing) {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        handleMove(e.touches[0].clientX);
                    });
                    e.preventDefault();
                }
            });
            
            // 終了処理
            const handleEnd = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                if (isResizing || isDragging) {
                    const visionId = stateManager.state.currentVisionId;
                    const vision = stateManager.state.visions.find(v => v.id === visionId);
                    const ms = vision.milestones.find(m => m.id === milestone.dataset.id);
                    
                    const baseDate = new Date();
                    baseDate.setMonth(baseDate.getMonth() - 6);
                    
                    // 新しい開始日を計算
                    const monthsOffset = parseInt(milestone.style.left) / monthWidth;
                    const newStartDate = new Date(baseDate);
                    newStartDate.setMonth(newStartDate.getMonth() + Math.round(monthsOffset));
                    
                    let updates = {};
                    
                    if (ms.type === 'range') {
                        const bar = milestone.querySelector('.milestone-bar');
                        const duration = Math.round(parseInt(bar.style.width) / monthWidth);
                        const newEndDate = new Date(newStartDate);
                        newEndDate.setMonth(newEndDate.getMonth() + duration);
                        
                        updates.startDate = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-01`;
                        updates.endDate = `${newEndDate.getFullYear()}-${String(newEndDate.getMonth() + 1).padStart(2, '0')}-01`;
                    } else if (ms.type === 'day') {
                        updates.startDate = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}-${String(newStartDate.getDate()).padStart(2, '0')}`;
                    } else if (ms.type === 'month') {
                        updates.startDate = `${newStartDate.getFullYear()}-${String(newStartDate.getMonth() + 1).padStart(2, '0')}`;
                    }
                    
                    stateManager.updateMilestone(visionId, milestone.dataset.id, updates);
                    
                    isDragging = false;
                    isResizing = false;
                    resizeSide = null;
                    milestone.style.cursor = 'move';
                }
            };
            
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
            
            // ダブルクリックで詳細モーダル
            milestone.addEventListener('dblclick', () => {
                if (!isResizing) {
                    const id = milestone.dataset.id;
                    const visionId = stateManager.state.currentVisionId;
                    const vision = stateManager.state.visions.find(v => v.id === visionId);
                    const ms = vision.milestones.find(m => m.id === id);
                    this.showMilestoneModal(ms);
                }
            });
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
                    <option value="month" ${milestone?.type === 'month' ? 'selected' : ''}>月</option>
                    <option value="range" ${milestone?.type === 'range' ? 'selected' : ''}>期間</option>
                </select>
                
                <label>開始日</label>
                <input type="${milestone?.type === 'month' ? 'month' : 'date'}" 
                       id="msStartDate" 
                       value="${milestone?.startDate || ''}">
                
                <div id="endDateContainer" style="${milestone?.type === 'range' ? '' : 'display:none'}">
                    <label>終了日</label>
                    <input type="date" id="msEndDate" 
                           value="${milestone?.endDate || ''}">
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
        
        // タイプ変更時の表示制御と入力タイプ変更
        document.getElementById('msType').addEventListener('change', (e) => {
            const startDateInput = document.getElementById('msStartDate');
            document.getElementById('endDateContainer').style.display = 
                e.target.value === 'range' ? '' : 'none';
            
            // 入力タイプを切り替え
            if (e.target.value === 'month') {
                startDateInput.type = 'month';
            } else {
                startDateInput.type = 'date';
            }
        });
        
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
                    title, type, startDate, endDate, description
                });
            } else {
                stateManager.addMilestone(visionId, type, startDate, endDate, title, description);
            }
            
            modal.remove();
            UI.renderApp();
        });
        
        // キャンセル
        document.getElementById('cancelMs').addEventListener('click', () => {
            modal.remove();
        });
        
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
                    modal.remove();
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
            UI.renderApp();
        });
        
        // キャンセル
        document.getElementById('cancelVision').addEventListener('click', () => {
            modal.remove();
        });
        
        // ESCキーで閉じる
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
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