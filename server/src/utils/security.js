const crypto = require('crypto');

function normalizeIban(iban) {
    return (iban || '').toUpperCase().replace(/\s+/g, '');
}
function maskIban(iban) {
    const s = normalizeIban(iban);
    if (!s) return '';
    return s.slice(0,2) + '****************' + s.slice(-4);
}
function ibanLast4(iban){ const s = normalizeIban(iban); return s ? s.slice(-4) : ''; }
function sha256(v){ return crypto.createHash('sha256').update(String(v)).digest('hex'); }

// MOD97 check (lightweight)
function isValidIBAN(iban) {
    const s = normalizeIban(iban);
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(s)) return false;
    const rearr = s.slice(4) + s.slice(0,4);
    const numeric = rearr.replace(/[A-Z]/g, ch => (ch.charCodeAt(0)-55).toString());
    let rem = 0;
    for (let i = 0; i < numeric.length; i += 7) {
        rem = parseInt(String(rem) + numeric.slice(i, i+7), 10) % 97;
    }
    return rem === 1;
}

// VAT: προς το παρόν μόνο basic mask/hash (checksum αργότερα)
function maskVat(vat){ if(!vat) return ''; const s=String(vat); return '**' + s.slice(-4); }

module.exports = { normalizeIban, maskIban, ibanLast4, sha256, isValidIBAN, maskVat };
