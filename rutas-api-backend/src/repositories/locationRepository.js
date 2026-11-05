import { Location } from '../models/Location.js';
import { createRepository } from './createRepository.js';

export const locationRepository = createRepository(Location, ["name","description","meetingPoint","city","region","country","latitude","longitude","url_image","slug","status","isActive"], [

]);
