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
    static init() {
        document.body.setAttribute('data-theme', stateManager.state.theme || 'dark');
        this.renderApp();
    }
    
    static renderApp() {
        const app = document.getElementById('app');
        
        if (!stateManager.state.currentVisionId) {
            this.renderHome(app);
        } else {
            this.renderTimeline(app);
        }
    }
    
    static renderHome(container) {
        container.innerHTML = `
            <div class="container">
                <h1 style="margin-bottom: 32px;">Voyage</h1>
                <button id="addVision" style="margin-bottom: 24px;">新しいビジョンを追加</button>
                <div id="visionList"></div>
                <div style="margin-top: 32px;">
                    <button id="exportData">データをエクスポート</button>
                    <button id="importData">データをインポート</button>
                    <input type="file" id="importFile" accept=".json" style="display: none;">
                </div>
            </div>
        `;
        
        this.renderVisionList();
        this.attachHomeListeners();
    }
    
    static renderVisionList() {
        const list = document.getElementById('visionList');
        list.innerHTML = stateManager.state.visions.map(vision => `
            <div class="vision-card animate-in" data-id="${vision.id}">
                <h2>${vision.title}</h2>
                <p>期日: ${DateUtil.formatForDisplay(vision.dueDate, 'day')}</p>
                <p>マイルストーン: ${vision.milestones.length}個</p>
                <button class="edit-vision" data-id="${vision.id}">編集</button>
                <button class="delete-vision" data-id="${vision.id}">削除</button>
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
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const endDate = new Date(vision.dueDate);
        endDate.setMonth(endDate.getMonth() + 6);
        
        // 月ラベルの描画
        let currentDate = new Date(startDate);
        let position = 0;
        const monthWidth = 100; // px per month
        
        while (currentDate <= endDate) {
            const label = document.createElement('div');
            label.className = 'month-label';
            label.textContent = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
            label.style.left = `${position}px`;
            track.appendChild(label);
            
            currentDate.setMonth(currentDate.getMonth() + 1);
            position += monthWidth;
        }
        
        // 現在地ライン
        const monthsFromStart = DateUtil.getMonthsBetween(startDate, now);
        const currentLine = document.createElement('div');
        currentLine.className = 'current-line';
        currentLine.style.left = `${monthsFromStart * monthWidth}px`;
        track.appendChild(currentLine);
        
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
        element.style.top = '100px';
        
        if (milestone.type === 'range' && milestone.endDate) {
            const endDate = new Date(milestone.endDate);
            const duration = DateUtil.getMonthsBetween(startDate, endDate);
            element.innerHTML = `
                <div class="milestone-bar" style="width: ${duration * monthWidth}px;"></div>
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
            const title = prompt('ビジョンのタイトル:');
            const dueDate = prompt('期日 (YYYY-MM-DD):');
            if (title && dueDate) {
                stateManager.addVision(title, dueDate);
            }
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
                const title = prompt('タイトル:', vision.title);
                const dueDate = prompt('期日 (YYYY-MM-DD):', vision.dueDate);
                if (title && dueDate) {
                    stateManager.updateVision(id, { title, dueDate });
                    UI.renderApp();
                }
            });
        });
        
        document.querySelectorAll('.delete-vision').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('このビジョンを削除しますか？')) {
                    stateManager.deleteVision(btn.dataset.id);
                    UI.renderApp();
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
            const type = prompt('タイプ (day/month/range):');
            const title = prompt('タイトル:');
            const startDate = prompt('開始日:');
            const endDate = type === 'range' ? prompt('終了日:') : null;
            
            if (type && title && startDate) {
                stateManager.addMilestone(
                    stateManager.state.currentVisionId,
                    type, startDate, endDate, title
                );
                UI.renderApp();
            }
        });
        
        // マイルストーンのドラッグ機能（簡易版）
        document.querySelectorAll('.milestone').forEach(milestone => {
            milestone.addEventListener('click', () => {
                const id = milestone.dataset.id;
                const visionId = stateManager.state.currentVisionId;
                const vision = stateManager.state.visions.find(v => v.id === visionId);
                const ms = vision.milestones.find(m => m.id === id);
                
                if (confirm(`"${ms.title}" を編集しますか？`)) {
                    const title = prompt('タイトル:', ms.title);
                    const description = prompt('説明:', ms.description);
                    if (title !== null) {
                        stateManager.updateMilestone(visionId, id, { title, description });
                        UI.renderApp();
                    }
                }
            });
        });
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
});

// キャッシュクリア
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
    });
}