import type { NextFunction, Request, Response } from 'express'
import { parseId } from '../../validation/validators'
import {
  createService,
  getServiceById,
  listServices,
  updateService,
  updateServiceStatus,
} from './services.service'

// Controllers stay thin on purpose: read the request, call the service layer,
// send the result. All rules live in services.service.ts so they can be unit
// tested without spinning up Express.

export async function getServices(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ services: listServices() })
  } catch (err) {
    next(err)
  }
}

export async function getService(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(String(req.params.id), 'Service id')
    res.json({ service: getServiceById(id) })
  } catch (err) {
    next(err)
  }
}

export async function postService(req: Request, res: Response, next: NextFunction) {
  try {
    const service = createService(req.body)
    res.status(201).json({ service })
  } catch (err) {
    next(err)
  }
}

export async function putService(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(String(req.params.id), 'Service id')
    const service = updateService(id, req.body)
    res.json({ service })
  } catch (err) {
    next(err)
  }
}

export async function patchServiceStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(String(req.params.id), 'Service id')
    const service = updateServiceStatus(id, req.body)
    res.json({ service })
  } catch (err) {
    next(err)
  }
}
