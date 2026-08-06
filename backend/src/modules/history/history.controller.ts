import type { NextFunction, Request, Response } from "express";
import { getUserHistory } from "./history.service";

export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const history = await getUserHistory(req.user!.id);

    res.json({
      history,
    });
  } catch (error) {
    next(error);
  }
}
