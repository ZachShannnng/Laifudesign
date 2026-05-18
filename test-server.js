import express from 'express';
import cors from 'cors';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { renderDesignSystemPreview } from './dist/main/design-system-preview.js';

const app = express();
app.use(cors());

// GET /api/design-systems/:id/preview
app.get('/api/design-systems/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const designFile = path.join(process.cwd(), 'design-systems', id, 'DESIGN.md');
    const raw = await fs.readFile(designFile, 'utf-8');
    const previewHtml = renderDesignSystemPreview(id, raw);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(previewHtml);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/design-systems/:id/content
app.get('/api/design-systems/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const designFile = path.join(process.cwd(), 'design-systems', id, 'DESIGN.md');
    const content = await fs.readFile(designFile, 'utf-8');
    res.json({ ok: true, content });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(7456, () => {
  console.log('Test server running at http://127.0.0.1:7456');
});
