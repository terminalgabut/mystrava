// js/services/debug.js
// js/services/debug.js

export const Logger = {
    _history: [], // Tempat menyimpan log mentah agar bisa disalin tanpa terpotong

    // Helper internal untuk mengirim log ke UI Custom Console
    _appendToUI(type, message, data = null) {
        const container = document.getElementById('log-container');
        const logEntry = {
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            type,
            message,
            data: data ? JSON.parse(JSON.stringify(data)) : null
        };

        // Simpan ke history (teks mentah)
        this._history.push(`[${logEntry.time}] [${type}] ${message} ${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}`);
        if (this._history.length > 100) this._history.shift(); // Batasi 100 log terakhir

        if (!container) return;

        const div = document.createElement('div');
        div.className = `p-2 border-l-2 mb-1 bg-slate-900/50 ${this._getBorderColor(type)}`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <span class="text-[8px] font-bold px-1 rounded bg-slate-800 text-slate-400">${logEntry.time}</span>
                <span class="text-[8px] font-black uppercase ${this._getTextColor(type)}">${type}</span>
            </div>
            <div class="text-slate-200 font-medium leading-tight">${message}</div>
            ${data ? `<pre class="mt-2 p-2 bg-black/40 rounded text-[9px] text-blue-300 overflow-x-auto border border-white/5">${JSON.stringify(data, null, 2)}</pre>` : ''}
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    _getBorderColor(type) {
        const colors = { 'ERROR': 'border-red-500', 'SYNC': 'border-green-500', 'ENGINE': 'border-indigo-500', 'UI': 'border-purple-500' };
        return colors[type] || 'border-slate-700';
    },

    _getTextColor(type) {
        const colors = { 'ERROR': 'text-red-400', 'SYNC': 'text-green-400', 'ENGINE': 'text-indigo-400', 'UI': 'text-purple-400' };
        return colors[type] || 'text-slate-500';
    },

    // --- PUBLIC METHODS (Canggih & Terhubung) ---

    checkPath(label, dependencies = {}) {
        console.group(`%c[PATH CHECK @ ${label}]`, 'background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 4px;');
        this._appendToUI('PATH', `Checking Path: ${label}`);
        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = ref !== undefined && ref !== null && ref !== false;
            console.log(`%c${isOk ? '✅' : '❌'} %c${name.padEnd(15)} %c${isOk ? 'CONNECTED' : 'BROKEN'}`, '', 'font-weight: bold;', isOk ? 'color: #10b981;' : 'color: #ef4444;');
            if (!isOk) this._appendToUI('ERROR', `Path Broken: ${name}`);
        });
        console.groupEnd();
    },

    debugUI(component, action, state, payload = null) {
        this.trace(component, 'UI_DEBUG', `${action} (State: ${state})`);
        this._appendToUI('UI', `${component}: ${action}`, { state, payload });
        console.group(`%c[UI DIAGNOSTIC @ ${component}]`, 'background: #8b5cf6; color: #fff; padding: 2px 6px;');
        console.log(`Action: ${action} | State: ${state}`);
        if (payload) console.log('Payload:', payload);
        console.groupEnd();
    },

    trace(component, hook, message = "") {
        console.log(`%c[${component}] %c${hook.toUpperCase()}%c ${message}`, 'color: #6366f1; font-weight: bold;', 'background: #6366f1; color: #fff; padding: 0 4px;', 'color: #475569;');
        this._appendToUI('TRACE', `${component} > ${hook}`, message);
    },

    intelligence(score, status) {
        const colors = { 'Optimal': '#10b981', 'Good': '#3b82f6', 'Fair': '#fbbf24', 'Rest Required': '#ef4444' };
        console.log(`%c[ENGINE] Readiness: ${score} [${status}]`, `color: ${colors[status] || '#64748b'}; font-weight: bold; font-size: 12px;`);
        this._appendToUI('ENGINE', `Readiness Updated: ${score}`, { status });
    },

    sync(table, status, duration = 0) {
        const icon = status === 'success' ? '⚡' : '⚠️';
        console.log(`%c${icon} [DB SYNC] %c${table} %c${status.toUpperCase()} (${duration}ms)`, '', 'font-weight: bold;', status === 'success' ? 'color: #10b981;' : 'color: #ef4444;');
        this._appendToUI('SYNC', `${table}: ${status}`, { duration: `${duration}ms` });
    },

    error(source, err, metadata = {}) {
        console.group(`%c[CRITICAL ERROR @ ${source}]`, 'background: #ef4444; color: #fff; padding: 4px 8px;');
        console.error(err);
        console.groupEnd();
        this._appendToUI('ERROR', `${source}: ${err.message || err}`, metadata);
    },

    // Fungsi sakti untuk copy tanpa terpotong
    copyHistory() {
        const fullLog = this._history.join('\n------------------\n');
        navigator.clipboard.writeText(fullLog).then(() => {
            alert("✅ FULL LOG COPIED! (No truncation)");
        });
    }
};
