// Contrato común de persistencia: campos permitidos, validación y borrado lógico.
export const createRepository = (model, writableFields, populate = []) => {
  const getWritableData = (data) =>
    Object.fromEntries(
      writableFields
        .filter((field) => data && typeof data === 'object' && Object.hasOwn(data, field))
        .map((field) => [field, data[field]])
    );

  return {
    findAll: async (filter = {}) => {
      const documents = await model.find({ ...filter, deletedAt: null }).sort({ createdAt: -1 }).populate(populate);
      return documents;
    },

    findById: async (id) => {
      const document = await model.findOne({ _id: id, deletedAt: null }).populate(populate);
      return document;
    },

    // Sin populate: permite comprobar las referencias originales al restaurar.
    findByIdIncludingDeleted: async (id) =>
      model.findById(id).setOptions({ includeDeleted: true }),

    findBySlug: async (slug) => {
      const document = await model.findOne({ slug, deletedAt: null }).populate(populate);
      return document;
    },

    create: async (data) => {
      const document = await model.create(getWritableData(data));
      return document.populate(populate);
    },

    update: async (id, data) => {
      const document = await model.findOne({ _id: id, deletedAt: null });
      if (!document) {
        return null;
      }

      const writableData = getWritableData(data);
      Object.assign(document, writableData);
      await document.save();
      return document.populate(populate);
    },

    softDelete: async (id) => {
      const document = await model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date(), isActive: false } },
        { new: true }
      ).populate(populate);
      return document;
    },

    changeIsActive: async (id, isActive) => {
      const document = await model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { isActive } },
        { new: true, runValidators: true }
      ).populate(populate);
      return document;
    },

    changeStatus: async (id, status) => {
      const document = await model.findOne({ _id: id, deletedAt: null });
      if (!document) {
        return null;
      }
      document.status = status;
      await document.save();
      return document.populate(populate);
    },

    slugExists: async (slug, excludeId) => {
      const filter = { slug };
      if (excludeId) {
        filter._id = { $ne: excludeId };
      }
      const document = await model.findOne(filter).select('_id').setOptions({ includeDeleted: true });
      return Boolean(document);
    },

    restoreDelete: async (id) => {
      const document = await model.findOneAndUpdate(
        { _id: id, deletedAt: { $ne: null } },
        { $set: { deletedAt: null, isActive: true } },
        { new: true, runValidators: true, includeDeleted: true }
      ).populate(populate);
      return document;
    }
  };

};
