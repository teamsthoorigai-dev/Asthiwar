import { Router } from 'express';
import { requireAdminAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  updatePackagePriceSchema,
  updatePackageMetadataSchema,
  createLocationSchema,
  updateLocationSchema,
  updateAddonPriceSchema,
  updateAddonMetadataSchema,
  updateOptionPriceSchema,
  updatePackageItemSchema,
  updateMilestonesSchema,
} from '../modules/admin/admin-config.schema.js';
import {
  getPackagesController,
  updatePackagePriceController,
  updatePackageMetadataController,
  getLocationsController,
  createLocationController,
  updateLocationController,
  getAddonsController,
  updateAddonPriceController,
  updateAddonMetadataController,
  getSpecificationsController,
  updateOptionPriceController,
  updatePackageItemController,
  getMilestonesController,
  updateMilestonesController,
} from '../modules/admin/admin-config.controller.js';

const router = Router();

// Apply requireAdminAuth guard
router.use(requireAdminAuth);

// ----------------------------------------------------
// 1. Packages Routes
// ----------------------------------------------------
router.get('/packages', getPackagesController);
router.put(
  '/packages/:id/price',
  validateRequest({ body: updatePackagePriceSchema }),
  updatePackagePriceController
);
router.patch(
  '/packages/:id',
  validateRequest({ body: updatePackageMetadataSchema }),
  updatePackageMetadataController
);

// ----------------------------------------------------
// 2. Locations Routes
// ----------------------------------------------------
router.get('/locations', getLocationsController);
router.post(
  '/locations',
  validateRequest({ body: createLocationSchema }),
  createLocationController
);
router.patch(
  '/locations/:id',
  validateRequest({ body: updateLocationSchema }),
  updateLocationController
);

// ----------------------------------------------------
// 3. Add-Ons Routes
// ----------------------------------------------------
router.get('/addons', getAddonsController);
router.put(
  '/addons/:id/price',
  validateRequest({ body: updateAddonPriceSchema }),
  updateAddonPriceController
);
router.patch(
  '/addons/:id',
  validateRequest({ body: updateAddonMetadataSchema }),
  updateAddonMetadataController
);

// ----------------------------------------------------
// 4. Specifications & Pricing Matrix Routes
// ----------------------------------------------------
router.get('/specifications', getSpecificationsController);
router.put(
  '/options/:id/price',
  validateRequest({ body: updateOptionPriceSchema }),
  updateOptionPriceController
);
router.patch(
  '/package-items/:id',
  validateRequest({ body: updatePackageItemSchema }),
  updatePackageItemController
);

// ----------------------------------------------------
// 5. Milestone Payment Stages Routes
// ----------------------------------------------------
router.get('/milestones', getMilestonesController);
router.put(
  '/milestones',
  validateRequest({ body: updateMilestonesSchema }),
  updateMilestonesController
);

export default router;
