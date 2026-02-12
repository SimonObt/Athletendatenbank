

---

## Deployment Checklist (DevOps)

### Pre-Deployment
- [x] Local build successful (`npm run build`)
- [x] All QA tests passed
- [x] Environment variables documented in DEPLOYMENT.md
- [x] Code committed and pushed
- [x] vercel.json configured

### Vercel Setup
- [ ] Project created on Vercel
- [ ] Git Integration connected
- [ ] Environment Variables added:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### Post-Deployment
- [ ] Production URL tested
- [ ] Login flow working
- [ ] Database connections working
- [ ] RLS Policies applied

### Production URL
**Pending:** Wird nach Deployment hinzugefügt

### Rollback Plan
If issues occur:
1. Revert to previous deployment in Vercel Dashboard
2. Check logs for error details
3. Fix issues locally
4. Redeploy

---

**QA Engineer Sign-off:** ✅
**DevOps Engineer Sign-off:** 🟡 Pending Deployment
**Final Status:** ✅ Done (Code) / 🟡 Pending (Production Deploy)
**Date:** 2026-02-12
