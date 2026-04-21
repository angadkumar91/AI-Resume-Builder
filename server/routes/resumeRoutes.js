import { Router } from "express";
import {
  getATSScore,
  parseResume,
} from "../controllers/resumeController.js";

const router = Router();

router.post("/parse-resume", parseResume);
router.post("/ats-score", getATSScore);

export default router;
