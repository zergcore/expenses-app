-- Close RLS gaps: add DELETE policies on notification_preferences,
-- financial_insights, and storage avatars (OWASP A01 — Broken Access Control)

CREATE POLICY "Users can delete own notification preferences"
  ON public.notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial insights"
  ON public.financial_insights FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);