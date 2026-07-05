import { Router } from "express";
import type { CaseService } from "../services/CaseService";

export const createCaseRoutes = (caseService: CaseService) => {
  const router = Router();

  router.post("/case/start", (_req, res, next) => {
    try {
      res.json(caseService.startCase());
    } catch (error) {
      next(error);
    }
  });

  router.get("/case/:caseId", (req, res, next) => {
    try {
      res.json(caseService.getCase(req.params.caseId));
    } catch (error) {
      next(error);
    }
  });

  router.post("/case/:caseId/investigate", (req, res, next) => {
    try {
      res.json(caseService.investigate(req.params.caseId, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.post("/case/:caseId/final-report", (req, res, next) => {
    try {
      res.json(caseService.submitFinalReport(req.params.caseId, req.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
};
