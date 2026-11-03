// Los errores se muestran en la página para que un fallo no bloquee otros formularios.
export function createEntityService(api, { singular, plural }) {
  async function run(action, fallbackMessage) {
    try {
      return await action();
    } catch (error) {
      if (error instanceof Error && error.message) throw error;
      throw new Error(fallbackMessage, { cause: error });
    }
  }

  return {
    list: (options) => run(() => api.list(options), `No se pudieron cargar ${plural}.`),
    get: (id) => run(() => api.get(id), `No se pudo cargar ${singular}.`),
    create: (data) => run(() => api.create(data), `No se pudo crear ${singular}.`),
    update: (id, data) => run(() => api.update(id, data), `No se pudo actualizar ${singular}.`),
    changeActivation: (id, isActive) => run(() => api.changeActivation(id, isActive), `No se pudo cambiar la disponibilidad de ${singular}.`),
    changeStatus: (id, status) => run(() => api.changeStatus(id, status), `No se pudo cambiar el estado de ${singular}.`),
    remove: (id) => run(() => api.remove(id), `No se pudo realizar el borrado lógico de ${singular}.`),
    restore: (id) => run(() => api.restore(id), `No se pudo restaurar ${singular}.`)
  };
}
