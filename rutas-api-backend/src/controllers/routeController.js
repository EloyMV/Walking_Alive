import { routeService } from '../services/routeService.js';

export const routeController = {
  getRoutes: async (req, res, next) => {
    try {
      const routes = await routeService.getAllRoutes();
      res.status(200).json(routes);
    } catch (error) {
      next(error);
    }
  },

  getRouteById: async (req, res, next) => {
    try {
      const route = await routeService.getRouteById(req.params.id);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

  getRouteBySlug: async (req, res, next) => {
    try {
      const route = await routeService.getRouteBySlug(req.params.slug);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

  createRoute: async (req, res, next) => {
    try {
      const created = await routeService.createRoute(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  },

  updateRoute: async (req, res, next) => {
    try {
      const updated = await routeService.updateRoute(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  softDelete: async (req, res, next) => {
    try {
      await routeService.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  changeIsActive: async (req, res, next) => {
    try {
      const route = await routeService.changeIsActive(req.params.id, req.body?.isActive);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

  changeStatus: async (req, res, next) => {
    try {
      const route = await routeService.changeStatus(req.params.id, req.body.status);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  },

  restoreDelete: async (req, res, next) => {
    try {
      const route = await routeService.restoreDelete(req.params.id);
      res.status(200).json(route);
    } catch (error) {
      next(error);
    }
  }
};
