# MedBuddy GCP Deployment Guide (Web Console)

This guide walks you through deploying MedBuddy to Google Cloud Platform using **only the web console** (no CLI commands).

---

## Prerequisites

- Google Cloud account with billing enabled
- MedBuddy code pushed to GitHub (already done: https://github.com/aswithabukka/medbuddy)
- A domain name (optional, for custom domain)

---

## Phase 1: Project Setup

### 1.1 Create a New GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** (top left, next to "Google Cloud")
3. Click **"NEW PROJECT"**
4. Enter details:
   - **Project name**: `medbuddy-production`
   - **Organization**: (leave as default or select your org)
   - **Location**: (leave as default)
5. Click **"CREATE"**
6. Wait for project creation, then **select the new project** from the dropdown

### 1.2 Enable Required APIs

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search and enable each of the following (click the API name, then click **"ENABLE"**):
   - **Cloud SQL Admin API**
   - **Cloud Run Admin API**
   - **Compute Engine API**
   - **Cloud Build API**
   - **Artifact Registry API**
   - **Secret Manager API**
   - **Cloud Storage API**
   - **Serverless VPC Access API**

**Tip**: After enabling each API, use the browser back button to return to the library and search for the next one.

---

## Phase 2: Database Setup (Cloud SQL)

### 2.1 Create PostgreSQL Instance

1. In left sidebar, go to **"SQL"** (under Databases section)
2. Click **"CREATE INSTANCE"**
3. Choose **"PostgreSQL"**
4. Configure the instance:
   - **Instance ID**: `medbuddy-postgres`
   - **Password**: Set a strong password (save this securely!)
   - **Database version**: PostgreSQL 15
   - **Region**: Choose closest to your users (e.g., `us-central1`)
   - **Zonal availability**: Single zone (for dev) or Multiple zones (for production)

5. Under **"Customize your instance"**:
   - **Machine type**:
     - Click **"SHARED CORE"** → **"1 vCPU, 0.614 GB"** (for testing)
     - OR **"DEDICATED CORE"** → **"2 vCPU, 8 GB"** (for production)
   - **Storage**:
     - Type: SSD
     - Size: 10 GB (can auto-increase)
     - Check ✅ **"Enable automatic storage increases"**
   - **Connections**:
     - Under **"Instance IP assignment"**:
       - Check ✅ **"Private IP"** (recommended for security)
       - Check ✅ **"Public IP"** (for initial setup, can disable later)
     - Under **"Authorized networks"** (if public IP enabled):
       - Click **"ADD NETWORK"**
       - Name: `Temporary-AllowAll`
       - Network: `0.0.0.0/0` (allows all IPs - we'll restrict this later)
       - Click **"DONE"**

6. **Backup configuration**:
   - Check ✅ **"Automate backups"**
   - Backup window: Choose a low-traffic time
   - Check ✅ **"Enable point-in-time recovery"**

7. Click **"CREATE INSTANCE"** (this takes 5-10 minutes)

### 2.2 Create the Database

1. Wait for instance to be ready (green checkmark)
2. Click on **`medbuddy-postgres`** instance name
3. Go to **"Databases"** tab (left sidebar within the SQL instance)
4. Click **"CREATE DATABASE"**
5. **Database name**: `medbuddy`
6. Click **"CREATE"**

### 2.3 Note Connection Details

1. Stay on the instance overview page
2. Under **"Connect to this instance"**, note down:
   - **Public IP address**: e.g., `34.123.45.67`
   - **Private IP address**: e.g., `10.1.2.3`
   - **Connection name**: e.g., `medbuddy-production:us-central1:medbuddy-postgres`

3. Construct your **DATABASE_URL**:
```
postgresql://postgres:YOUR_PASSWORD@PUBLIC_IP:5432/medbuddy
```
Replace `YOUR_PASSWORD` with the password you set, and `PUBLIC_IP` with the IP address.

**Save this URL** - you'll need it later.

---

## Phase 3: Redis Setup (Memorystore)

### 3.1 Create Redis Instance

1. In left sidebar, go to **"Memorystore"** → **"Redis"**
2. Click **"CREATE INSTANCE"**
3. Configure:
   - **Instance ID**: `medbuddy-redis`
   - **Tier**:
     - **Basic** (for dev, no failover)
     - **Standard** (for production, with failover)
   - **Capacity**: 1 GB (minimum)
   - **Region**: Same as your SQL instance (e.g., `us-central1`)
   - **Zone**: Select a zone
   - **Network**: default
   - **Redis version**: 7.2

4. Click **"CREATE"** (takes 3-5 minutes)

### 3.2 Note Connection Details

1. Once created, click on the instance
2. Note down:
   - **Primary Endpoint** (IP): e.g., `10.2.3.4`
   - **Port**: 6379

**Save these** - you'll need:
- `REDIS_HOST=10.2.3.4`
- `REDIS_PORT=6379`

---

## Phase 4: Secret Manager Setup

### 4.1 Enable Secret Manager

1. Go to **"Security"** → **"Secret Manager"** in left sidebar
2. If prompted, click **"ENABLE SECRET MANAGER API"**

### 4.2 Create Secrets

Create each of these secrets one by one:

**To create each secret:**
1. Click **"CREATE SECRET"**
2. Enter the name (see list below)
3. Under **"Secret value"**, paste the value
4. Click **"CREATE SECRET"**

**Secrets to create:**

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | Your full PostgreSQL connection string from Phase 2.3 |
| `REDIS_HOST` | The Redis IP from Phase 3.2 |
| `REDIS_PORT` | `6379` |
| `JWT_SECRET` | Generate a random 32+ character string |
| `JWT_REFRESH_SECRET` | Generate a different random 32+ character string |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (if using video) |
| `TWILIO_API_KEY` | Your Twilio API Key |
| `TWILIO_API_SECRET` | Your Twilio API Secret |

**To generate secure random strings** (for JWT secrets):
- Open your browser console (F12)
- Run: `btoa(Array.from({length: 32}, () => Math.random().toString(36)[2]).join(''))`
- Copy the output

---

## Phase 5: Storage Setup (Cloud Storage)

### 5.1 Create Storage Bucket

1. Go to **"Cloud Storage"** → **"Buckets"** in left sidebar
2. Click **"CREATE"**
3. Configure:
   - **Name**: `medbuddy-uploads` (must be globally unique - add random suffix if taken)
   - **Location type**: Region
   - **Location**: Same as your SQL/Redis (e.g., `us-central1`)
   - **Storage class**: Standard
   - **Access control**: Uniform
   - **Protection tools**: None (for dev) or enable versioning (for production)

4. Click **"CREATE"**

### 5.2 Set CORS Configuration

1. Click on your bucket name
2. Go to the **"Configuration"** tab
3. Scroll to **"CORS"** section
4. Click **"EDIT CORS"** (or "Add CORS configuration")
5. Switch to **JSON** format
6. Paste this:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

7. Click **"SAVE"**

### 5.3 Create Service Account for Storage Access

1. Go to **"IAM & Admin"** → **"Service Accounts"**
2. Click **"CREATE SERVICE ACCOUNT"**
3. Configure:
   - **Name**: `medbuddy-storage`
   - **Description**: Storage access for MedBuddy uploads
4. Click **"CREATE AND CONTINUE"**
5. **Grant access**:
   - Role: **"Storage Object Admin"**
   - Click **"CONTINUE"**
6. Skip "Grant users access" - click **"DONE"**

### 5.4 Create Service Account Key

1. Click on the `medbuddy-storage@...` service account you just created
2. Go to **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Choose **JSON** format
5. Click **"CREATE"** (a JSON file will download)
6. **Keep this file safe** - you'll need it for backend configuration

### 5.5 Add Storage Secrets to Secret Manager

1. Go back to **"Secret Manager"**
2. Create these additional secrets:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your project ID (e.g., `medbuddy-production`) |
| `GCP_BUCKET_NAME` | Your bucket name (e.g., `medbuddy-uploads`) |
| `GCP_SERVICE_ACCOUNT_KEY` | Paste the entire contents of the JSON file you downloaded |

---

## Phase 6: Build Backend Docker Image

### 6.1 Set Up Artifact Registry

1. Go to **"Artifact Registry"** in left sidebar
2. Click **"CREATE REPOSITORY"**
3. Configure:
   - **Name**: `medbuddy`
   - **Format**: Docker
   - **Mode**: Standard
   - **Location type**: Region
   - **Region**: Same as your services (e.g., `us-central1`)
   - **Encryption**: Google-managed key

4. Click **"CREATE"**

### 6.2 Create Cloud Build Trigger for Backend

1. Go to **"Cloud Build"** → **"Triggers"**
2. Click **"CREATE TRIGGER"**
3. Configure:
   - **Name**: `medbuddy-backend-deploy`
   - **Region**: Same as your services
   - **Event**: Push to a branch
   - **Source**:
     - Click **"CONNECT NEW REPOSITORY"**
     - Choose **"GitHub"**
     - Authenticate with GitHub
     - Select repository: `aswithabukka/medbuddy`
     - Click **"CONNECT"**
   - **Branch**: `^main$`
   - **Included files filter**: `backend/**`

4. **Configuration**:
   - Type: Cloud Build configuration file
   - Location: Repository
   - Cloud Build configuration file: Create `/cloudbuild-backend.yaml` (we'll create this next)

5. Click **"CREATE"** (it will warn the file doesn't exist - that's okay)

### 6.3 Create Backend Dockerfile

1. Go back to your local project
2. Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 8080

# Run migrations and start server
CMD npx prisma migrate deploy && node dist/main.js
```

### 6.4 Create Cloud Build Config

Create `cloudbuild-backend.yaml` in project root:

```yaml
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend:$SHORT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend:latest'
      - '-f'
      - 'backend/Dockerfile'
      - './backend'

  # Push the image to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'medbuddy-backend'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-secrets=DATABASE_URL=DATABASE_URL:latest,REDIS_HOST=REDIS_HOST:latest,REDIS_PORT=REDIS_PORT:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest,TWILIO_API_KEY=TWILIO_API_KEY:latest,TWILIO_API_SECRET=TWILIO_API_SECRET:latest,GCP_PROJECT_ID=GCP_PROJECT_ID:latest,GCP_BUCKET_NAME=GCP_BUCKET_NAME:latest,GCP_SERVICE_ACCOUNT_KEY=GCP_SERVICE_ACCOUNT_KEY:latest'
      - '--set-env-vars=NODE_ENV=production,PORT=8080'
      - '--memory=2Gi'
      - '--cpu=2'
      - '--timeout=300'
      - '--max-instances=10'
      - '--min-instances=0'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/backend:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

**Note**: Replace `us-central1` in the YAML with your chosen region if different.

---

## Phase 7: Deploy Backend

### 7.1 Update Backend Code for GCP

1. Update `backend/src/main.ts` to use PORT from environment:

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

2. Update `backend/src/files/files.service.ts` (if exists) to use GCP credentials from environment variables instead of AWS.

### 7.2 Commit and Push

From your local terminal:

```bash
git add backend/Dockerfile cloudbuild-backend.yaml
git add backend/src/main.ts
git commit -m "Add GCP deployment configuration for backend"
git push origin main
```

### 7.3 Monitor Build

1. Go to **"Cloud Build"** → **"History"** in GCP Console
2. You should see a build starting automatically
3. Click on the build to see logs
4. Wait for completion (5-10 minutes for first build)

### 7.4 Get Backend URL

1. Once build succeeds, go to **"Cloud Run"**
2. Click on **`medbuddy-backend`** service
3. Note the **URL** at the top (e.g., `https://medbuddy-backend-xxxxx-uc.a.run.app`)
4. Click the URL to verify it's running (you should see API docs at `/api`)

---

## Phase 8: Configure Frontend for GCP Backend

### 8.1 Update Frontend Environment

1. Update `frontend-web/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://medbuddy-backend-xxxxx-uc.a.run.app/api/v1
```

Replace with your actual backend URL from Phase 7.4.

### 8.2 Create Frontend Dockerfile

Create `frontend-web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
```

### 8.3 Update Next.js Config

Update `frontend-web/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... rest of your config
};

export default nextConfig;
```

### 8.4 Create Cloud Build Config for Frontend

Create `cloudbuild-frontend.yaml` in project root:

```yaml
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend:$SHORT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend:latest'
      - '-f'
      - 'frontend-web/Dockerfile'
      - './frontend-web'

  # Push the image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'medbuddy-frontend'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--timeout=300'
      - '--max-instances=10'

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/medbuddy/frontend:latest'

options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

### 8.5 Create Frontend Build Trigger

1. Go to **"Cloud Build"** → **"Triggers"**
2. Click **"CREATE TRIGGER"**
3. Configure:
   - **Name**: `medbuddy-frontend-deploy`
   - **Event**: Push to a branch
   - **Source**: Same repository
   - **Branch**: `^main$`
   - **Included files filter**: `frontend-web/**`
   - **Configuration file**: `/cloudbuild-frontend.yaml`

4. Click **"CREATE"**

### 8.6 Deploy Frontend

```bash
git add frontend-web/Dockerfile frontend-web/next.config.mjs frontend-web/.env.production cloudbuild-frontend.yaml
git commit -m "Add GCP deployment configuration for frontend"
git push origin main
```

Monitor in **"Cloud Build"** → **"History"**.

---

## Phase 9: Configure Networking & Security

### 9.1 Configure VPC Access (for Redis/SQL Private IPs)

If you're using private IPs for SQL or Redis:

1. Go to **"Serverless VPC Access"**
2. Click **"CREATE CONNECTOR"**
3. Configure:
   - **Name**: `medbuddy-vpc-connector`
   - **Region**: Same as your services
   - **Network**: default
   - **Subnet**: Custom IP range
   - **IP range**: `10.8.0.0/28`

4. Click **"CREATE"**

5. Update Cloud Run services to use connector:
   - Go to each Cloud Run service (backend, frontend)
   - Click **"EDIT & DEPLOY NEW REVISION"**
   - Go to **"Connections"** tab
   - Under **"Egress settings"**, select **"Send only private traffic through the VPC connector"**
   - Select your connector
   - Click **"DEPLOY"**

### 9.2 Restrict SQL Access

1. Go to **"SQL"** → your instance
2. Go to **"Connections"** tab
3. Under **"Authorized networks"**:
   - Remove the `0.0.0.0/0` network we added earlier
   - Your Cloud Run services can now connect via private IP through VPC connector

### 9.3 Configure CORS for Backend

Update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://medbuddy-frontend-xxxxx-uc.a.run.app', // Your frontend URL
    'http://localhost:3001', // For local development
  ],
  credentials: true,
});
```

Commit and push to trigger rebuild.

---

## Phase 10: Custom Domain (Optional)

### 10.1 Map Domain to Cloud Run

1. Go to **"Cloud Run"** → **"Manage Custom Domains"** (top right)
2. Click **"ADD MAPPING"**
3. Select service: **`medbuddy-frontend`**
4. Enter your domain: `app.yourdomain.com`
5. Follow DNS configuration instructions (add CNAME records to your DNS provider)
6. Wait for SSL certificate provisioning (10-15 minutes)

7. Repeat for backend: `api.yourdomain.com` → **`medbuddy-backend`**

### 10.2 Update Frontend Environment

Update `.env.production` with custom domain:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

Commit, push, and redeploy.

---

## Phase 11: Monitoring & Logging

### 11.1 Set Up Monitoring

1. Go to **"Monitoring"** → **"Dashboards"**
2. Click **"Create Dashboard"**
3. Add charts for:
   - Cloud Run request count
   - Cloud Run latency
   - Cloud SQL connections
   - Redis operations

### 11.2 Set Up Alerts

1. Go to **"Monitoring"** → **"Alerting"**
2. Click **"CREATE POLICY"**
3. Create alerts for:
   - Cloud Run error rate > 5%
   - Cloud SQL CPU > 80%
   - Redis memory > 80%

### 11.3 View Logs

1. Go to **"Logging"** → **"Logs Explorer"**
2. Filter by:
   - Resource type: Cloud Run Revision
   - Service name: `medbuddy-backend` or `medbuddy-frontend`

---

## Phase 12: Cost Optimization

### 12.1 Set Up Budgets

1. Go to **"Billing"** → **"Budgets & alerts"**
2. Click **"CREATE BUDGET"**
3. Set budget amount and alert thresholds

### 12.2 Configure Autoscaling

For each Cloud Run service:

1. Click **"EDIT & DEPLOY NEW REVISION"**
2. Go to **"Autoscaling"** section
3. Set:
   - **Minimum instances**: 0 (to save costs when idle)
   - **Maximum instances**: 10 (prevent runaway costs)

### 12.3 Enable Cloud CDN (Optional)

For better performance and lower costs:

1. Go to **"Network Services"** → **"Cloud CDN"**
2. Click **"ADD ORIGIN"**
3. Select your Cloud Run frontend service
4. Enable caching for static assets

---

## Phase 13: Testing Your Deployment

### 13.1 Test Backend Health

1. Visit your backend URL: `https://medbuddy-backend-xxxxx-uc.a.run.app`
2. Check `/api` for Swagger docs
3. Test auth endpoint: `/api/v1/auth/login`

### 13.2 Test Frontend

1. Visit your frontend URL
2. Try to register a new user
3. Log in and test all features

### 13.3 Test Database Connection

1. Go to **"Cloud SQL"** → your instance → **"Overview"**
2. Check **"Recent queries"** to see if backend is connecting

---

## Quick Reference: Your Deployed URLs

After completing all phases, save these:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | `https://medbuddy-backend-xxxxx-uc.a.run.app` | REST API |
| Frontend | `https://medbuddy-frontend-xxxxx-uc.a.run.app` | Web UI |
| Database | `medbuddy-production:us-central1:medbuddy-postgres` | Cloud SQL |
| Redis | `10.x.x.x:6379` | Memorystore |
| Storage | `gs://medbuddy-uploads` | Cloud Storage |
| Logs | [Logs Explorer](https://console.cloud.google.com/logs) | Debug |
| Monitoring | [Monitoring](https://console.cloud.google.com/monitoring) | Metrics |

---

## Troubleshooting

### Build Fails with "Permission Denied"

1. Go to **"IAM & Admin"** → **"Service Accounts"**
2. Find the Cloud Build service account: `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`
3. Grant it these roles:
   - Cloud Run Admin
   - Service Account User
   - Artifact Registry Writer
   - Secret Manager Secret Accessor

### Backend Can't Connect to Database

1. Check VPC connector is configured
2. Verify DATABASE_URL secret is correct
3. Check Cloud SQL instance is running
4. Review logs in **"Cloud Run"** → service → **"LOGS"**

### Frontend Shows 404 Errors

1. Check NEXT_PUBLIC_API_URL in frontend deployment
2. Verify CORS is configured correctly in backend
3. Check network traffic in browser DevTools

### High Costs

1. Set min instances to 0 for Cloud Run
2. Use smaller machine types for Cloud SQL
3. Enable request-based pricing for Cloud Run
4. Set up budget alerts

---

## Maintenance

### Updating Code

Simply push to GitHub main branch - Cloud Build triggers will auto-deploy.

### Database Migrations

Migrations run automatically on backend startup via the Dockerfile CMD.

To run manual migrations:

1. Go to **"Cloud Run"** → **`medbuddy-backend`**
2. Click **"EDIT & DEPLOY NEW REVISION"**
3. Under **"Command"**, temporarily set: `npx prisma migrate deploy`
4. Click **"DEPLOY"**
5. Once complete, revert the command or deploy a new revision

### Viewing Database

1. Install Cloud SQL Proxy locally (one-time setup via web instructions)
2. Or use a database GUI that supports SSL connections
3. Use the connection details from Phase 2.3

---

## Security Checklist

- ✅ Database has strong password
- ✅ JWT secrets are 32+ characters
- ✅ Public IP restricted to VPC only (after setup)
- ✅ Secrets stored in Secret Manager (not env vars)
- ✅ CORS configured with specific origins
- ✅ HTTPS enforced (automatic with Cloud Run)
- ✅ Service accounts have minimal permissions
- ✅ Backups enabled for database
- ✅ Budget alerts configured
- ✅ VPC connector configured for private networking

---

## Next Steps

1. Set up CI/CD for automated testing before deployment
2. Configure Cloud Armor for DDoS protection
3. Set up Cloud CDN for global distribution
4. Configure Twilio for video calling
5. Set up SendGrid for email notifications
6. Enable Cloud Audit Logs for compliance
7. Configure custom domain with SSL

---

**Estimated Monthly Costs (Light Usage)**:
- Cloud Run (backend): $0-5
- Cloud Run (frontend): $0-5
- Cloud SQL (shared core): $10-15
- Memorystore (1GB basic): $15-20
- Cloud Storage: $1-2
- **Total**: ~$30-50/month

For production with higher traffic, expect $100-300/month depending on scale.

---

Need help? Check:
- [Cloud Run docs](https://cloud.google.com/run/docs)
- [Cloud SQL docs](https://cloud.google.com/sql/docs)
- [GCP Free Tier](https://cloud.google.com/free) - $300 credit for new accounts!
