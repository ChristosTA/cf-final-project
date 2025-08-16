const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || process.env.JWT_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_EXPIRES_IN  = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

module.exports = { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN };
