import type { NextFunction, Request, Response } from 'express'
import { generateReport, listAllHistory, parseReportFilter } from './reports.service'

// Thin as ever: parse and validate the query into a filter, hand it to the
// service, send the result. The routes guard admin access, so by the time we
// get here the caller is a known admin.

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = parseReportFilter(req.query)
    // Sent unwrapped (no { report }) so the payload is exactly the frontend contract.
    res.json(await generateReport(filter))
  } catch (err) {
    next(err)
  }
}

export async function getHistoryReport(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = parseReportFilter(req.query)
    // Wrapped in { history } to match GET /api/history's shape.
    res.json({ history: await listAllHistory(filter) })
  } catch (err) {
    next(err)
  }
}
