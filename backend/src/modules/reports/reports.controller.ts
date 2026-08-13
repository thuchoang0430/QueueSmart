import type { NextFunction, Request, Response } from 'express'
import { generateReport, parseReportFilter } from './reports.service'

// Thin as ever: parse and validate the query into a filter, hand it to the
// service, send the aggregated report. The route guards admin access, so by the
// time we get here the caller is a known admin.

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = parseReportFilter(req.query)
    // Sent unwrapped (no { report }) so the payload is exactly the frontend contract.
    res.json(await generateReport(filter))
  } catch (err) {
    next(err)
  }
}
