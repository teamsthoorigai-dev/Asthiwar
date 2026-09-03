import {
  db,
  schema,
  eq,
  ilike,
  or,
  and,
  desc,
  asc,
  count,
  sql,
} from '@asthiwar/database';
import {
  EnquiriesQuery,
  UpdateEnquiryDto,
  EstimatesQuery,
  UpdateEstimateDto,
} from './admin.schema.js';

export class AdminServiceError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AdminServiceError';
  }
}

// ----------------------------------------------------
// ENQUIRIES SERVICE
// ----------------------------------------------------

export async function getAdminEnquiries(query: EnquiriesQuery) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(schema.enquiries.status, query.status));
  }

  if (query.plotLocation) {
    conditions.push(ilike(schema.enquiries.plotLocation, `%${query.plotLocation}%`));
  }

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push(
      or(
        ilike(schema.enquiries.fullName, searchPattern),
        ilike(schema.enquiries.phone, searchPattern),
        ilike(schema.enquiries.email, searchPattern),
        ilike(schema.enquiries.estimateNumber, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total records
  const totalCountResult = await db
    .select({ count: count() })
    .from(schema.enquiries)
    .where(whereClause);

  const total = Number(totalCountResult[0]?.count || 0);

  // Fetch paginated rows
  const sortColumns: Record<string, any> = {
    createdAt: schema.enquiries.createdAt,
    fullName: schema.enquiries.fullName,
    plotLocation: schema.enquiries.plotLocation,
    status: schema.enquiries.status,
    estimateNumber: schema.enquiries.estimateNumber,
  };
  const sortCol = sortColumns[query.sortBy || 'createdAt'] || schema.enquiries.createdAt;
  const orderByClause = query.sortOrder === 'asc' ? asc(sortCol) : desc(sortCol);

  const rows = await db
    .select({
      id: schema.enquiries.id,
      estimateId: schema.enquiries.estimateId,
      estimateNumber: schema.enquiries.estimateNumber,
      fullName: schema.enquiries.fullName,
      phone: schema.enquiries.phone,
      email: schema.enquiries.email,
      plotLocation: schema.enquiries.plotLocation,
      preferredContactTime: schema.enquiries.preferredContactTime,
      requirementNotes: schema.enquiries.requirementNotes,
      status: schema.enquiries.status,
      adminNotes: schema.enquiries.adminNotes,
      createdAt: schema.enquiries.createdAt,
      updatedAt: schema.enquiries.updatedAt,
      // Optional estimate summary if linked
      estimateTotalCost: schema.estimates.totalProjectCost,
      estimatePackageSlug: schema.estimates.packageSlug,
      estimateBuiltupArea: schema.estimates.totalBuiltupAreaSqft,
    })
    .from(schema.enquiries)
    .leftJoin(schema.estimates, eq(schema.enquiries.estimateId, schema.estimates.id))
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminEnquiryById(id: string) {
  const enquiry = await db.query.enquiries.findFirst({
    where: eq(schema.enquiries.id, id),
  });

  if (!enquiry) {
    throw new AdminServiceError(404, 'ENQUIRY_NOT_FOUND', `Enquiry with ID ${id} not found`);
  }

  let linkedEstimate = null;
  if (enquiry.estimateId) {
    linkedEstimate = await db.query.estimates.findFirst({
      where: eq(schema.estimates.id, enquiry.estimateId),
    });
  } else if (enquiry.estimateNumber) {
    linkedEstimate = await db.query.estimates.findFirst({
      where: eq(schema.estimates.estimateNumber, enquiry.estimateNumber),
    });
  }

  return {
    ...enquiry,
    estimate: linkedEstimate,
  };
}

export async function updateAdminEnquiry(id: string, dto: UpdateEnquiryDto) {
  const existing = await db.query.enquiries.findFirst({
    where: eq(schema.enquiries.id, id),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'ENQUIRY_NOT_FOUND', `Enquiry with ID ${id} not found`);
  }

  const [updated] = await db
    .update(schema.enquiries)
    .set({
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
      updatedAt: new Date(),
    })
    .where(eq(schema.enquiries.id, id))
    .returning();

  return updated;
}

// ----------------------------------------------------
// ESTIMATES SERVICE
// ----------------------------------------------------

export async function getAdminEstimates(query: EstimatesQuery) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.status) {
    conditions.push(eq(schema.estimates.status, query.status));
  }

  if (query.packageSlug) {
    conditions.push(eq(schema.estimates.packageSlug, query.packageSlug));
  }

  if (query.locationId) {
    conditions.push(eq(schema.estimates.locationId, query.locationId));
  }

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push(
      or(
        ilike(schema.estimates.estimateNumber, searchPattern),
        ilike(schema.estimates.customerName, searchPattern),
        ilike(schema.estimates.customerPhone, searchPattern),
        ilike(schema.estimates.customerEmail, searchPattern),
        ilike(schema.estimates.plotLocation, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCountResult = await db
    .select({ count: count() })
    .from(schema.estimates)
    .where(whereClause);

  const total = Number(totalCountResult[0]?.count || 0);

  const sortColumns: Record<string, any> = {
    createdAt: schema.estimates.createdAt,
    estimateNumber: schema.estimates.estimateNumber,
    customerName: schema.estimates.customerName,
    plotLocation: schema.estimates.plotLocation,
    totalProjectCost: schema.estimates.totalProjectCost,
    totalBuiltupAreaSqft: schema.estimates.totalBuiltupAreaSqft,
    status: schema.estimates.status,
  };
  const sortCol = sortColumns[query.sortBy || 'createdAt'] || schema.estimates.createdAt;
  const orderByClause = query.sortOrder === 'asc' ? asc(sortCol) : desc(sortCol);

  const rows = await db
    .select({
      id: schema.estimates.id,
      estimateNumber: schema.estimates.estimateNumber,
      customerName: schema.estimates.customerName,
      customerPhone: schema.estimates.customerPhone,
      customerEmail: schema.estimates.customerEmail,
      plotLocation: schema.estimates.plotLocation,
      totalBuiltupAreaSqft: schema.estimates.totalBuiltupAreaSqft,
      packageSlug: schema.estimates.packageSlug,
      packageRatePerSqft: schema.estimates.packageRatePerSqft,
      baseConstructionCost: schema.estimates.baseConstructionCost,
      upgradesCost: schema.estimates.upgradesCost,
      addonsCost: schema.estimates.addonsCost,
      subtotalCost: schema.estimates.subtotalCost,
      totalProjectCost: schema.estimates.totalProjectCost,
      pdfUrl: schema.estimates.pdfUrl,
      status: schema.estimates.status,
      createdAt: schema.estimates.createdAt,
      updatedAt: schema.estimates.updatedAt,
    })
    .from(schema.estimates)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminEstimateById(idOrEstimateNumber: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrEstimateNumber);

  const estimate = await db.query.estimates.findFirst({
    where: isUuid
      ? eq(schema.estimates.id, idOrEstimateNumber)
      : eq(schema.estimates.estimateNumber, idOrEstimateNumber),
  });

  if (!estimate) {
    throw new AdminServiceError(404, 'ESTIMATE_NOT_FOUND', `Estimate ${idOrEstimateNumber} not found`);
  }

  // Fetch items and addons
  const items = await db.query.estimateItems.findMany({
    where: eq(schema.estimateItems.estimateId, estimate.id),
  });

  const addons = await db.query.estimateAddons.findMany({
    where: eq(schema.estimateAddons.estimateId, estimate.id),
  });

  return {
    ...estimate,
    items,
    addons,
  };
}

export async function updateAdminEstimate(id: string, dto: UpdateEstimateDto) {
  const existing = await db.query.estimates.findFirst({
    where: eq(schema.estimates.id, id),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'ESTIMATE_NOT_FOUND', `Estimate with ID ${id} not found`);
  }

  const [updated] = await db
    .update(schema.estimates)
    .set({
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.pdfUrl !== undefined && { pdfUrl: dto.pdfUrl }),
      updatedAt: new Date(),
    })
    .where(eq(schema.estimates.id, id))
    .returning();

  return updated;
}

// ----------------------------------------------------
// ANALYTICS & DASHBOARD KPIS
// ----------------------------------------------------

export async function getAdminDashboardAnalytics() {
  // 1. Total estimates and pipeline valuation
  const estimateAggregates = await db
    .select({
      totalCount: count(),
      totalPipelineValue: sql<string>`COALESCE(SUM(CAST(${schema.estimates.totalProjectCost} AS NUMERIC)), 0)`,
      avgProjectValue: sql<string>`COALESCE(AVG(CAST(${schema.estimates.totalProjectCost} AS NUMERIC)), 0)`,
      avgBuiltupArea: sql<string>`COALESCE(AVG(CAST(${schema.estimates.totalBuiltupAreaSqft} AS NUMERIC)), 0)`,
    })
    .from(schema.estimates);

  // 2. Total enquiries and status breakdown
  const enquiryAggregates = await db
    .select({
      totalCount: count(),
    })
    .from(schema.enquiries);

  const enquiriesByStatus = await db
    .select({
      status: schema.enquiries.status,
      count: count(),
    })
    .from(schema.enquiries)
    .groupBy(schema.enquiries.status);

  // 3. Estimates breakdown by Package
  const estimatesByPackage = await db
    .select({
      packageSlug: schema.estimates.packageSlug,
      count: count(),
      totalValue: sql<string>`COALESCE(SUM(CAST(${schema.estimates.totalProjectCost} AS NUMERIC)), 0)`,
    })
    .from(schema.estimates)
    .groupBy(schema.estimates.packageSlug);

  // 4. Estimates breakdown by Location
  const estimatesByLocation = await db
    .select({
      plotLocation: schema.estimates.plotLocation,
      count: count(),
      totalValue: sql<string>`COALESCE(SUM(CAST(${schema.estimates.totalProjectCost} AS NUMERIC)), 0)`,
    })
    .from(schema.estimates)
    .groupBy(schema.estimates.plotLocation);

  // 5. Recent 5 estimates
  const recentEstimates = await db
    .select({
      id: schema.estimates.id,
      estimateNumber: schema.estimates.estimateNumber,
      customerName: schema.estimates.customerName,
      customerPhone: schema.estimates.customerPhone,
      packageSlug: schema.estimates.packageSlug,
      plotLocation: schema.estimates.plotLocation,
      totalProjectCost: schema.estimates.totalProjectCost,
      createdAt: schema.estimates.createdAt,
      status: schema.estimates.status,
    })
    .from(schema.estimates)
    .orderBy(desc(schema.estimates.createdAt))
    .limit(5);

  // 6. Recent 5 enquiries
  const recentEnquiries = await db
    .select({
      id: schema.enquiries.id,
      estimateNumber: schema.enquiries.estimateNumber,
      fullName: schema.enquiries.fullName,
      phone: schema.enquiries.phone,
      plotLocation: schema.enquiries.plotLocation,
      status: schema.enquiries.status,
      createdAt: schema.enquiries.createdAt,
    })
    .from(schema.enquiries)
    .orderBy(desc(schema.enquiries.createdAt))
    .limit(5);

  const totalEstimates = Number(estimateAggregates[0]?.totalCount || 0);
  const totalEnquiries = Number(enquiryAggregates[0]?.totalCount || 0);
  const totalPipelineValue = Number(estimateAggregates[0]?.totalPipelineValue || 0);
  const avgProjectValue = Math.round(Number(estimateAggregates[0]?.avgProjectValue || 0));
  const avgBuiltupArea = Math.round(Number(estimateAggregates[0]?.avgBuiltupArea || 0));

  const statusMap: Record<string, number> = {};
  for (const row of enquiriesByStatus) {
    statusMap[row.status] = Number(row.count);
  }

  const newEnquiriesCount = statusMap['NEW'] || 0;
  const closedWonCount = statusMap['CLOSED_WON'] || 0;
  const conversionRate = totalEnquiries > 0 ? Number(((closedWonCount / totalEnquiries) * 100).toFixed(2)) : 0;

  return {
    kpis: {
      totalEstimates,
      totalPipelineValue,
      avgProjectValue,
      avgBuiltupArea,
      totalEnquiries,
      newEnquiriesCount,
      closedWonCount,
      conversionRate,
    },
    enquiriesByStatus: statusMap,
    estimatesByPackage: estimatesByPackage.map((p) => ({
      packageSlug: p.packageSlug,
      count: Number(p.count),
      totalValue: Number(p.totalValue),
    })),
    estimatesByLocation: estimatesByLocation.map((l) => ({
      location: l.plotLocation,
      count: Number(l.count),
      totalValue: Number(l.totalValue),
    })),
    recentEstimates,
    recentEnquiries,
  };
}
