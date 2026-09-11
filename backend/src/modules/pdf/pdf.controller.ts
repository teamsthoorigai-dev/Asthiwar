import { Request, Response, NextFunction } from 'express';
import { generateEstimatePdf, PdfGenerationError } from './pdf.service.js';
import {
  EstimateAccessError,
  findEstimateByRef,
  resolveEstimateForPublicAccess,
} from '../calculator/quotation.js';

/**
 * Serves a quotation PDF on two routes with two different callers.
 *
 * `/api/v1/admin/estimates/:id/pdf` sits behind requireAdminAuth, so `req.user`
 * is set and the estimate is served on the strength of that session.
 *
 * `/api/v1/calculator/estimate/:estimateNumber/pdf` is public and has no session
 * to go on. Quotation numbers are a sequence, so that route used to hand the
 * branded document — customer name, phone, project value — to anyone counting
 * upwards. It now requires the access token from the customer's own link.
 */
export async function downloadEstimatePdfController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = (req.params.estimateNumber || req.params.id) as string;
    if (!identifier) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Estimate number or ID is required' },
      });
      return;
    }

    const isAuthenticatedAdmin = Boolean(req.user);
    const estimate = isAuthenticatedAdmin
      ? await findEstimateByRef(identifier)
      : await resolveEstimateForPublicAccess(identifier, req.query.t);

    if (!estimate) {
      res.status(404).json({
        success: false,
        error: { code: 'ESTIMATE_NOT_FOUND', message: `Estimate ${identifier} not found` },
      });
      return;
    }

    // Resolved by primary key: the access decision is made once, here, and the
    // generator is not asked to repeat the lookup under a looser rule.
    const pdfBuffer = await generateEstimatePdf(estimate.id);

    const isDownload = req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';

    // Quotation numbers carry slashes (AW/2026/O/0001), which are not legal in a
    // filename and would truncate or corrupt the saved file name.
    const safeName = estimate.estimateNumber.replace(/[\/:*?"<>|]+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="ASTHIWAR-${safeName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    // A quotation is personal and token-authorised — it must not be held by a
    // shared cache that a later request without the token could read from.
    res.setHeader('Cache-Control', 'private, no-store');

    res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof EstimateAccessError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    if (error instanceof PdfGenerationError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}
