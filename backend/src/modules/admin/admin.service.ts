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
  gte,
  lte,
} from '@asthiwar/database';
import {
  EnquiriesQuery,
  UpdateEnquiryDto,
  EstimatesQuery,
  UpdateEstimateDto,
  AuditLogsQuery,
} from './admin.schema.js';
import { estimateRefCandidates } from '../calculator/quotation.js';

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

  if (query.priority) {
    conditions.push(eq(schema.enquiries.priority, query.priority));
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
    priority: schema.enquiries.priority,
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
      priority: schema.enquiries.priority,
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
      ...(dto.priority !== undefined && { priority: dto.priority }),
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

  let estimate = isUuid
    ? await db.query.estimates.findFirst({
        where: eq(schema.estimates.id, idOrEstimateNumber),
      })
    : undefined;

  if (!isUuid) {
    // A quotation number reaches a URL in its dash form (AW-2026-O-0018) because
    // the printed slashes cannot survive an Express path segment. Matching the
    // stored value exactly meant the admin console could not open an estimate by
    // the number on the customer's own PDF. The public endpoint already resolves
    // both spellings through estimateRefCandidates; this is the same lookup.
    for (const candidate of estimateRefCandidates(idOrEstimateNumber.toUpperCase())) {
      estimate = await db.query.estimates.findFirst({
        where: eq(schema.estimates.estimateNumber, candidate),
      });
      if (estimate) break;
    }
  }

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
  //
  // Grouped by the location the estimate actually resolved to, not by the raw text
  // the customer typed. `plot_location` is free text, so grouping on it split one
  // city across several bars — "Chennai", "chennai" and " Chennai " counted as
  // three separate markets, understating every one of them.
  //
  // Rows whose location never resolved to a catalogue entry (location_id is null,
  // or the city was later deleted) still have to appear, so they fall back to a
  // case- and whitespace-normalised form of what was typed.
  const locationLabel = sql<string>`COALESCE(${schema.locations.name}, initcap(btrim(${schema.estimates.plotLocation})))`;

  const estimatesByLocation = await db
    .select({
      plotLocation: locationLabel,
      count: count(),
      totalValue: sql<string>`COALESCE(SUM(CAST(${schema.estimates.totalProjectCost} AS NUMERIC)), 0)`,
    })
    .from(schema.estimates)
    .leftJoin(schema.locations, eq(schema.locations.id, schema.estimates.locationId))
    .groupBy(locationLabel)
    .orderBy(desc(count()));

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

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

/**
 * Read the audit trail.
 *
 * Three call sites write to `audit_logs` — the global error handler, the admin
 * config controller and the calculator controller — and until now nothing read
 * it. A compliance table nobody can query is not a compliance measure, it is
 * storage.
 *
 * `errorStack` is deliberately not selected: stack traces are for the server log,
 * not a console list, and they dominate the payload. Fetch a single row for that.
 */
export async function getAdminAuditLogs(query: AuditLogsQuery) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.eventType) conditions.push(eq(schema.auditLogs.eventType, query.eventType));
  if (query.severity) conditions.push(eq(schema.auditLogs.severity, query.severity));
  if (query.actorType) conditions.push(eq(schema.auditLogs.actorType, query.actorType));
  if (query.action) conditions.push(eq(schema.auditLogs.action, query.action));
  if (query.from) conditions.push(gte(schema.auditLogs.createdAt, query.from));
  if (query.to) conditions.push(lte(schema.auditLogs.createdAt, query.to));

  if (query.search) {
    const searchPattern = `%${query.search}%`;
    conditions.push(
      or(
        ilike(schema.auditLogs.action, searchPattern),
        ilike(schema.auditLogs.endpoint, searchPattern),
        ilike(schema.auditLogs.errorMessage, searchPattern),
        ilike(schema.auditLogs.actorId, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCountResult = await db
    .select({ count: count() })
    .from(schema.auditLogs)
    .where(whereClause);

  const total = Number(totalCountResult[0]?.count || 0);

  const sortColumns: Record<string, any> = {
    createdAt: schema.auditLogs.createdAt,
    severity: schema.auditLogs.severity,
    eventType: schema.auditLogs.eventType,
    statusCode: schema.auditLogs.statusCode,
  };
  const sortCol = sortColumns[query.sortBy || 'createdAt'] || schema.auditLogs.createdAt;
  const orderByClause = query.sortOrder === 'asc' ? asc(sortCol) : desc(sortCol);

  const rows = await db
    .select({
      id: schema.auditLogs.id,
      eventType: schema.auditLogs.eventType,
      action: schema.auditLogs.action,
      severity: schema.auditLogs.severity,
      actorType: schema.auditLogs.actorType,
      actorId: schema.auditLogs.actorId,
      endpoint: schema.auditLogs.endpoint,
      httpMethod: schema.auditLogs.httpMethod,
      statusCode: schema.auditLogs.statusCode,
      errorMessage: schema.auditLogs.errorMessage,
      ipAddress: schema.auditLogs.ipAddress,
      userAgent: schema.auditLogs.userAgent,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
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
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

/** One audit entry in full, including the stack trace the list omits. */
export async function getAdminAuditLogById(id: number) {
  const row = await db.query.auditLogs.findFirst({
    where: eq(schema.auditLogs.id, id),
  });

  if (!row) {
    throw new AdminServiceError(404, 'AUDIT_LOG_NOT_FOUND', `Audit log ${id} not found`);
  }

  return row;
}
