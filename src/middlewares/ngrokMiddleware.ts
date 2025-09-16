// middleware/ngrokMiddleware.ts
import type { NextFunction, Request, Response } from 'express'

export function handleNgrokHeaders(req: Request, res: Response, next: NextFunction) {
  // Handle ngrok browser warning
  if (req.headers['ngrok-skip-browser-warning']) {
    delete req.headers['ngrok-skip-browser-warning']
  }

  // Add CORS headers for payment redirects
  if (req.path.includes('/payments/')) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  }

  next()
}

// Add this to your main app.ts/app.js before routes:
// app.use(handleNgrokHeaders)
