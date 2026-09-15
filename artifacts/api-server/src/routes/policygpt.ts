import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import {
  CheckEligibilityBody,
  CheckEligibilityResponse,
  CreatePolicyBody,
  CreatePolicyResponse,
  GetDashboardSummaryResponse,
  GetPolicyParams,
  GetPolicyResponse,
  GetSchemeParams,
  GetSchemeResponse,
  ListActivityResponse,
  ListNotificationsResponse,
  ListPoliciesQueryParams,
  ListPoliciesResponse,
  ListSchemesQueryParams,
  ListSchemesResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  SubmitFeedbackBody,
  SubmitFeedbackResponse,
  UpdatePolicyBody,
  UpdatePolicyParams,
  UpdatePolicyResponse,
} from "@workspace/api-zod";
import type { Feedback, Policy } from "@workspace/api-zod";
import {
  createFeedback,
  createPolicy,
  getDashboardSummary,
  getPolicy,
  getScheme,
  listActivity,
  listNotifications,
  listPolicies,
  listSchemes,
  markNotificationRead,
  updatePolicy,
} from "../lib/policy-db";

type AuthenticatedRequest = Request & { userId?: string; userRole?: string };

const router: IRouter = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  req.userId = userId;
  req.userRole =
    ((auth.sessionClaims as { metadata?: { role?: string } } | undefined)?.metadata?.role ??
      "citizen_researcher");
  next();
}

function requireOfficial(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowedRoles = new Set([
    "admin",
    "administrator",
    "official",
    "government_official",
    "Government official",
  ]);
  if (!req.userRole || !allowedRoles.has(req.userRole)) {
    res.status(403).json({ error: "Government official or administrator role required" });
    return;
  }
  next();
}

router.use(requireAuth);

router.get("/dashboard/summary", async (_req, res) => {
  res.json(GetDashboardSummaryResponse.parse(await getDashboardSummary()));
});

router.get("/dashboard/activity", async (_req, res) => {
  res.json(ListActivityResponse.parse(await listActivity()));
});

router.get("/policies", async (req, res) => {
  const parsed = ListPoliciesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { query = "", category, state, status, limit = 20 } = parsed.data;
  const search = query.trim().toLowerCase();
  const result = (await listPolicies())
    .filter((policy) => {
      const haystack = [policy.title, policy.summary, policy.ministry, ...policy.tags].join(" ").toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (!category || policy.category === category) &&
        (!state || policy.state === state) &&
        (!status || policy.status === status)
      );
    })
    .slice(0, limit);
  res.json(ListPoliciesResponse.parse(result));
});

router.post("/policies", requireOfficial, async (req: AuthenticatedRequest, res) => {
  const parsed = CreatePolicyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const next: Omit<Policy, "id"> = {
    ...parsed.data,
    status: "Draft",
    publishedDate: new Date().toISOString().slice(0, 10),
    tags: parsed.data.tags ?? [],
    impact: "Pending",
  };
  const created = await createPolicy(next);
  res.status(201).json(CreatePolicyResponse.parse(created));
});

router.get("/policies/:id", async (req, res) => {
  const parsed = GetPolicyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const policy = await getPolicy(parsed.data.id);
  if (!policy) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }
  res.json(GetPolicyResponse.parse(policy));
});

router.patch("/policies/:id", requireOfficial, async (req, res) => {
  const params = UpdatePolicyParams.safeParse(req.params);
  const body = UpdatePolicyBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid policy update" });
    return;
  }
  const policy = await updatePolicy(params.data.id, body.data);
  if (!policy) {
    res.status(404).json({ error: "Policy not found" });
    return;
  }
  res.json(UpdatePolicyResponse.parse(policy));
});

router.get("/schemes", async (req, res) => {
  const parsed = ListSchemesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { query = "", category, state, limit = 20 } = parsed.data;
  const search = query.trim().toLowerCase();
  const result = (await listSchemes())
    .filter((scheme) => {
      const haystack = [scheme.name, scheme.description, scheme.ministry, scheme.beneficiaries, ...scheme.eligibility].join(" ").toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (!category || scheme.category === category) &&
        (!state || scheme.state === state)
      );
    })
    .slice(0, limit);
  res.json(ListSchemesResponse.parse(result));
});

router.get("/schemes/:id", async (req, res) => {
  const parsed = GetSchemeParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const scheme = await getScheme(parsed.data.id);
  if (!scheme) {
    res.status(404).json({ error: "Scheme not found" });
    return;
  }
  res.json(GetSchemeResponse.parse(scheme));
});

router.post("/eligibility/check", async (req, res) => {
  const parsed = CheckEligibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = parsed.data;
  const schemes = await listSchemes();
  const recommended = schemes.filter((scheme) => {
    if (scheme.id === 201) return profile.occupation.toLowerCase().includes("farm") || profile.income < 300000;
    if (scheme.id === 202) return profile.socialCategory.toLowerCase() === "sc" && profile.education !== "Below secondary";
    if (scheme.id === 203) return profile.income < 500000;
    if (scheme.id === 204) return profile.income < 600000;
    if (scheme.id === 205) return profile.occupation.toLowerCase().includes("business") || profile.occupation.toLowerCase().includes("entre");
    return profile.age >= 14 && profile.age <= 35;
  });
  const safeRecommended = recommended.length ? recommended.slice(0, 4) : schemes.slice(0, 2);
  res.json(
    CheckEligibilityResponse.parse({
      matchCount: safeRecommended.length,
      summary: `${safeRecommended.length} programs match your profile. Review each scheme's documents and application requirements before applying.`,
      recommended: safeRecommended,
    }),
  );
});

router.get("/notifications", async (_req, res) => {
  res.json(ListNotificationsResponse.parse(await listNotifications()));
});

router.patch("/notifications/:id/read", async (req, res) => {
  const parsed = MarkNotificationReadParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const notification = await markNotificationRead(parsed.data.id);
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(notification));
});

router.post("/feedback", async (req: AuthenticatedRequest, res) => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const next: Omit<Feedback, "id" | "status"> = parsed.data;
  const created = await createFeedback(next, req.userId);
  res.status(201).json(SubmitFeedbackResponse.parse(created));
});

export default router;