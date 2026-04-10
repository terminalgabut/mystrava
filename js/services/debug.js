// js/services/debug.js

export const Logger = {
    // Info dengan pemisahan konteks yang lebih jelas
    info(message, context = 'SYSTEM', data = null) {
        const time = new Date().toLocaleTimeString();
        console.log(
            `%c[${time}] %c[INFO @ ${context}] %c${message}`,
            'color: #94a3b8; font-size: 10px;', // Waktu
            'color: #0061FF; font-weight: bold; text-transform: uppercase;', // Konteks
            'color: #1e293b; font-weight: 500;', // Pesan
            data ? { data } : ''
        );
    },

    // Error dengan Trace yang lebih rapi
    error(source, err, metadata = {}) {
        console.group(`%c[ERROR @ ${source}]`, 'background: #ef4444; color: #fff; padding: 3px 8px; border-radius: 4px; font-weight: black;');
        console.error('Message:', err.message || err);
        if (err.stack) console.debug('Stack Trace:', err.stack);
        if (Object.keys(metadata).length) console.table(metadata);
        console.groupEnd();
    },

    // Warn untuk validasi data yang mencurigakan (misal ACWR aneh)
    warn(message, data = '') {
        console.warn(
            `%c[ATTENTION] ${message}`, 
            'background: #fffbeb; color: #b45309; border-left: 4px solid #f59e0b; padding-left: 8px; font-weight: bold;',
            data
        );
    },

    // Khusus untuk memantau alur Sync Database
    sync(table, status, duration = 0) {
        const color = status === 'success' ? '#10b981' : '#ef4444';
        console.log(
            `%c[DB SYNC] %c${table} %c${status.toUpperCase()} %c(${duration}ms)`,
            'color: #64748b; font-weight: bold;',
            'color: #0f172a; font-weight: 900;',
            `color: ${color}; font-weight: bold;`,
            'color: #94a3b8; font-size: 10px;'
        );
    }
};
