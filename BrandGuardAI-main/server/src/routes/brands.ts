import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/repository.js';
import { requireAuth, requireRoles } from '../auth/middleware.js';
import type { Brand, BrandGuidelines } from '../types.js';

export const brandsRouter = Router();

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional().default(''),
});

brandsRouter.get('/brands', async (_req, res) => {
  try {
    const brands = await db.getBrands();
    res.json(brands);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: Only Administrator can create brands
brandsRouter.post('/brands', requireAuth, requireRoles(['Administrator']), async (req, res) => {
  try {
    const parsed = createBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
    }

    const brandId = `brand-${Date.now().toString(36)}`;
    const brand: Brand = {
      id: brandId,
      name: parsed.data.name.trim(),
      description: parsed.data.description.trim(),
      createdAt: new Date().toISOString(),
    };

    await db.createBrand(brand);

    // Also initialize empty guidelines for the brand
    const guidelines: BrandGuidelines = {
      id: `guide-${Date.now().toString(36)}`,
      brandId: brand.id,
      description: `${brand.name} brand guidelines.`,
      approvedSlogans: [],
      voiceAndTone: [],
      preferredWords: [],
      prohibitedWords: [],
      approvedFacts: [],
      restrictedClaims: [],
      requiredDisclaimers: [],
      logoRules: [],
      brandColors: [],
      accessibilityRequirements: [],
    };
    await db.saveGuidelines(guidelines);

    res.status(201).json(brand);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: Only Administrator can delete brands
brandsRouter.delete('/brands/:id', requireAuth, requireRoles(['Administrator']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteBrand(id);
    res.json({ success: true, message: 'Brand deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

brandsRouter.get('/guidelines', async (_req, res) => {
  try {
    const guidelines = await db.getGuidelines();
    res.json(guidelines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

brandsRouter.get('/guidelines/:brandId', async (req, res) => {
  try {
    const { brandId } = req.params;
    const g = await db.getGuidelinesByBrandId(brandId);
    if (!g) return res.status(404).json({ error: 'Guidelines not found for this brand' });
    res.json(g);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected: Only Administrator can update guidelines
brandsRouter.put('/guidelines/:id', requireAuth, requireRoles(['Administrator']), async (req, res) => {
  try {
    const g = req.body as BrandGuidelines;
    if (!g.id || !g.brandId) {
      return res.status(400).json({ error: 'Invalid guidelines payload: missing id or brandId' });
    }
    const saved = await db.saveGuidelines(g);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
