# Deployment Guide

This guide covers various deployment options for BachOS API.

## Prerequisites

- Node.js 18+ installed
- MongoDB 6+ instance
- Environment variables configured

## Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**
   ```env
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://yourdomain.com
   LOG_LEVEL=info
   ```

## Deployment Options

### Option 1: Traditional VPS/Server

1. **Install dependencies**
   ```bash
   npm ci --only=production
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Start with PM2 (recommended)**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name bachos-api
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 2: Docker

1. **Build Docker image**
   ```bash
   docker build -t bachos-api .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f api
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

### Option 3: Cloud Platforms

#### Heroku

1. **Create Heroku app**
   ```bash
   heroku create bachos-api
   ```

2. **Add MongoDB addon**
   ```bash
   heroku addons:create mongolab
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

#### Railway

1. Create new project on Railway
2. Connect GitHub repository
3. Add MongoDB database
4. Set environment variables in dashboard
5. Deploy automatically on push

#### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure build command: `npm run build`
3. Configure run command: `npm start`
4. Add MongoDB managed database
5. Set environment variables
6. Deploy

#### AWS (EC2 + RDS/DocumentDB)

1. Launch EC2 instance (Ubuntu 22.04)
2. Install Node.js and PM2
3. Set up MongoDB (DocumentDB or self-hosted)
4. Configure security groups
5. Deploy application
6. Set up Application Load Balancer
7. Configure Auto Scaling

## Database Setup

### MongoDB Atlas (Recommended for production)

1. Create account at mongodb.com/cloud/atlas
2. Create new cluster
3. Configure network access (whitelist IPs)
4. Create database user
5. Get connection string
6. Update MONGODB_URI in .env

### Self-hosted MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y mongodb-org
   
   # Start service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **Create database and user**
   ```javascript
   use bachos
   db.createUser({
     user: "bachos_user",
     pwd: "secure_password",
     roles: [{ role: "readWrite", db: "bachos" }]
   })
   ```

## Security Checklist

- [ ] Use strong JWT_SECRET (minimum 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Use MongoDB authentication
- [ ] Implement proper backup strategy
- [ ] Monitor application logs
- [ ] Set up error tracking (Sentry, etc.)

## Monitoring

### Health Check Endpoint
```bash
curl https://api.yourdomain.com/health
```

### PM2 Monitoring
```bash
pm2 monit
pm2 logs bachos-api
```

### Docker Monitoring
```bash
docker stats bachos-api
docker logs -f bachos-api
```

## Backup Strategy

### MongoDB Backup
```bash
# Create backup
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="your-mongodb-uri" /backup/20251201
```

### Automated Backups
Set up cron job:
```bash
0 2 * * * /usr/bin/mongodump --uri="mongodb://..." --out=/backups/$(date +\%Y\%m\%d)
```

## Performance Optimization

1. **Enable MongoDB indexes** (already configured in models)
2. **Use PM2 cluster mode**
   ```bash
   pm2 start dist/index.js -i max --name bachos-api
   ```
3. **Enable compression in Nginx**
4. **Use CDN for static assets**
5. **Implement caching where appropriate**
6. **Monitor and optimize database queries**

## Troubleshooting

### Application won't start
- Check environment variables
- Verify MongoDB connection
- Check port availability
- Review application logs

### Database connection issues
- Verify MongoDB URI
- Check network/firewall rules
- Ensure MongoDB is running
- Verify credentials

### High memory usage
- Check for memory leaks
- Review MongoDB query efficiency
- Consider scaling horizontally
- Use PM2 cluster mode

## Rollback Strategy

### PM2
```bash
# List deployments
pm2 list

# Restart previous version
pm2 restart bachos-api@previous
```

### Docker
```bash
# List images
docker images

# Run previous version
docker run -d previous-image-tag
```

## Support

For deployment issues, contact: support@bachos.com