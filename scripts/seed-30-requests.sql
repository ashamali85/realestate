-- =============================================================================
-- Seed 30 random inspection requests, each with:
--   * an Arabic client name
--   * a valid random address (existing area) and random request lookups
--   * the "Electric" evaluation criteria assigned
--   * every measure of that criteria filled with a random scored status
--     (notes + recommendations in Arabic; no images)
--
-- Safe to run on a database that has already been seeded by the app
-- (needs at least one User, one Area, and the five request lookup tables
-- populated). Re-running it adds ANOTHER 30 requests each time.
--
-- Postgres only. Generates ids with a core-only expression (no extensions).
-- =============================================================================

DO $$
DECLARE
  v_now            timestamptz := now();
  v_year           int         := extract(year from now())::int;
  v_creator        text;
  v_counter_key    text        := 'request:' || v_year;
  v_start_seq      int;
  v_criteria_id    text;
  i                int;
  v_request_id     text;
  v_reference      text;
  v_area_id        text;
  v_purpose_id     text;
  v_status_id      text;
  v_exterior_id    text;
  v_elevator_id    text;
  v_ac_id          text;
  v_rc_id          text;
  m                record;
  v_meas_status    text;
  v_ms_count       int;

  -- 30 Arabic names to draw from (cycled/randomised across the 30 requests)
  v_names text[] := ARRAY[
    'محمد إبراهيم', 'أحمد الشمري', 'فاطمة العلي', 'خالد المطيري', 'نورة السالم',
    'عبدالله العنزي', 'مريم الرشيد', 'يوسف الدوسري', 'سارة الحربي', 'عمر القحطاني',
    'ليلى العتيبي', 'سعود الفهد', 'هند المنصور', 'فيصل الخالدي', 'ريم الصباح',
    'ناصر العجمي', 'دلال الكندري', 'طلال البدر', 'أمل الرومي', 'بدر الهاجري',
    'شيخة العوضي', 'ماجد الفضلي', 'عائشة السبيعي', 'راشد المري', 'جواهر الأنصاري',
    'وليد الغانم', 'منى الخرافي', 'حمد المهنا', 'لطيفة الياسين', 'صالح الزامل'
  ];
  v_streets text[] := ARRAY['شارع الخليج', 'شارع البحر', 'الشارع الأول', 'شارع النخيل', 'شارع السلام'];
  v_notes   text[] := ARRAY[
    'تمت المعاينة الأولية للعقار.',
    'العقار بحالة جيدة بشكل عام.',
    'يلزم متابعة بعض النقاط الفنية.',
    'لا توجد ملاحظات جوهرية.',
    'بانتظار مستندات إضافية من العميل.'
  ];
  v_recs text[] := ARRAY[
    'يوصى بإجراء صيانة دورية.',
    'يوصى بمراجعة التوصيلات الكهربائية.',
    'لا حاجة لإجراءات إضافية.',
    'يوصى بتحديث لوحة التوزيع.',
    'يوصى بفحص إضافي خلال ثلاثة أشهر.'
  ];
BEGIN
  -- --- prerequisites -------------------------------------------------------
  SELECT id INTO v_creator FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'No users found. Seed the app first (need at least one user).';
  END IF;

  IF (SELECT count(*) FROM "Area") = 0
     OR (SELECT count(*) FROM "PurposeOption") = 0
     OR (SELECT count(*) FROM "StatusOption") = 0
     OR (SELECT count(*) FROM "ExteriorOption") = 0
     OR (SELECT count(*) FROM "ElevatorOption") = 0
     OR (SELECT count(*) FROM "AcOption") = 0 THEN
    RAISE EXCEPTION 'Missing lookup/area data. Run the app seed before this script.';
  END IF;

  -- --- ensure measure statuses (with scores) exist -------------------------
  INSERT INTO "MeasureStatusOption" (id, "nameEn", "nameAr", score, "displayOrder", "isActive", "createdAt", "updatedAt")
  SELECT ('c' || md5(random()::text || clock_timestamp()::text)), x.en, x.ar, x.score, x.ord, true, v_now, v_now
  FROM (VALUES
    ('Compliant', 'مطابق', 3, 0),
    ('Minor issue', 'ملاحظة بسيطة', 2, 1),
    ('Major issue', 'ملاحظة جوهرية', 1, 2),
    ('Not applicable', 'لا ينطبق', 0, 3)
  ) AS x(en, ar, score, ord)
  WHERE NOT EXISTS (SELECT 1 FROM "MeasureStatusOption" mso WHERE mso."nameEn" = x.en);

  SELECT count(*) INTO v_ms_count FROM "MeasureStatusOption" WHERE "isActive";

  -- --- ensure the "Electric" criteria + its measures exist -----------------
  SELECT id INTO v_criteria_id FROM "Criteria" WHERE "nameEn" = 'Electric' LIMIT 1;
  IF v_criteria_id IS NULL THEN
    v_criteria_id := ('c' || md5(random()::text || clock_timestamp()::text));
    INSERT INTO "Criteria" (id, "nameEn", "nameAr", "isActive", "createdAt", "updatedAt")
    VALUES (v_criteria_id, 'Electric', 'الكهرباء', true, v_now, v_now);

    INSERT INTO "CriteriaMeasure" (id, "criteriaId", "nameEn", "nameAr", "displayOrder", "createdAt", "updatedAt")
    VALUES
      (('c' || md5(random()::text || clock_timestamp()::text)), v_criteria_id, 'Main distribution board', 'لوحة التوزيع الرئيسية', 0, v_now, v_now),
      (('c' || md5(random()::text || clock_timestamp()::text)), v_criteria_id, 'Wiring condition',        'حالة الأسلاك',           1, v_now, v_now),
      (('c' || md5(random()::text || clock_timestamp()::text)), v_criteria_id, 'Earthing / grounding',    'التأريض',                2, v_now, v_now),
      (('c' || md5(random()::text || clock_timestamp()::text)), v_criteria_id, 'Sockets and switches',    'المقابس والمفاتيح',      3, v_now, v_now),
      (('c' || md5(random()::text || clock_timestamp()::text)), v_criteria_id, 'Lighting circuits',       'دوائر الإنارة',          4, v_now, v_now);
  END IF;

  -- --- reserve a contiguous block of reference numbers ---------------------
  -- Bump the Counter by 30 up front, then use the reserved range so the app's
  -- next generated reference won't collide with these rows.
  INSERT INTO "Counter" (id, value)
  VALUES (v_counter_key, 30)
  ON CONFLICT (id) DO UPDATE SET value = "Counter".value + 30;

  SELECT value - 30 INTO v_start_seq FROM "Counter" WHERE id = v_counter_key;

  -- --- create 30 requests --------------------------------------------------
  FOR i IN 1..30 LOOP
    v_request_id := ('creq' || i::text || md5(random()::text || clock_timestamp()::text));
    v_reference  := 'INS-' || v_year || '-' || lpad((v_start_seq + i)::text, 4, '0');

    -- pick random existing FKs
    SELECT id INTO v_area_id     FROM "Area"          ORDER BY random() LIMIT 1;
    SELECT id INTO v_purpose_id  FROM "PurposeOption" ORDER BY random() LIMIT 1;
    SELECT id INTO v_status_id   FROM "StatusOption"  ORDER BY random() LIMIT 1;
    SELECT id INTO v_exterior_id FROM "ExteriorOption" ORDER BY random() LIMIT 1;
    SELECT id INTO v_elevator_id FROM "ElevatorOption" ORDER BY random() LIMIT 1;
    SELECT id INTO v_ac_id       FROM "AcOption"      ORDER BY random() LIMIT 1;

    INSERT INTO "InspectionRequest" (
      id, reference, "areaId", block, street, "houseNumber",
      latitude, longitude,
      "clientName", "clientPhone", "clientEmail",
      "purposeId", "statusId", "exteriorId", "elevatorId", "acId",
      "yearsOld", floors, notes,
      "createdById", "createdAt", "updatedAt"
    ) VALUES (
      v_request_id, v_reference, v_area_id,
      (1 + floor(random() * 12))::text,                    -- block
      v_streets[1 + floor(random() * array_length(v_streets, 1))::int],
      (1 + floor(random() * 80))::text,                    -- house number
      29.0 + random(), 47.0 + random(),                    -- lat/lng around Kuwait
      v_names[i],                                           -- Arabic client name
      '9' || lpad(floor(random() * 10000000)::text, 7, '0'),
      NULL,
      v_purpose_id, v_status_id, v_exterior_id, v_elevator_id, v_ac_id,
      (1 + floor(random() * 30))::int,                     -- years old
      (1 + floor(random() * 3))::int,                      -- floors (1-3)
      v_notes[1 + floor(random() * array_length(v_notes, 1))::int],
      v_creator, v_now, v_now
    );

    -- assign the Electric criteria to this request
    v_rc_id := ('crc' || i::text || md5(random()::text || clock_timestamp()::text));
    INSERT INTO "RequestCriteria" (id, "requestId", "criteriaId", "createdAt", "updatedAt")
    VALUES (v_rc_id, v_request_id, v_criteria_id, v_now, v_now);

    -- snapshot each template measure into a filled RequestMeasure
    FOR m IN
      SELECT "nameEn", "nameAr", "displayOrder"
      FROM "CriteriaMeasure"
      WHERE "criteriaId" = v_criteria_id
      ORDER BY "displayOrder"
    LOOP
      -- random measure status (each measure gets a scored status)
      SELECT id INTO v_meas_status FROM "MeasureStatusOption" WHERE "isActive" ORDER BY random() LIMIT 1;

      INSERT INTO "RequestMeasure" (
        id, "requestCriteriaId", "nameEn", "nameAr", "displayOrder",
        "statusId", notes, recommendations, "createdAt", "updatedAt"
      ) VALUES (
        ('cm' || i::text || m."displayOrder"::text || md5(random()::text || clock_timestamp()::text)), v_rc_id, m."nameEn", m."nameAr", m."displayOrder",
        v_meas_status,
        v_notes[1 + floor(random() * array_length(v_notes, 1))::int],
        v_recs[1 + floor(random() * array_length(v_recs, 1))::int],
        v_now, v_now
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Inserted 30 requests (references % .. %) with Electric criteria filled.',
    'INS-' || v_year || '-' || lpad((v_start_seq + 1)::text, 4, '0'),
    'INS-' || v_year || '-' || lpad((v_start_seq + 30)::text, 4, '0');
END $$;
