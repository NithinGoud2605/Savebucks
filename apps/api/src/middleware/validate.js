import { cleanText } from '../lib/validate.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'validation failed', 
          details: result.error.errors 
        });
      }
      
      const cleaned = {};
      for (const [key, value] of Object.entries(result.data)) {
        if (typeof value === 'string') {
          cleaned[key] = cleanText(value);
        } else {
          cleaned[key] = value;
        }
      }
      
      req.body = cleaned;
      next();
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  };
}
