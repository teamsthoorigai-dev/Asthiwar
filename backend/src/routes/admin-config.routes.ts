import { Router } from 'express';
import { requireAdminAuth, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  updatePackagePriceSchema,
  updatePackageMetadataSchema,
  createLocationSchema,
  updateLocationSchema,
  updateAddonPriceSchema,
  updateAddonMetadataSchema,
  createAddonSchema,
  createAddonVariantSchema,
  createCategorySchema,
  updateCategorySchema,
  createItemSchema,
  updateItemSchema,
  createOptionSchema,
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
  deleteLocationController,
  getAddonsController,
  createAddonController,
  deleteAddonController,
  updateAddonPriceController,
  updateAddonMetadataController,
  createAddonVariantController,
  deleteAddonVariantController,
  getSpecificationsController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  createItemController,
  updateItemController,
  deleteItemController,
  createOptionController,
  updateOptionPriceController,
  deleteOptionController,
  updatePackageItemController,
  getMilestonesController,
  updateMilestonesController,
} from '../modules/admin/admin-config.controller.js';

const router = Router();

// Apply requireAdminAuth guard
router.use(requireAdminAuth);

/**
 * Every route in this file changes what customers are quoted, so the write side
 * needs more than a valid session. `role` was carried through login and checked
 * nowhere: a viewer account could reprice the whole catalogue.
 *
 * Reads stay open to any authenticated admin — seeing the rate card is the point
 * of a read-only account.
 */
const canWritePricing = requireRole('admin');

/** Removing catalogue rows outright is the narrower privilege. */
const canDeleteCatalogue = requireRole('super_admin');

// ----------------------------------------------------
// 1. Packages Routes
// ----------------------------------------------------
router.get('/packages', getPackagesController);
router.put(
  '/packages/:id/price',
  canWritePricing,
  validateRequest({ body: updatePackagePriceSchema }),
  updatePackagePriceController
);
router.patch(
  '/packages/:id',
  canWritePricing,
  validateRequest({ body: updatePackageMetadataSchema }),
  updatePackageMetadataController
);

// ----------------------------------------------------
// 2. Locations Routes
// ----------------------------------------------------
router.get('/locations', getLocationsController);
router.post(
  '/locations',
  canWritePricing,
  validateRequest({ body: createLocationSchema }),
  createLocationController
);
router.patch(
  '/locations/:id',
  canWritePricing,
  validateRequest({ body: updateLocationSchema }),
  updateLocationController
);
router.delete('/locations/:id', canDeleteCatalogue, deleteLocationController);

// ----------------------------------------------------
// 3. Add-Ons Routes
// ----------------------------------------------------
router.get('/addons', getAddonsController);
router.post(
  '/addons',
  canWritePricing,
  validateRequest({ body: createAddonSchema }),
  createAddonController
);
router.put(
  '/addons/:id/price',
  canWritePricing,
  validateRequest({ body: updateAddonPriceSchema }),
  updateAddonPriceController
);
router.patch(
  '/addons/:id',
  canWritePricing,
  validateRequest({ body: updateAddonMetadataSchema }),
  updateAddonMetadataController
);
router.delete('/addons/:id', canDeleteCatalogue, deleteAddonController);
router.post(
  '/addons/:id/variants',
  canWritePricing,
  validateRequest({ body: createAddonVariantSchema }),
  createAddonVariantController
);
router.delete('/addons/:id/variants/:variantId', canDeleteCatalogue, deleteAddonVariantController);

// ----------------------------------------------------
// 4. Specifications & Pricing Matrix Routes
// ----------------------------------------------------
router.get('/specifications', getSpecificationsController);
router.post(
  '/categories',
  canWritePricing,
  validateRequest({ body: createCategorySchema }),
  createCategoryController
);
router.patch(
  '/categories/:id',
  canWritePricing,
  validateRequest({ body: updateCategorySchema }),
  updateCategoryController
);
router.delete('/categories/:id', canDeleteCatalogue, deleteCategoryController);
router.post(
  '/items',
  canWritePricing,
  validateRequest({ body: createItemSchema }),
  createItemController
);
router.patch(
  '/items/:id',
  canWritePricing,
  validateRequest({ body: updateItemSchema }),
  updateItemController
);
router.delete('/items/:id', canDeleteCatalogue, deleteItemController);
router.post(
  '/options',
  canWritePricing,
  validateRequest({ body: createOptionSchema }),
  createOptionController
);
router.put(
  '/options/:id/price',
  canWritePricing,
  validateRequest({ body: updateOptionPriceSchema }),
  updateOptionPriceController
);
router.delete('/options/:id', canDeleteCatalogue, deleteOptionController);
router.patch(
  '/package-items/:id',
  canWritePricing,
  validateRequest({ body: updatePackageItemSchema }),
  updatePackageItemController
);

// ----------------------------------------------------
// 5. Milestone Payment Stages Routes
// ----------------------------------------------------
router.get('/milestones', getMilestonesController);
router.put(
  '/milestones',
  canWritePricing,
  validateRequest({ body: updateMilestonesSchema }),
  updateMilestonesController
);

export default router;
