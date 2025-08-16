// Απλό in-memory state μόνο για το flow των tests
// key: userId(string) -> 'PENDING' | 'APPROVED' | 'REJECTED'
const state = new Map();

module.exports = {
    setPending(userId) { state.set(String(userId), 'PENDING'); },
    approve(userId, note) { state.set(String(userId), 'APPROVED'); },
    reject(userId, note) { state.set(String(userId), 'REJECTED'); },
    get(userId) { return state.get(String(userId)) || 'PENDING'; },
};
