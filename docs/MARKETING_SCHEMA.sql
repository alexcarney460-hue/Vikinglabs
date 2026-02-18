-- Viking Labs Marketing Hub - Supabase Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: marketing_brand_docs
-- Stores brand voice, compliance guidelines, output formats, and schema templates
CREATE TABLE public.marketing_brand_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('voice', 'compliance', 'formats', 'output_schema')),
  version INT NOT NULL DEFAULT 1,
  content_md TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, version)
);

-- Table: marketing_content_queue
-- Stores content drafts pushed by the agent system, awaiting admin review
CREATE TABLE public.marketing_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  format TEXT NOT NULL,
  topic TEXT NOT NULL,
  hook TEXT NOT NULL,
  script JSONB NOT NULL, -- array of strings
  caption TEXT NOT NULL,
  hashtags JSONB NOT NULL, -- array of strings
  cta TEXT NOT NULL,
  compliance JSONB NOT NULL, -- {risk_score: number, flags: [string], notes: string}
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'killed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX marketing_content_queue_status_idx ON public.marketing_content_queue(status);
CREATE INDEX marketing_content_queue_platform_idx ON public.marketing_content_queue(platform);
CREATE INDEX marketing_content_queue_created_at_idx ON public.marketing_content_queue(created_at DESC);

-- RLS: Enable row-level security
ALTER TABLE public.marketing_brand_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow read-only access via service role (API routes)
-- Public tables accessed only via authenticated API routes with marketing key
CREATE POLICY "Enable read access for service role only" ON public.marketing_brand_docs
  FOR SELECT USING (true);

CREATE POLICY "Enable all access for service role only" ON public.marketing_content_queue
  FOR ALL USING (true);

-- Insert seed data for brand docs
INSERT INTO public.marketing_brand_docs (type, version, content_md) VALUES
(
  'voice',
  1,
  E'# Brand Voice & Tone Guidelines\n\n## Viking Labs Voice\n\n### Core Attributes\n- **Premium but accessible**: Clinical precision without intimidation\n- **Trustworthy**: Evidence-based, compliant with all regulations\n- **Empowering**: Focused on informed decision-making and self-care\n- **Direct**: No hype, no buzzwords. Facts first.\n\n### Tone Rules\n- Avoid medical claims. Focus on research, quality, and transparency.\n- Never suggest dosing, treatment duration, or medical advice.\n- Use "may support," "research suggests," "evidence indicates" instead of guarantees.\n- Highlight rigorous testing, third-party verification, and safety standards.\n- Celebrate customer autonomy and informed choice.\n\n### Do\n✓ Precision in language (correct terminology)\n✓ Confidence in quality (manufacturing, testing, compliance)\n✓ Transparency in sourcing and batch data\n✓ Educational (research summaries, mechanism of action for research)\n✓ Inclusive (all body types, backgrounds, goals)\n\n### Don\'t\n✗ Medical claims ("treats," "cures," "diagnoses")\n✗ Dosing guidance ("take X per day")\n✗ Comparisons to pharmaceuticals\n✗ Unsubstantiated performance claims\n✗ Testimonials implying health outcomes'
),
(
  'compliance',
  1,
  E'# Compliance & Legal Framework\n\n## Regulatory Scope (US/EU)\n\n### What We Can Say\n- Product sourcing and purity (e.g., "99.2% purity verified by third-party HPLC")\n- Manufacturing practices (e.g., "GMP-compliant facility," "batch tracked")\n- Research context (e.g., "In vitro studies indicate potential for...," "Animal models suggest...")\n- Customer use cases and goals (e.g., "Support research on longevity")\n\n### What We Cannot Say\n- Medical claims: "Treats diabetes," "Cures cancer," "Prevents disease"\n- Dosing recommendations: "Take 250mg daily," "Optimal dose is..."\n- Health outcomes: "Lose 10 lbs," "Improve blood pressure"\n- Comparisons to drugs: "Better than metformin," "Works like insulin"\n\n## Risk Assessment\n- **High Risk** (>0.7): Medical claims, dosing, disease treatment language\n- **Medium Risk** (0.4-0.7): Unverified benefit claims, medical context without disclaimers\n- **Low Risk** (<0.4): Educational, research-focused, compliance-safe language\n\n## Flags\n- `medical_claim`: Any language suggesting disease treatment\n- `dosing_guidance`: Specific quantities or frequency\n- `unverified_benefit`: Health claims without citations\n- `prohibited_context`: Mixing with prescription drugs\n\n## Post Before Publishing\nAll content >0.4 risk requires compliance review. Content >0.7 is auto-rejected.'
),
(
  'formats',
  1,
  E'# Content Format Guidelines\n\n## TikTok Format\n- **Length**: 15-60 seconds optimal\n- **Hook**: First 3 words must stop the scroll\n- **Script**: 5-7 short punchy lines (one visual per line)\n- **Hashtags**: 3-5 relevant, mix trending + niche\n- **CTA**: "Save this," "Drop a 🧬," "Link in bio"\n- **Captions**: Emoji-light, character limit 150\n\n## Instagram Reel Format\n- **Length**: 15-90 seconds\n- **Hook**: Same as TikTok (first 3 seconds critical)\n- **Script**: 6-8 lines, align with visual transitions\n- **Hashtags**: 20-30 mix (trending, niche, brand)\n- **CTA**: "DM for details," "Shop link in bio," "Save for later"\n- **Captions**: Can be longer, use line breaks for readability\n\n## Cross-Platform Tips\n- Vertical video (9:16) for both platforms\n- Text overlays max 2 per video\n- B-roll: 2-3 second clips, smooth transitions\n- Audio: Trending sounds OR Viking Labs branded audio\n- Color palette: Amber/black (brand colors), high contrast for accessibility'
),
(
  'output_schema',
  1,
  E'# API Output Schema\n\n## POST /api/marketing/content Request Schema\n\n```json\n{\n  "platform": "tiktok|instagram",\n  "format": "string (short format description)",\n  "topic": "string (e.g., \'Peptides for longevity\')",\n  "hook": "string (first 3 words that stop the scroll)",\n  "script": [\n    "string (line 1)",\n    "string (line 2)"\n  ],\n  "caption": "string (platform-specific caption text)",\n  "hashtags": [\n    "#string",\n    "#string"\n  ],\n  "cta": "string (call-to-action)",\n  "compliance": {\n    "risk_score": 0.0 to 1.0,\n    "flags": [\n      "medical_claim|dosing_guidance|unverified_benefit|prohibited_context"\n    ],\n    "notes": "string (human-readable summary of compliance review)"\n  }\n}\n```\n\n## Response (201 Created)\n\n```json\n{\n  "id": "uuid",\n  "row": {\n    "id": "uuid",\n    "platform": "tiktok",\n    "format": "...",\n    "topic": "...",\n    "hook": "...",\n    "script": [...],\n    "caption": "...",\n    "hashtags": [...],\n    "cta": "...",\n    "compliance": {...},\n    "status": "draft",\n    "created_at": "2026-02-18T...",\n    "updated_at": "2026-02-18T..."\n  }\n}\n```'
);

-- Verify seed data inserted
SELECT 'Seed data inserted successfully' AS status;
SELECT COUNT(*) as brand_doc_count FROM public.marketing_brand_docs;
SELECT COUNT(*) as content_queue_count FROM public.marketing_content_queue;
