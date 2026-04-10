// js/services/debug.js

export const Logger = {
    _history: [], // Memori internal untuk salin log penuh

    // PRIVATE: Menulis ke UI Custom Console
    _appendToUI(type, message, data = null) {
        const container = document.getElementById('log-container');
        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
        
        // Simpan ke array history untuk fitur COPY ALL (Teks Mentah)
        const rawLog = `[${time}] [${type}] ${message} ${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}`;
        this._history.push(rawLog);
        if (this._history.length > 200) this._history.shift(); 

        if (!container) return;

        const entry = document.createElement('div');
        entry.className = `p-2 border-l-2 mb-1 bg-slate-900/30 ${this._getTheme(type).border}`;
        
        entry.innerHTML = `
            <div class="flex justify-between items-start mb-1 opacity-50 text-[8px]">
                <span class="font-bold">${time}</span>
                <span class="font-black uppercase ${this._getTheme(type).text}">${type}</span>
            </div>
            <div class="text-slate-200 font-medium leading-tight">${message}</div>
            ${data ? `<pre class="mt-2 p-2 bg-black/50 rounded text-[9px] text-blue-300 overflow-x-auto border border-white/5 tabular-nums">${JSON.stringify(data, null, 2)}</pre>` : ''}
        `;
        
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    },

    _getTheme(type) {
        const themes = {
            'ERROR': { border: 'border-red-500', text: 'text-red-400' },
            'SYNC': { border: 'border-green-500', text: 'text-green-400' },
            'ENGINE': { border: 'border-blue-500', text: 'text-blue-400' },
            'PATH': { border: 'border-cyan-500', text: 'text-cyan-400' },
            'UI': { border: 'border-purple-500', text: 'text-purple-400' }
        };
        return themes[type] || { border: 'border-slate-700', text: 'text-slate-500' };
    },

    // --- PUBLIC METHODS ---

    checkPath(label, dependencies = {}) {
        console.group(`%c[PATH CHECK @ ${label}]`, 'background: #0f172a; color: #38bdf8; padding: 4px 8px;');
        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = !!ref;
            console.log(`%c${isOk ? '✅' : '❌'} %c${name.padEnd(15)}`, '', isOk ? 'color: #10b981;' : 'color: #ef4444; font-weight: bold;');
            if(!isOk) this._appendToUI('ERROR', `Path Broken: ${name} in ${label}`);
        });
        console.groupEnd();
        this._appendToUI('PATH', `Checked dependencies for ${label}`);
    },

    debugUI(component, action, state, payload = null) {
        console.log(`[UI] ${component} | ${action} | State: ${state}`);
        this._appendToUI('UI', `${component}: ${action}`, { state, payload });
    },

    trace(component, hook, message = "") {
        console.log(`[${component}] ${hook.toUpperCase()} ${message}`);
        this._appendToUI('TRACE', `${component} > ${hook}`, message);
    },

    intelligence(score, status) {
        this._appendToUI('ENGINE', `Readiness Score: ${score}`, { status });
    },

    sync(table, status, duration = 0) {
        this._appendToUI('SYNC', `${table} ${status.toUpperCase()}`, { duration: `${duration}ms` });
    },

    error(source, err, metadata = {}) {
        console.error(`[${source}]`, err);
        this._appendToUI('ERROR', `${source}: ${err.message || err}`, { ...metadata, stack: err.stack });
    }
};

// --- GLOBAL BRIDGE (Agar HTML onclick bisa memanggil fungsi di atas) ---
window.toggleDebug = () => {
    const el = document.getElementById('custom-console');
    if (el) el.classList.toggle('hidden');
};

window.clearLog = () => {
    Logger._history = [];
    const container = document.getElementById('log-container');
    if (container) container.innerHTML = '';
};

window.copyFullLog = () => {
    const fullText = Logger._history.join('\n' + '='.repeat(30) + '\n');
    navigator.clipboard.writeText(fullText).then(() => {
        const btn = document.querySelector('button[onclick="copyFullLog()"]');
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        btn.classList.replace('bg-blue-600', 'bg-green-600');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.replace('bg-green-600', 'bg-blue-600');
        }, 2000);
    });
};
