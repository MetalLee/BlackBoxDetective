import { Router } from "express";
import type { CaseService } from "../services/CaseService";

export const createInterrogationRoutes = (caseService: CaseService) => {
  const router = Router();

  router.post("/interrogate", (req, res, next) => {
    try {
      res.json(caseService.interrogate(req.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
};
