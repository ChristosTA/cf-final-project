module.exports = function resolveSerialFactory(Model, serialField = 'serial') {

    return async (req, res, next) => {

        const { id } = req.params;

        if (/^\d+$/.test(id)) {

            const doc = await Model.findOne({ [serialField]: Number(id) }, '_id').lean();
            if (!doc) return res.status(404).json({ message: 'Not found' });
            req.params.id = doc._id.toString();
        }
        next();
    };
};
