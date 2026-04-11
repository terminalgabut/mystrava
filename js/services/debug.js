// js/services/debug.js

/**
 * NGANGGUR_PRO // LIGHTWEIGHT LOGGER
 * Optimized for F12, Eruda, and vConsole
 */

export const Logger = {
    // --- STYLING CONFIG ---
    _styles: {
        INFO:         'background: #1e293b; color: #94a3b8; padding: 2px 5px; border-radius: 3px;',
        SYNC:         'background: #064e3b; color: #34d399; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
        ENGINE:       'background: #1e3a8a; color: #60a5fa; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
        PATH:         'background: #164e63; color: #22d3ee; padding: 2px 5px; border-radius: 3px;',
        UI:           'background: #4c1d95; color: #c084fc; padding: 2px 5px; border-radius: 3px;',
        ERROR:        'background: #7f1d1d; color: #f87171; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
        TRACE:        'background: #312e81; color: #818cf8; padding: 2px 5px; border-radius: 3px;'
    },

    // --- PUBLIC METHODS ---

    info(message, context = 'INFO', data = null) {
        console.log(`%c${context}%c ${message}`, this._styles[context] || this._styles.INFO, '', data || '');
    },

    checkPath(label, dependencies = {}) {
        console.group(`%cPATH CHECK @ ${label}`, this._styles.PATH);
        let allOk = true;

        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = !!ref;
            if (!isOk) allOk = false;
            console.log(
                `%c${isOk ? '✅' : '❌'} %c${name.padEnd(15)} %c${isOk ? 'CONNECTED' : 'BROKEN'}`,
                '', 'color: inherit; font-weight: bold;', isOk ? 'color: #10b981;' : 'color: #ef4444; font-weight: bold;'
            );
        });
        
        console.groupEnd();
    },

    debugUI(component, action, state, payload = null) {
        console.log(`%cUI%c [${component}] ${action} | State: %c${state}`, 
            this._styles.UI, 'color: #a855f7;', 'color: #fff; font-weight: bold;', 
            payload || ''
        );
    },

    trace(component, hook, message = "") {
        console.log(`%cTRACE%c ${component} > ${hook} %c${message}`, 
            this._styles.TRACE, 'color: #818cf8;', 'color: #94a3b8; font-style: italic;'
        );
    },

    intelligence(score, status) {
        const color = score < 45 ? '#ef4444' : (score < 80 ? '#fbbf24' : '#10b981');
        console.log(`%cENGINE%c Readiness: %c${score}%c | Status: %c${status}`, 
            this._styles.ENGINE, '', `color: ${color}; font-size: 12px; font-weight: 800;`, '', 
            `color: ${color}; font-weight: bold; text-transform: uppercase;`
        );
    },

    sync(table, status, duration = 0) {
        const isSuccess = status.toLowerCase() === 'success';
        console.log(`%cSYNC%c ${table.padEnd(15)} %c${status.toUpperCase()}%c ${duration > 0 ? `(${duration}ms)` : ''}`, 
            this._styles.SYNC, '', isSuccess ? 'color: #10b981;' : 'color: #ef4444;', 'color: #64748b;'
        );
    },

    error(source, err, metadata = {}) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.group(`%cCRITICAL ERROR @ ${source}`, this._styles.ERROR);
        console.error("Message:", errorMsg);
        console.error("Trace:", err);
        if (Object.keys(metadata).length) console.table(metadata);
        console.groupEnd();
    }
};

// --- CLEANUP GLOBAL BRIDGE ---
// Menghapus fungsi UI yang sudah tidak terpakai agar tidak error saat dipanggil
window.toggleDebug = () => console.warn("UI Console has been removed. Use F12/Eruda.");
window.clearLog = () => console.clear();
window.copyFullLog = () => console.warn("Copy feature is now handled by your Browser's Native Console.");
