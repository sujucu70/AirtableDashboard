# Deployment Guide for Customer Interactions Dashboard

This guide explains how to deploy the application independently on Render or other hosting platforms.

## Prerequisites

1. A MySQL-compatible database (MySQL 8+, TiDB, PlanetScale, etc.)
2. Node.js 18+ environment
3. pnpm package manager

## Environment Variables

Configure the following environment variables in your hosting platform:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string with SSL | `mysql://user:password@host:3306/dbname?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | Secret key for session tokens (min 32 chars) | Generate with: `openssl rand -hex 32` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (optional, defaults to 3000) | `3000` |

### Notes on Authentication

This version of the application has been simplified to work without Manus OAuth. The sync functionality now works without requiring user authentication.

## Deployment on Render

### Step 1: Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository

### Step 2: Configure Build Settings

- **Environment:** Node
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`
- **Node Version:** 18 or higher

### Step 3: Add Environment Variables

In the "Environment" section, add:

```
DATABASE_URL=mysql://...
JWT_SECRET=your-generated-secret
NODE_ENV=production
```

### Step 4: Create Database

Option A: Use Render's MySQL (if available)
Option B: Use external providers:
- [PlanetScale](https://planetscale.com/) - Free tier available
- [TiDB Cloud](https://tidbcloud.com/) - Free tier available
- [Railway](https://railway.app/) - MySQL add-on

### Step 5: Run Database Migrations

After first deployment, you may need to run migrations. You can do this by:
1. Adding a one-time job in Render
2. Or running locally with the production DATABASE_URL:
   ```bash
   DATABASE_URL="your-prod-url" pnpm db:push
   ```

## Deployment on Other Platforms

### Vercel (Not Recommended)
This is a full-stack application with a Node.js backend. Vercel is optimized for serverless and may require significant modifications.

### Railway
1. Create new project from GitHub
2. Add MySQL service
3. Set environment variables
4. Deploy

### Docker
A Dockerfile can be created if needed. Contact for assistance.

## Troubleshooting

### "dist does not exist" Error
Make sure the build command is set to: `pnpm install && pnpm build`

### Database Connection Errors
- Verify DATABASE_URL format includes SSL parameters for cloud databases
- Check that your IP is whitelisted in the database provider

### Authentication Issues
The simplified version removes OAuth dependency. If you see OAuth-related errors, ensure you're using the latest code from the repository.

## Support

For issues or questions, please open an issue in the GitHub repository.
