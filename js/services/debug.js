export const Logger = {
    info(message, data = '') {
        console.log(`%c[INFO] ${message}`, 'color: #0061FF; font-weight: bold', data);
    },
    error(source, err) {
        console.error(`%c[ERROR @ ${source}]`, 'background: #ff0000; color: #fff; padding: 2px 5px; border-radius: 4px;', err);
    },
    warn(message) {
        console.warn(`%c[WARN] ${message}`, 'color: #f59e0b; font-weight: bold');
    }
};
