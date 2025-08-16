// Συγχωνεύει επιλεγμένα query keys (π.χ. brand/size/color) σε ένα target key (π.χ. tags)
function mergeQueryIntoTarget(keys, {
    target = 'tags',
    asCsv = true,
    normalizer = (v) => String(v).trim(), // βάλε .toLowerCase() αν προτιμάς
    dedupe = true
} = {}) {
    return function (req, _res, next) {
        const inbound = req.query[target];
        const normalizedInbound = inbound
            ? (Array.isArray(inbound) ? inbound : String(inbound).split(','))
                .map(normalizer)
                .filter(Boolean)
            : [];

        const extras = [];
        for (const k of keys) {
            const val = req.query[k];
            if (!val) continue;
            const arr = Array.isArray(val) ? val : String(val).split(',');
            for (const v of arr) extras.push(normalizer(v));
        }

        let merged = [...normalizedInbound, ...extras].filter(Boolean);
        if (dedupe) merged = [...new Set(merged)];

        req.query[target] = asCsv ? merged.join(',') : merged;
        return next();
    };
}

// Εξειδίκευση για ρούχα (brand/size/color -> tags)
function apparelFilters(options = {}) {
    return mergeQueryIntoTarget(['brand', 'size', 'color'], { target: 'tags', asCsv: true, ...options });
}

module.exports = { mergeQueryIntoTarget, apparelFilters };
