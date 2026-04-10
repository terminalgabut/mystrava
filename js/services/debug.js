// js/services/debug.js

export const Logger = {
    // 1. MONITOR JALUR & DEPENDENSI (Deteksi Import Putus)
    // Gunakan di awal setup() untuk cek apakah Service/Vue/Supabase terdeteksi
    checkPath(label, dependencies = {}) {
        console.group(`%c[PATH CHECK @ ${label}]`, 'background: #0f172a; color: #38bdf8; padding: 4px 8px; border-radius: 4px;');
        Object.entries(dependencies).forEach(([name, ref]) => {
            const isOk = ref !== undefined && ref !== null && ref !== false;
            console.log(
                `%c${isOk ? '✅' : '❌'} %c${name.padEnd(15)} %c${isOk ? 'CONNECTED' : 'BROKEN/UNDEFINED'}`,
                '', 
                'color: #1e293b; font-weight: bold;',
                isOk ? 'color: #10b981;' : 'color: #ef4444; font-weight: bold; background: #fee2e2;'
            );
        });
        console.groupEnd();
    },

    // 2. DIAGNOSTIK UI & MODAL (Cek Kenapa Render Gagal)
    debugUI(component, action, state, payload = null) {
        console.group(`%c[UI DIAGNOSTIC @ ${component}]`, 'background: #8b5cf6; color: #fff; padding: 2px 6px; border-radius: 4px;');
        console.log(`%cAction    : %c${action}`, 'color: #64748b;', 'color: #0f172a; font-weight: bold;');
        console.log(`%cState Val : %c${state}`, 'color: #64748b;', state ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
        
        if (payload) {
            console.log('%cPayload   :', 'color: #64748b;', payload);
        } else if (state === true) {
            console.warn('%c[WARN] State TRUE tapi payload kosong. Pastikan v-if tidak error.', 'color: #b45309;');
        }
        console.groupEnd();
    },

    // 3. TRACE LIFECYCLE (Deteksi di mana kode berhenti)
    trace(component, hook, message = "") {
        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
        console.log(
            `%c[${time}] %c[${component}] %c${hook.toUpperCase()}%c ${message}`,
            'color: #94a3b8; font-size: 10px;',
            'color: #6366f1; font-weight: bold;',
            'background: #6366f1; color: #fff; padding: 0 4px; border-radius: 2px; font-size: 9px;',
            'color: #475569;'
        );
    },

    // 4. INTELLIGENCE MONITOR (Warna sesuai Readiness)
    intelligence(score, status) {
        const colors = { 'Optimal': '#10b981', 'Good': '#3b82f6', 'Fair': '#fbbf24', 'Rest Required': '#ef4444' };
        const color = colors[status] || '#64748b';
        console.log(
            `%c[ENGINE]%c Readiness: ${score} %c${status}`,
            'color: #6366f1; font-weight: bold;',
            'color: #1e293b; font-weight: bold; font-size: 12px;',
            `background: ${color}; color: white; padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;`
        );
    },

    // 5. SYNC & PERFORMANCE MONITOR
    sync(table, status, duration = 0) {
        const color = status === 'success' ? '#10b981' : '#ef4444';
        const icon = status === 'success' ? '⚡' : '⚠️';
        console.log(
            `%c${icon} [DB SYNC] %c${table.padEnd(18)} %c${status.toUpperCase()} %c(${duration}ms)`,
            '',
            'color: #0f172a; font-weight: bold;',
            `color: ${color}; font-weight: 900;`,
            'color: #94a3b8; font-size: 10px;'
        );
    },

    // 6. CRITICAL ERROR (Dengan Stack Trace)
    error(source, err, metadata = {}) {
        console.group(`%c[CRITICAL ERROR @ ${source}]`, 'background: #ef4444; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
        console.error('Message:', err.message || err);
        if (err.stack) console.debug('%cStack Trace:', 'color: #94a3b8;', err.stack);
        if (Object.keys(metadata).length) {
            console.log('%cMetadata Context:', 'color: #64748b;');
            console.table(metadata);
        }
        console.groupEnd();
    }
};
