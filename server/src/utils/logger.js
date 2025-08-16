const lvl = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info');
const order = { error: 0, warn: 1, info: 2, debug: 3 };
const current = order[lvl] ?? 2;

function out(level, ...args) {
    const want = order[level] ?? 2;
    if (want <= current) {
        const method = level === 'debug' ? 'log' : level;
        console[method](`[${level.toUpperCase()}]`, ...args);
    }
}

module.exports = {
    error: (...a) => out('error', ...a),
    warn:  (...a) => out('warn',  ...a),
    info:  (...a) => out('info',  ...a),
    debug: (...a) => out('debug', ...a),
};
