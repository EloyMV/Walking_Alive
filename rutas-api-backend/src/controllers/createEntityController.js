// Adaptadores HTTP: la validación de negocio permanece en los servicios.
const respond = (action, status = 200) => async (req, res, next) => {
  try {
    const result = await action(req);
    if (status === 204) return res.status(status).send();
    return res.status(status).json(result);
  } catch (error) {
    return next(error);
  }
};

export const createEntityController = (service) => ({
  getAll: respond((req) => service.getAll(req.query)),
  getById: respond((req) => service.getById(req.params.id)),
  getBySlug: respond((req) => service.getBySlug(req.params.slug)),
  create: respond((req) => service.create(req.body), 201),
  update: respond((req) => service.update(req.params.id, req.body)),
  updateAssociations: respond((req) => service.updateAssociations(req.params.id, req.body)),
  softDelete: respond((req) => service.deleteEntity(req.params.id), 204),
  changeIsActive: respond((req) => service.changeIsActive(req.params.id, req.body.isActive)),
  changeStatus: respond((req) => service.changeStatus(req.params.id, req.body.status)),
  restoreDelete: respond((req) => service.restoreDelete(req.params.id))
});
