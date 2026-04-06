# Log Sentinel

A production-grade Node.js boilerplate powered by Express.

## Features
- **Security**: Helmet, CORS
- **Performance**: Compression, Express Rate Limit
- **Validation**: Joi integration ready
- **Logging**: Morgan, Winston logger (Tabular startup stats)
- **Error Handling**: Global standardized API responses

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development:
   ```bash
   npm run dev
   ```

3. Run in production:
   ```bash
   node src/server.js
   ```

## Routes
- \`GET /api/v1/health\` - Returns application health status.
