# CI/CD Deployment Guide

## Overview

ARIS uses a comprehensive CI/CD pipeline with automated testing, security scanning, and multi-environment deployments.

## Pipeline Structure

### Workflows

1. **Main CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Frontend build and test
   - Backend API tests
   - E2E testing with Cypress
   - Security scanning (Trivy, OWASP ZAP)
   - Lighthouse performance testing
   - Automated deployments

2. **Quality Gate** (`.github/workflows/quality-gate.yml`)
   - Console statement removal
   - Hardcoded secret detection
   - Bundle size analysis
   - Accessibility audit
   - Environment validation

3. **Nightly Maintenance** (`.github/workflows/nightly.yml`)
   - Security scans
   - Dependency updates
   - Performance monitoring
   - Health checks

## Environments

### Staging (`develop` branch)
- **Trigger**: Push to `develop` branch
- **URL**: Vercel staging environment
- **Features**: Latest features, basic testing

### Production (`main` branch)
- **Trigger**: Push to `main` branch
- **URL**: `https://aris-bidsmith.vercel.app`
- **Features**: Full testing, security scans, performance checks

## Required Secrets

Configure these in GitHub repository settings:

### Vercel
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Railway (API)
- `RAILWAY_TOKEN`: Railway authentication token
- `RAILWAY_SERVICE_ID`: Railway service ID

### Monitoring
- `PROD_URL`: Production URL
- `API_URL`: API URL
- `SNYK_TOKEN`: Snyk security scanning token

## Deployment Scripts

### Pre-deployment (`scripts/pre-deploy.sh`)
```bash
./scripts/pre-deploy.sh
```

**Checks performed:**
- Branch validation
- Uncommitted changes detection
- Security audit
- Linting
- Console statement removal
- Build validation
- Bundle size analysis
- Test execution
- Environment validation

### Post-deployment (`scripts/post-deploy.sh`)
```bash
./scripts/post-deploy.sh <DEPLOY_URL> <API_URL>
```

**Checks performed:**
- Site accessibility
- API health checks
- Critical page validation
- SSL verification
- Response time analysis
- Production console error detection
- Analytics tracking verification

## Manual Deployment

### Staging
```bash
# Push to develop branch
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```

### Production
```bash
# Push to main branch
git checkout main
git merge develop
git push origin main
```

### Emergency Rollback
```bash
# Rollback to previous commit
git revert HEAD
git push origin main
```

## Testing

### Local Testing
```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run security audit
npm run security:audit

# Run E2E tests
npm run test:ci

# Build application
npm run build
```

### Pre-deployment Validation
```bash
# Run all pre-deployment checks
./scripts/pre-deploy.sh
```

## Performance Monitoring

### Lighthouse Configuration
Configuration in `lighthouserc.json`:
- Performance threshold: 80
- Accessibility threshold: 90
- Best practices threshold: 80
- SEO threshold: 80

### Bundle Size Limits
- Warning: 5MB
- Error: 10MB

## Security

### Automated Scans
1. **npm audit**: Dependency vulnerability scanning
2. **Trivy**: Container and file system scanning
3. **OWASP ZAP**: Web application security testing
4. **Snyk**: Additional vulnerability scanning

### Security Rules
- No hardcoded secrets
- No console statements in production
- All dependencies audited
- SSL enforcement
- Security headers validation

## Monitoring and Alerts

### Health Checks
- `/api/health` endpoint monitoring
- Response time tracking
- Error rate monitoring
- Uptime verification

### Performance Metrics
- Lighthouse scores
- Bundle size tracking
- Core Web Vitals
- Page load times

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check console statements
   - Validate dependencies
   - Review linting errors

2. **Test Failures**
   - Check API connectivity
   - Verify test environment
   - Review test data

3. **Deployment Failures**
   - Verify environment variables
   - Check deployment permissions
   - Review build artifacts

4. **Performance Issues**
   - Analyze bundle size
   - Check Lighthouse scores
   - Review Core Web Vitals

### Debug Commands
```bash
# Check build size
du -k dist/

# Find console statements
grep -r "console\." src/

# Check for secrets
grep -r -E "(sk_|pk_|API_KEY|SECRET)" src/

# Run specific test
npm run test:ci -- --spec "landing_page.cy.js"
```

## Best Practices

1. **Before Committing**
   - Run `./scripts/pre-deploy.sh`
   - Ensure all tests pass
   - Remove console statements

2. **Branch Management**
   - Use `develop` for features
   - Use `main` for production
   - Create feature branches from `develop`

3. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as template
   - Validate all required variables

4. **Security**
   - Regular security scans
   - Keep dependencies updated
   - Monitor for vulnerabilities

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review deployment scripts
3. Verify environment configuration
4. Contact DevOps team if needed
