import { locationRepository } from '../repositories/locationRepository.js';
import { EntityService } from './entityService.js';

class LocationService extends EntityService {
  constructor() {
    super({
      repository: locationRepository,
      label: 'Ubicación',
      fields: [
        'name', 'description', 'meetingPoint', 'city', 'region', 'country',
        'latitude', 'longitude', 'status', 'isActive'
      ],
      imageEntity: 'location'
    });
  }

  createLocation(payload) { return this.create(payload); }
  getAllLocations(filters) { return this.getAll(filters); }
  getLocationById(id) { return this.getById(id); }
  getLocationBySlug(slug) { return this.getBySlug(slug); }
  updateLocation(id, payload) { return this.update(id, payload); }
  deleteLocation(id) { return this.deleteEntity(id); }
}

export const locationService = new LocationService();
