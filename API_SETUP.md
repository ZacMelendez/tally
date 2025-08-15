# Net Worth API Setup Guide

This guide will help you set up the Fastify API server to replace direct Firebase calls.

## Prerequisites

-   Node.js 18+
-   Firebase Admin Service Account Key
-   Firebase Project with Firestore enabled

## 1. Firebase Admin Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file - **keep it secure!**

## 2. Environment Configuration

Create a `.env` file in the `/api` directory:

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### Getting Firebase Values

From your downloaded service account JSON file:

-   `FIREBASE_PROJECT_ID` = `project_id`
-   `FIREBASE_PRIVATE_KEY_ID` = `private_key_id`
-   `FIREBASE_PRIVATE_KEY` = `private_key` (keep the exact format with \n)
-   `FIREBASE_CLIENT_EMAIL` = `client_email`
-   `FIREBASE_CLIENT_ID` = `client_id`

## 3. Frontend Configuration

Add the API URL to your frontend `.env`:

```bash
VITE_API_URL=http://localhost:3001/api
```

## 4. Running the Development Environment

### Option 1: Manual Setup

1. **Start the API server:**

    ```bash
    cd api
    bun install
    bun run dev
    ```

2. **Start the frontend:**
    ```bash
    # In project root
    bun install
    bun run dev
    ```

### Option 2: Docker Compose

1. **Create `.env` file in project root with Firebase variables**

2. **Run with Docker:**
    ```bash
    docker-compose up --build
    ```

## 5. API Endpoints

The API provides the following endpoints:

### Assets

-   `GET /api/assets` - Get all assets
-   `GET /api/assets/:id` - Get specific asset
-   `POST /api/assets` - Create new asset
-   `PUT /api/assets/:id` - Update asset
-   `DELETE /api/assets/:id` - Delete asset
-   `GET /api/assets/:id/history` - Get asset value history
-   `POST /api/assets/:id/history` - Add asset value history

### Debts

-   `GET /api/debts` - Get all debts
-   `GET /api/debts/:id` - Get specific debt
-   `POST /api/debts` - Create new debt
-   `PUT /api/debts/:id` - Update debt
-   `DELETE /api/debts/:id` - Delete debt
-   `GET /api/debts/:id/history` - Get debt value history
-   `POST /api/debts/:id/history` - Add debt value history

### Net Worth

-   `GET /api/networth/history` - Get net worth history
-   `GET /api/networth/current` - Get current net worth
-   `POST /api/networth/snapshot` - Create net worth snapshot
-   `GET /api/networth/should-snapshot` - Check if should create snapshot

### Health Check

-   `GET /health` - Server health status

## 6. Authentication

All API endpoints (except `/health`) require Firebase ID token authentication:

```bash
Authorization: Bearer <firebase-id-token>
```

The frontend automatically handles this when using the `apiService`.

## 7. Production Deployment

### Environment Variables

For production, ensure these environment variables are set:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
# ... Firebase config
```

### Docker Production

```dockerfile
# Build the API
docker build -t net-worth-api ./api

# Run the API
docker run -p 3001:3001 --env-file .env net-worth-api
```

## 8. Migration from Direct Firebase

The frontend has been updated to use the API service instead of direct Firebase calls. Key changes:

1. **Real-time listeners replaced with API calls** - The dashboard now uses polling/manual refresh
2. **Authentication still uses Firebase Auth** - Only data operations go through the API
3. **Automatic snapshots** - Net worth snapshots are created automatically on asset/debt changes
4. **Error handling** - Improved error handling with toast notifications

## 9. Troubleshooting

### Common Issues

1. **CORS errors**: Check `FRONTEND_URL` in API environment
2. **Authentication errors**: Verify Firebase service account credentials
3. **Connection refused**: Ensure API server is running on correct port
4. **Firebase permissions**: Ensure service account has Firestore permissions

### Debugging

1. **Check API logs**: `docker-compose logs api` or check console in dev mode
2. **Verify environment**: Use `/health` endpoint to check server status
3. **Test authentication**: Check browser network tab for 401 errors

## 10. Development Tips

1. **Hot reload**: Use `bun run dev` for auto-restart on changes
2. **Testing**: Use tools like Postman/Insomnia to test API endpoints
3. **Monitoring**: Check both API and frontend console logs
4. **Database**: Use Firebase Console to view Firestore data directly

## Next Steps

-   Consider adding request caching for better performance
-   Implement WebSocket support for real-time updates
-   Add API rate limiting (currently handled in frontend)
-   Set up monitoring and alerting for production
