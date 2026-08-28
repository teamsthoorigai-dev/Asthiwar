import { Request, Response, NextFunction } from 'express';
import {
  getAdminPackages,
  updateAdminPackagePrice,
  updateAdminPackageMetadata,
  getAdminLocations,
  createAdminLocation,
  updateAdminLocation,
  getAdminAddons,
  updateAdminAddonPrice,
  updateAdminAddonMetadata,
  getAdminSpecifications,
  updateAdminOptionPrice,
  updateAdminPackageItem,
  getAdminMilestones,
  updateAdminMilestones,
} from './admin-config.service.js';
import {
  UpdatePackagePriceDto,
  UpdatePackageMetadataDto,
  CreateLocationDto,
  UpdateLocationDto,
  UpdateAddonPriceDto,
  UpdateAddonMetadataDto,
  UpdateOptionPriceDto,
  UpdatePackageItemDto,
  UpdateMilestonesDto,
} from './admin-config.schema.js';
import { AdminServiceError } from './admin.service.js';

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
    const packageId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdatePackagePriceDto;
    const newPrice = await updateAdminPackagePrice(packageId, dto);

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
        packageId,
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
    const addonId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateAddonPriceDto;
    const newPrice = await updateAdminAddonPrice(addonId, dto);
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

export async function updateOptionPriceController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const optionId = parseInt(req.params.id as string, 10);
    const dto = req.body as UpdateOptionPriceDto;
    const newPrice = await updateAdminOptionPrice(optionId, dto);
    res.json({
      success: true,
      message: 'Option price delta updated with history versioning',
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

