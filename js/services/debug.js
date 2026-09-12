// js/services/debug.js

/**
 * GARMIN_HUB // PRECISION LOGGER
 * Optimized for Chrome F12, Eruda (Android), and vConsole
 */

export const Logger = {
    // --- STYLING CONFIG ---
    _styles: {
        INFO:    'background: #1e293b; color: #94a3b8; padding: 2px 6px; border-radius: 3px; font-size: 11px;',
        SYNC:    'background: #064e3b; color: #34d399; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 11px;',
        ENGINE:  'background: #1e3a8a; color: #60a5fa; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 11px;',
        PATH:    'background: #164e63; color: #22d3ee; padding: 2px 6px; border-radius: 3px; font-size: 11px;',
        UI:      'background: #4c1d95; color: #c084fc; padding: 2px 6px; border-radius: 3px; font-size: 11px;',
        ERROR:   'background: #7f1d1d; color: #f87171; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 11px;',
        TRACE:   'background: #312e81; color: #818cf8; padding: 2px 6px; border-radius: 3px; font-size: 11px;'
    },

    /**
     * Helper internal untuk mengurai Error Stack Trace
     * Mengekstrak nama file dan lokasi baris (line:col) tempat fungsi dipanggil.
     */
    _extractCaller(customErr = null) {
        try {
            const err = customErr || new Error();
            const stackLines = err.stack ? err.stack.split('\n') : [];

            // Baris ke-3 atau ke-4 dalam stack biasanya adalah file pemanggil asli
            const targetLine = stackLines[3] || stackLines[2] || '';
            
            // Regex untuk mengekstrak nama file, baris, dan kolom (contoh: csvAggregator.js:45:12)
            const match = targetLine.match(/(?:[a-zA-Z0-9_\-]+\.js|\/)?([a-zA-Z0-9_\-]+\.js:\d+:\d+)/);
            if (match && match[1]) {
                return match[1];
            }
            
            // Fallback pembersihan string URL jika regex tidak cocok
            const cleanLine = targetLine.trim().replace(/^at\s+/, '');
            const parts = cleanLine.split('/');
            return parts[parts.length - 1] || 'unknown-origin';
        } catch (_) {
            return 'unknown-origin';
        }
    },

    // --- PUBLIC METHODS ---

    info(message, context = 'INFO', data = null) {
        const caller = this._extractCaller();
        console.log(
            `%c${context}%c %c[${caller}]%c ${message}`,
            this._styles[context] || this._styles.INFO,
            '',
            'color: #06b6d4; font-size: 10px; font-family: monospace;',
            '',
            data || ''
        );
    },

    error(source, err, metadata = {}) {
        // Gunakan error stack bawaan jika instance Error, atau ekstrak lokasi pemanggil
        const errorMsg = err instanceof Error ? err.message : String(err);
        const originFile = err instanceof Error ? this._extractCaller(err) : this._extractCaller();
        const sourceLabel = source || originFile;

        console.group(`%cCRITICAL ERROR @ ${sourceLabel}`, this._styles.ERROR);
        console.error(`📍 Origin File : ${originFile}`);
        console.error(`💬 Message     : ${errorMsg}`);
        
        if (err && err.stack) {
            console.groupCollapsed('🔍 Stack Trace');
            console.error(err.stack);
            console.groupEnd();
        } else {
            console.error('🔍 Raw Object  :', err);
        }

        if (metadata && Object.keys(metadata).length > 0) {
            console.table(metadata);
        }
        
        console.groupEnd();
    },

    checkPath(label, dependencies = {}) {
        const caller = this._extractCaller();
        console.group(`%cPATH CHECK @ ${label} %c[${caller}]`, this._styles.PATH, 'color: #94a3b8; font-weight: normal; font-size: 10px;');
        let allOk = true;

        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = !!ref;
            if (!isOk) allOk = false;
            console.log(
                `%c${isOk ? '✅' : '❌'} %c${name.padEnd(18)} %c${isOk ? 'CONNECTED' : 'BROKEN'}`,
                '', 
                'color: inherit; font-weight: bold;', 
                isOk ? 'color: #10b981;' : 'color: #ef4444; font-weight: bold;'
            );
        });
        
        console.groupEnd();
    },

    debugUI(component, action, state, payload = null) {
        const caller = this._extractCaller();
        console.log(
            `%cUI%c [${component}] ${action} | State: %c${state}%c (%c${caller}%c)`, 
            this._styles.UI, 
            'color: #a855f7;', 
            'color: #fff; font-weight: bold;', 
            '',
            'color: #64748b; font-size: 10px;',
            '',
            payload || ''
        );
    },

    trace(component, hook, message = "") {
        const caller = this._extractCaller();
        console.log(
            `%cTRACE%c ${component} > ${hook} %c${message} %c(${caller})`, 
            this._styles.TRACE, 
            'color: #818cf8;', 
            'color: #94a3b8; font-style: italic;',
            'color: #64748b; font-size: 10px;'
        );
    },

    sync(table, status, duration = 0) {
        const isSuccess = String(status).toLowerCase() === 'success';
        const caller = this._extractCaller();
        console.log(
            `%cSYNC%c ${table.padEnd(15)} %c${String(status).toUpperCase()}%c ${duration > 0 ? `(${duration}ms)` : ''} %c[${caller}]`, 
            this._styles.SYNC, 
            '', 
            isSuccess ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;', 
            'color: #64748b;',
            'color: #06b6d4; font-size: 10px;'
        );
    }
};

// --- CLEANUP GLOBAL BRIDGE ---
window.toggleDebug = () => console.warn("UI Console has been removed. Use F12/Eruda.");
window.clearLog = () => console.clear();
window.copyFullLog = () => console.warn("Native browser consol
                                        e is active.");
