import { Request, Response, NextFunction } from 'express';
import { generateEstimatePdf, PdfGenerationError } from './pdf.service.js';

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

    const pdfBuffer = await generateEstimatePdf(identifier);

    const isDownload = req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';

    // Quotation numbers carry slashes (AW/2026/O/0001), which are not legal in a
    // filename and would truncate or corrupt the saved file name.
    const safeName = identifier.replace(/[\\/:*?"<>|]+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="ASTHIWAR-${safeName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
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
