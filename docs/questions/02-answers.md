### #1 — Email Branding                                                    
 568 +- **Q1a:** Do you have a verified sending domain (e.g., `fin.app`) set up w
     +ith Resend, or are we still on the sandbox `onboarding@resend.dev`? Is sett
     +ing up a custom domain in scope for this batch? 
     I have my own domain, zergcore.dev. I was hoping to use a subdomain before buying a proper domain.                           
 569 +- **Q1b:** What `from` address for auth emails? Options: `no-reply@fin.app`
     +, `hello@fin.app`, `auth@fin.app`.  
     I think we could use something like fin@zergcoredev while I haven't decided where to host this application. I'd like to use my custom domain for this.                                       
 570 +- **Q1c:** Which auth emails get custom Fin templates? (Recommended: signup
     + confirmation, password reset, email change — all three.)
     all three                                  
 571 +                                                                           
 572 +### #2 — Password-Reset Rate Limiting                                      
 573 +- **Q2a:** Desired cooldown window? (Recommendation: 60 s per email address
     +; 5 min after 3 consecutive attempts.)     
     Use your own recommendations here, I trust your judgment.                                
 574 +- **Q2b:** User-facing message during cooldown — countdown timer ("Try agai
     +n in 47 s") or static message ("Check your inbox, we've already sent you a 
     +link")?     
     Use your own recommendations here, I trust your judgment.                                  
 575 +- **Q2c:** Cooldown enforced server-side only (Supabase `max_frequency`), o
     +r also mirrored client-side (button disabled with countdown)?              
     Use your own recommendations here, I trust your judgment.                                   
 576 +                                                                           
 577 +### #4 — Suspicious-Activity Emails                                        
 578 +- **Q4a:** v1 definition of "suspicious" — proposal: sign-in from a country
     + that differs from the user's last-known country (detectable via Vercel's `
     +x-vercel-ip-country` header). Acceptable?
     Do that, but also I consider that when a user tries several times to sign in without being able to do it, or when it tries to change its password more than once, it's also suspicious.                                
 579 +- **Q4b:** Should the email include a "This wasn't me — secure my account" 
     +link that terminates all active sessions? 
     yes                                 
 580 +- **Q4c:** Should suspicious sign-ins be persisted in a DB table, or just e
     +mailed? 
     yes, I think this would be very useful for the user                                     
 581 +- **Q4d:** Hook point preference: (a) Replace `Auth` UI with a custom sign-
     +in Server Action (full control, more work); (b) Supabase Auth Hook (require
     +s Supabase Pro); (c) client-side `onAuthStateChange` + a server ping (less 
     +reliable). Recommendation: (a) — gives us full IP/country access server-sid
     +e. 
     let's use (a)                                          
 582 +                                                                           
 583 +### #5 — OWASP Compliance                                                  
 584 +- **Q5a:** Target level — OWASP ASVS Level 1 (baseline) or Level 2 (higher 
     +assurance)? Recommendation: Level 1 plus specific Level 2 controls for auth
     +.                                          
     follow your own recommendation                                
 585 +- **Q5b:** CSP strategy — `strict-dynamic` with nonces (most secure, more c
     +omplex) or a permissive allowlist (faster, weaker)? The app uses shadcn inl
     +ine styles, Recharts SVGs, and `next-themes` — these complicate a strict CS
     +P.  
     follow your own recommendation.                                        
 586 +                                                                           
 587 +### #8 — Expenses View Redesign                                            
 588 +- **Q8a:** Reference app with an expenses view you like? (e.g., Monarch Mon
     +ey, Copilot, YNAB, Lunch Money, Actual Budget.)       
     Is it possible for you to shown me these styles creating images of how fin could look at the end?                     
 589 +- **Q8b:** Density preference: information-dense (compact rows, lots of dat
     +a) or calm/spacious (one hero number, breathing room)?  
     I like minimalistic styles but at the same time I want to see all the information I need.                   
 590 +- **Q8c:** Should `ExpensesSidebar` (budget donut, daily spending insight, 
     +projected spending) be surfaced in the redesign? It's fully built but curre
     +ntly not rendered in the expenses page.    
     Let's do that.                                
 591 +                                                                           
 592 +### #9 — Money-Conversion Library                                          
 593 +- **Q9a:** Preferred approach: `dinero.js` v2 (full-featured, opinionated, 
     +18 KB gzipped), `currency.js` (minimal, 1.6 KB), or a custom `BigInt`-based
     + utility (zero deps)? Full comparison in Phase 2.    
     What's the standard for this kind of app?                      
 594 +- **Q9b:** Should we correct existing stored `equivalents` JSONB values in 
     +the DB for float drift, or fix only the code path going forward?           
 595 + 
 what do you think it should be changed from before? if the saved data comes directly from the requests. I do not think it should be changed.                                                                    
 596 +### #10 — Monthly Rates URL-Driven                                         
 597 +- **Q10a:** Confirm intent: should month/date navigation in the history cha
     +rt switch to a client-side fetch (React state + Server Action) so live rate
     + cards don't re-render? Or is the concern different from what was diagnosed
     + above?                                                                    
     I do not want to reload the whole page so just one component can be changed.                                                                      
 599 +### #11 — Onboarding AI Assistant                                          
 600 +- **Q11a:** Where should it live? (a) Replace the existing `OnboardingCard`
     + checklist; (b) a modal on first login; (c) a dedicated `/onboarding` route
     +. Recommendation: (b) modal — least disruptive, easiest to skip.    
     lets go with modal       
 601 +- **Q11b:** Output: (a) guidance text only; (b) prefill suggested categorie
     +s + budgets the user can accept; (c) both. Recommendation: (b). 
     lets go with b           
 602 +- **Q11c:** UX style: conversational chat or a structured step-wizard?     
 603 +   step-wizard, so it sends the information to the AI just once at the end.                                                                        
 604 +### #12 — Contact/Support                                                  
 605 +- **Q12a:** Ticket destination: (a) email to support inbox only; (b) DB tab
     +le + email notification; (c) DB + email + minimal admin view. Recommendatio
     +n: (b) for v1. 
     b                                                            
 606 +- **Q12b:** What email address receives support tickets?   
 I would like to set that as an  environment variable                
 607 +- **Q12c:** Login required to submit, or open to unauthenticated visitors? 
     It should be open, so even if the user is not logged in they can send a message. but it requires an email
 608 +- **Q12d:** Spam protection: Cloudflare Turnstile (free, privacy-friendly),
     + hCaptcha, or just a honeypot for v1?     
     cloudflare turnstile, because it is free and privacy-friendly.                                 
 609 +                                                                           
 610 +### #13 — Git Co-Author Trailers                                           
 611 +- **Q13a:** Rewrite existing commit history to remove any trailers, or conf
     +igure the convention in `CLAUDE.md` going forward only?   