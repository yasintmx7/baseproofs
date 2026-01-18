# Proofly Deployment Guide

## ✅ Pre-Deployment Checklist

All changes have been committed and pushed to GitHub:
- ✅ Complete rebrand to "Proofly"
- ✅ UI/UX improvements (date picker, mask functionality, logos)
- ✅ Privacy features (content masking, persistent state)
- ✅ In-app documentation
- ✅ Social links (X, Discord, Docs)
- ✅ Back-to-top button
- ✅ Sticky mobile header
- ✅ Vercel configuration

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `yasintmx7/baseproofs`

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**
   - Add: `VITE_GEMINI_API_KEY` = `your_gemini_api_key`
   - (Get your API key from: https://aistudio.google.com/apikey)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your site will be live at: `https://proofly.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? proofly
# - Directory? ./
# - Override settings? No
```

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)

If you have a custom domain:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `proofly.io`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### 2. Update Social Links

Update the following links in your app:
- X (Twitter): https://x.com/proofly
- Discord: https://discord.gg/proofly
- Docs: (now in-app, no change needed)

### 3. Verify Deployment

Check these URLs:
- ✅ Homepage: https://proofly.vercel.app
- ✅ Create Proof: https://proofly.vercel.app (click "Enshrine Proof")
- ✅ My Vault: https://proofly.vercel.app (click "My Vault")
- ✅ Docs: https://proofly.vercel.app (click Docs icon)
- ✅ BaseScan: https://basescan.org/address/0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06

### 4. Test Functionality

- [ ] Connect wallet (MetaMask/Coinbase)
- [ ] Create a test proof
- [ ] Verify proof on BaseScan
- [ ] Check proof in Global Ledger
- [ ] Check proof in My Vault
- [ ] Test mask/reveal functionality
- [ ] Test status updates
- [ ] Test integrity checker
- [ ] Test mobile responsiveness
- [ ] Test back-to-top button
- [ ] Test in-app documentation

## 🔐 Environment Variables

Required environment variables:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your Gemini API key:
1. Visit: https://aistudio.google.com/apikey
2. Create new API key
3. Copy and paste into Vercel environment variables

## 📊 Monitoring

### Vercel Analytics (Recommended)

1. Go to Project → Analytics
2. Enable Vercel Analytics
3. Monitor:
   - Page views
   - Unique visitors
   - Performance metrics
   - Error rates

### Error Tracking

Monitor deployment logs:
1. Go to Project → Deployments
2. Click on latest deployment
3. View build logs and runtime logs

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your commit message"
git push origin master

# Vercel will automatically:
# 1. Detect the push
# 2. Build the project
# 3. Deploy to production
# 4. Update proofly.vercel.app
```

## 🌐 Production URLs

After deployment, your app will be available at:

- **Primary**: https://proofly.vercel.app
- **Preview**: https://proofly-git-master-yasintmx7.vercel.app
- **Custom** (if configured): https://proofly.io

## 🐛 Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors
**Solution**: 
```bash
# Locally test the build
npm run build

# If successful, push again
git push origin master
```

### Environment Variables Not Working

**Issue**: Gemini API not working
**Solution**:
1. Check environment variable name: `VITE_GEMINI_API_KEY`
2. Ensure it starts with `VITE_` (required for Vite)
3. Redeploy after adding variables

### 404 Errors on Refresh

**Issue**: Page not found when refreshing on routes
**Solution**: Already configured in `vercel.json` with rewrites

### Slow Build Times

**Issue**: Build takes too long
**Solution**:
- Vercel builds are typically 2-3 minutes
- Check build logs for errors
- Ensure dependencies are optimized

## 📝 Deployment Checklist

Before going live:

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Social links updated
- [ ] Documentation accessible
- [ ] Mobile testing complete
- [ ] Smart contract verified on BaseScan
- [ ] Backup of all code on GitHub

## 🎉 Post-Deployment

After successful deployment:

1. **Announce Launch**
   - Tweet on X: "Proofly is live! 🚀"
   - Share on Discord
   - Update README with live URL

2. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor error rates
   - Track user engagement

3. **Gather Feedback**
   - Create feedback form
   - Monitor Discord for issues
   - Track GitHub issues

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/yasintmx7/baseproofs
- **BaseScan Contract**: https://basescan.org/address/0x16175C96efA681D458f5dE4c1f2c3EbD9610cd06
- **Gemini API**: https://aistudio.google.com/apikey

---

**Ready to deploy?** Follow Option 1 above to deploy via Vercel Dashboard! 🚀
