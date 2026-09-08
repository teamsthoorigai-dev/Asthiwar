import { Request, Response, NextFunction } from 'express';
import {
  getAdminPackages,
  updateAdminPackagePrice,
  updateAdminPackageMetadata,
  getAdminLocations,
  createAdminLocation,
  updateAdminLocation,
  deleteAdminLocation,
  getAdminAddons,
  updateAdminAddonPrice,
  updateAdminAddonMetadata,
  getAdminSpecifications,
  createAdminOption,
  updateAdminOptionPrice,
  deleteAdminOption,
  updateAdminPackageItem,
  getAdminMilestones,
  updateAdminMilestones,
  createAdminAddon,
  deleteAdminAddon,
  createAdminAddonVariant,
  deleteAdminAddonVariant,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  createAdminItem,
  updateAdminItem,
  deleteAdminItem,
} from './admin-config.service.js';
import {
  UpdatePackagePriceDto,
  UpdatePackageMetadataDto,
  CreateLocationDto,
  UpdateLocationDto,
  UpdateAddonPriceDto,
  UpdateAddonMetadataDto,
  CreateOptionDto,
  UpdateOptionPriceDto,
  UpdatePackageItemDto,
  UpdateMilestonesDto,
  CreateAddonDto,
  CreateAddonVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
} from './admin-config.schema.js';
import { AdminServiceError } from './admin.service.js';

/**
 * Every mutation below reports service-level failures the same way: a typed
 * AdminServiceError becomes its own status and code, anything else falls through
 * to the global error handler.
 */
function relayServiceError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AdminServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  next(error);
}

// ----------------------------------------------------
// PACKAGES CONTROLLER
// ----------------------------------------------------

export async function getPackagesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const packages = await getAdminPackages();
    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
}

import { logAuditEvent } from '../../services/audit.service.js';

export async function updatePackagePriceController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params.id as string;
    const packageIdOrSlug = !isNaN(Number(rawId)) ? parseInt(rawId, 10) : rawId;
    const dto = req.body as UpdatePackagePriceDto;
    const newPrice = await updateAdminPackagePrice(packageIdOrSlug, dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'UPDATE_PACKAGE_PRICE',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: {
        packageIdOrSlug,
        pricePerSqft: dto.pricePerSqft,
        volumePricePerSqft: dto.volumePricePerSqft,
        volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
      },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Package price updated successfully with history versioning',
      data: newPrice,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updatePackageMetadataController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const packageId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdatePackageMetadataDto;
    const updated = await updateAdminPackageMetadata(packageId, dto);
    res.json({
      success: true,
      message: 'Package metadata updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

// ----------------------------------------------------
// LOCATIONS CONTROLLER
// ----------------------------------------------------

export async function getLocationsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locations = await getAdminLocations();
    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateLocationDto;
    const created = await createAdminLocation(dto);
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: created,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updateLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateLocationDto;
    const updated = await updateAdminLocation(locationId, dto);
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function deleteLocationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locationId = parseInt(req.params.id as string, 10);
    const result = await deleteAdminLocation(locationId);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'DELETE_LOCATION',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: { locationId },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: `Location '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

// ----------------------------------------------------
// ADDONS CONTROLLER
// ----------------------------------------------------

export async function getAddonsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addons = await getAdminAddons();
    res.json({
      success: true,
      data: addons,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddonPriceController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawId = req.params.id as string;
    const addonIdOrSlug = !isNaN(Number(rawId)) ? parseInt(rawId, 10) : rawId;
    const dto = req.body as UpdateAddonPriceDto;
    const newPrice = await updateAdminAddonPrice(addonIdOrSlug, dto);
    res.json({
      success: true,
      message: 'Add-on variant price updated successfully with history versioning',
      data: newPrice,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updateAddonMetadataController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addonId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateAddonMetadataDto;
    const updated = await updateAdminAddonMetadata(addonId, dto);
    res.json({
      success: true,
      message: 'Add-on metadata updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function createAddonController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateAddonDto;
    const created = await createAdminAddon(dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'CREATE_ADDON',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 201,
      metadata: { addonId: created.id, slug: created.slug, variants: dto.variants.length },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Add-on '${created.name}' created successfully`,
      data: created,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function deleteAddonController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addonId = parseInt(req.params.id as string, 10);
    const result = await deleteAdminAddon(addonId);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'DELETE_ADDON',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: { addonId },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: `Add-on '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function createAddonVariantController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addonId = parseInt(req.params.id as string, 10);
    const dto = req.body as CreateAddonVariantDto;
    const created = await createAdminAddonVariant(addonId, dto);
    res.status(201).json({
      success: true,
      message: `Variant '${created.variantName}' added successfully`,
      data: created,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function deleteAddonVariantController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const addonId = parseInt(req.params.id as string, 10);
    const variantId = parseInt(req.params.variantId as string, 10);
    const result = await deleteAdminAddonVariant(addonId, variantId);
    res.json({
      success: true,
      message: `Variant '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

// ----------------------------------------------------
// SPECIFICATIONS & MATRIX CONTROLLER
// ----------------------------------------------------

export async function getSpecificationsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const specs = await getAdminSpecifications();
    res.json({
      success: true,
      data: specs,
    });
  } catch (error) {
    next(error);
  }
}

export async function createOptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateOptionDto;
    const created = await createAdminOption(dto);
    res.status(201).json({
      success: true,
      message: 'Brand option created successfully',
      data: created,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function deleteOptionController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const optionId = parseInt(req.params.id as string, 10);
    const result = await deleteAdminOption(optionId);
    res.json({
      success: true,
      message: `Brand option '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updateOptionPriceController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const optionId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateOptionPriceDto;
    const newPrice = await updateAdminOptionPrice(optionId, dto);
    res.json({
      success: true,
      message: 'Option prices updated successfully',
      data: newPrice,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updatePackageItemController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const packageItemId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdatePackageItemDto;
    const updated = await updateAdminPackageItem(packageItemId, dto);
    res.json({
      success: true,
      message: 'Package specification item updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}


export async function createCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateCategoryDto;
    const created = await createAdminCategory(dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'CREATE_CATEGORY',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 201,
      metadata: { categoryId: created.id, slug: created.slug },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Category '${created.name}' created successfully`,
      data: created,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function updateCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateCategoryDto;
    const updated = await updateAdminCategory(categoryId, dto);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function deleteCategoryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = parseInt(req.params.id as string, 10);
    const result = await deleteAdminCategory(categoryId);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'DELETE_CATEGORY',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: { categoryId, deletedItems: result.deletedItems },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: `Category '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function createItemController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateItemDto;
    const created = await createAdminItem(dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'CREATE_ITEM',
      severity: 'MEDIUM',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 201,
      metadata: { itemId: created.id, slug: created.slug, categoryId: created.categoryId },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Component '${created.name}' created successfully`,
      data: created,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function updateItemController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateItemDto;
    const updated = await updateAdminItem(itemId, dto);
    res.json({
      success: true,
      message: 'Component updated successfully',
      data: updated,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

export async function deleteItemController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseInt(req.params.id as string, 10);
    const result = await deleteAdminItem(itemId);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'DELETE_ITEM',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: { itemId, deletedOptions: result.deletedOptions },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: `Component '${result.name}' deleted successfully`,
      data: result,
    });
  } catch (error) {
    relayServiceError(error, res, next);
  }
}

// ----------------------------------------------------
// MILESTONES CONTROLLER
// ----------------------------------------------------

export async function getMilestonesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stages = await getAdminMilestones();
    res.json({
      success: true,
      data: stages,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMilestonesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as UpdateMilestonesDto;
    const updatedStages = await updateAdminMilestones(dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'UPDATE_MILESTONES',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: (req as any).user?.email || (req as any).user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: {
        totalStages: updatedStages.length,
        sumPercentage: updatedStages.reduce((acc, s) => acc + Number(s.percentage), 0),
      },
    });

    res.json({
      success: true,
      message: 'Milestone payment stages updated successfully',
      data: updatedStages,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

