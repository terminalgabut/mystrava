// js/services/debug.js

export const Logger = {
    _history: [],
    _maxHistory: 200,

    // --- INTERNAL HELPERS ---

    _getTheme(type) {
        const themes = {
            'ERROR':   { border: 'border-red-500',    text: 'text-red-400' },
            'SYNC':    { border: 'border-green-500',  text: 'text-green-400' },
            'ENGINE':  { border: 'border-blue-500',   text: 'text-blue-400' },
            'PATH':    { border: 'border-cyan-500',   text: 'text-cyan-400' },
            'UI':      { border: 'border-purple-500', text: 'text-purple-400' },
            'INFO':    { border: 'border-slate-500',  text: 'text-slate-300' }
        };
        return themes[type] || { border: 'border-slate-700', text: 'text-slate-500' };
    },

    _appendToUI(type, message, data = null) {
        const container = document.getElementById('log-container');
        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
        
        // Simpan ke history mentah (untuk fitur COPY ALL)
        const rawLog = `[${time}] [${type}] ${message} ${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}`;
        this._history.push(rawLog);
        if (this._history.length > this._maxHistory) this._history.shift(); 

        if (!container) return;

        const theme = this._getTheme(type);
        const entry = document.createElement('div');
        entry.className = `p-2 border-l-2 mb-1 bg-slate-900/40 ${theme.border} animate-in fade-in slide-in-from-left-1`;
        
        entry.innerHTML = `
            <div class="flex justify-between items-start mb-1 opacity-50 text-[8px] font-mono">
                <span class="font-bold">${time}</span>
                <span class="font-black uppercase ${theme.text}">${type}</span>
            </div>
            <div class="text-slate-200 font-medium leading-tight text-[10px]">${message}</div>
            ${data ? `
                <pre class="mt-2 p-2 bg-black/60 rounded text-[9px] text-blue-300 overflow-x-auto border border-white/5 tabular-nums">
                    ${JSON.stringify(data, null, 2)}
                </pre>` : ''
            }
        `;
        
        container.appendChild(entry);
        // Auto-scroll jika sudah mendekati bawah
        container.scrollTop = container.scrollHeight;
    },

    // --- PUBLIC METHODS ---

    // Menangani error ".info is not a function"
    info(message, context = 'INFO', data = null) {
        console.log(`%c[${context}] %c${message}`, 'color: #94a3b8; font-weight: bold;', 'color: inherit;', data || '');
        this._appendToUI(context, message, data);
    },

    checkPath(label, dependencies = {}) {
        console.group(`%c[PATH CHECK @ ${label}]`, 'background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 4px;');
        let allOk = true;

        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = !!ref;
            if (!isOk) allOk = false;
            console.log(
                `%c${isOk ? '✅' : '❌'} %c${name.padEnd(15)} %c${isOk ? 'CONNECTED' : 'BROKEN'}`,
                '', 'color: #fff; font-weight: bold;', isOk ? 'color: #10b981;' : 'color: #ef4444; font-weight: bold; background: #450a0a;'
            );
        });
        console.groupEnd();

        if (!allOk) {
            this._appendToUI('ERROR', `Path Check Failed in ${label}`, dependencies);
        } else {
            this._appendToUI('PATH', `Verified: ${label}`, Object.keys(dependencies));
        }
    },

    debugUI(component, action, state, payload = null) {
        console.log(`%c[UI] %c${component} %c${action}`, 'color: #a855f7;', 'font-weight: bold;', 'color: #d8b4fe;', { state, payload });
        this._appendToUI('UI', `${component}: ${action} (State: ${state})`, payload);
    },

    trace(component, hook, message = "") {
        console.log(`%c[TRACE] %c${component} > ${hook}`, 'color: #6366f1;', 'font-weight: bold;', message);
        this._appendToUI('TRACE', `${component} > ${hook}`, message || null);
    },

    intelligence(score, status) {
        console.log(`%c[ENGINE] %cReadiness: ${score} [%c${status}%c]`, 'color: #3b82f6;', 'font-weight: bold;', 'color: #10b981;', 'color: #3b82f6;');
        this._appendToUI('ENGINE', `Intelligence Update: ${status}`, { score });
    },

    sync(table, status, duration = 0) {
        const color = status === 'success' ? 'color: #10b981;' : 'color: #ef4444;';
        console.log(`%c[SYNC] %c${table} %c${status.toUpperCase()} %c(${duration}ms)`, 'color: #64748b;', 'font-weight: bold;', color, 'color: #94a3b8;');
        this._appendToUI('SYNC', `${table}: ${status}`, { duration: `${duration}ms` });
    },

    error(source, err, metadata = {}) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`%c[CRITICAL ERROR @ ${source}]`, 'background: #ef4444; color: #fff; padding: 2px 4px;', err);
        
        this._appendToUI('ERROR', `${source}: ${errorMsg}`, {
            ...metadata,
            stack: err?.stack || 'No stack trace'
        });
    }
};

// --- GLOBAL BRIDGE ---
// Memastikan fungsi-fungsi ini tersedia untuk onclick di index.html

window.toggleDebug = () => {
    const el = document.getElementById('custom-console');
    if (!el) return;
    
    // Support Tailwind hidden class and inline style
    const isHidden = el.classList.contains('hidden') || el.style.display === 'none';
    
    if (isHidden) {
        el.classList.remove('hidden');
        el.style.display = 'flex';
    } else {
        el.classList.add('hidden');
        el.style.display = 'none';
    }
};

window.clearLog = () => {
    Logger._history = [];
    const container = document.getElementById('log-container');
    if (container) container.innerHTML = '';
};

window.copyFullLog = () => {
    if (Logger._history.length === 0) return alert("Log is empty");
    
    const fullText = Logger._history.join('\n' + '='.repeat(40) + '\n');
    navigator.clipboard.writeText(fullText).then(() => {
        const btn = document.querySelector('button[onclick="copyFullLog()"]');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerText = "COPIED!";
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        }
    }).catch(err => {
        console.error("Failed to copy:", err);
    });
};
