-- Reviewable provisioning SQL; no photos, names, dates of birth or meals stored.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.food_ai_quota (
  day date NOT NULL, subject text NOT NULL, requests integer NOT NULL DEFAULT 0,
  PRIMARY KEY(day,subject)
);
ALTER TABLE private.food_ai_quota ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.food_ai_quota FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.reserve_food_recognition(caller uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE today date := (now() AT TIME ZONE 'UTC')::date; used integer;
BEGIN
  -- Serialize reservation, including the project-wide ceiling (100 requests/day).
  PERFORM pg_advisory_xact_lock(736842901);
  DELETE FROM private.food_ai_quota WHERE day < today - 7;
  INSERT INTO private.food_ai_quota(day,subject) VALUES(today,'global'),(today,caller::text) ON CONFLICT DO NOTHING;
  SELECT requests INTO used FROM private.food_ai_quota WHERE day=today AND subject='global';
  IF used >= 100 THEN RETURN false; END IF;
  SELECT requests INTO used FROM private.food_ai_quota WHERE day=today AND subject=caller::text;
  IF used >= 20 THEN RETURN false; END IF;
  UPDATE private.food_ai_quota SET requests=requests+1 WHERE day=today AND subject IN ('global',caller::text);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_food_recognition(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_food_recognition(uuid) TO service_role;
