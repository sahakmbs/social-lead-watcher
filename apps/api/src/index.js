import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const TENANTS = path.join(ROOT, "tenants");
const PORT = process.env.PORT || 8787;
const DEMO_MODE = process.env.DEMO_MODE !== "0";

fs.mkdirSync(TENANTS, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, demoMode: DEMO_MODE, service: "social-lead-watcher-api" });
});

app.get("/api/billing/plans", (_req, res) => {
  res.json({
    plans: [
      { id: "starter", name: "Starter", price: 49 },
      { id: "growth", name: "Growth", price: 149 },
      { id: "pro", name: "Pro", price: 349 },
    ],
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder"),
    demoMode: DEMO_MODE,
  });
});

app.post("/api/billing/checkout", (req, res) => {
  const plan = req.body?.plan || "growth";
  if (DEMO_MODE || !process.env.STRIPE_SECRET_KEY) {
    return res.json({
      ok: true,
      demo: true,
      plan,
      message: "DEMO_MODE: plan marked active locally in the Expo app (no Stripe charge).",
    });
  }
  res.status(501).json({
    ok: false,
    message: "Configure STRIPE_SECRET_KEY + STRIPE_PRICE_* to enable Checkout.",
  });
});

app.post("/api/platforms/connect", (req, res) => {
  const platform = req.body?.platform || "facebook";
  res.json({
    ok: true,
    demo: DEMO_MODE,
    platform,
    status: platform === "facebook" ? "agent_mode" : "connected",
    note:
      platform === "facebook"
        ? "Connected Page identity + agent/browser worker playbook (not Meta Graph group scraping API)."
        : "OAuth stub — adapter hook ready.",
  });
});

app.post("/api/onboarding/export", (req, res) => {
  const tenant = req.body?.tenant;
  if (!tenant?.id) return res.status(400).json({ error: "tenant required" });
  const b = tenant.onboarding?.business || {};
  const s = tenant.onboarding?.scope || {};
  const platforms = (tenant.onboarding?.platforms || []).map((type) => {
    const conn = (tenant.onboarding?.connections || []).find((c) => c.type === type);
    return {
      type,
      identity_name: conn?.identityName || "",
      sources:
        type === "facebook"
          ? [{ name: "Primary homeowner group", url: "https://www.facebook.com/groups/example" }]
          : [],
    };
  });
  const doc = {
    business_name: b.businessName || "Untitled Business",
    voice: b.voice || "friendly, professional, concise",
    website: b.website || "",
    phone: b.phone || "",
    email: b.email || "",
    license_note: b.licenseNote || "",
    service_area: s.serviceArea || [],
    in_scope: s.inScope || [],
    out_of_scope: s.outOfScope || [],
    skip_patterns: s.skipPatterns || [],
    comment_template:
      "Hi! We're {business_name} — happy to help with {need}. Reach us at {phone} or {website}. {cta}",
    dm_template:
      "Hi {author}, saw your post about {need}. {business_name} can help. Phone: {phone} | {website}. {cta}",
    max_outreach_per_run: s.maxOutreach || 3,
    schedule_hint: "every 5 minutes",
    strong_min_score: 4,
    maybe_min_score: 2,
    platforms,
  };
  const dir = path.join(TENANTS, tenant.id);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "business.yaml");
  fs.writeFileSync(out, yaml.dump(doc, { lineWidth: 100, noRefs: true }));
  res.json({ ok: true, path: out });
});

function runPython(args) {
  return new Promise((resolve) => {
    const py = path.join(ROOT, ".venv", "bin", "python");
    const bin = fs.existsSync(py) ? py : "python3";
    const child = spawn(bin, ["-m", "lead_watcher", ...args], {
      cwd: ROOT,
      env: { ...process.env, PYTHONPATH: ROOT },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

app.post("/api/preview/score", async (req, res) => {
  const text = String(req.body?.text || "");
  const config =
    req.body?.configPath ||
    path.join(ROOT, "config", "examples", "home-services.yaml");
  const result = await runPython(["score", "--config", config, "--text", text]);
  res.json({ ok: result.code === 0, raw: result.stdout.trim(), error: result.stderr });
});

app.post("/api/preview/comment", async (req, res) => {
  const need = String(req.body?.need || "your project");
  const config =
    req.body?.configPath ||
    path.join(ROOT, "config", "examples", "home-services.yaml");
  const result = await runPython(["render-comment", "--config", config, "--need", need]);
  res.json({ ok: result.code === 0, comment: result.stdout.trim(), error: result.stderr });
});

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT} (DEMO_MODE=${DEMO_MODE})`);
});
