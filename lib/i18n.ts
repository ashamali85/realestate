export type Locale = 'en' | 'ar';

export const LOCALES: Locale[] = ['en', 'ar'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'ar';
}

export function dir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Picks the localized name from a lookup row that has nameEn / nameAr. */
export function localName(row: { nameEn: string; nameAr: string }, locale: Locale): string {
  return locale === 'ar' ? row.nameAr || row.nameEn : row.nameEn;
}

type Dict = Record<string, { en: string; ar: string }>;

const DICT: Dict = {
  app_name: { en: 'RealEstate Inspect', ar: 'فحص العقارات' },
  app_tagline: { en: 'Real estate inspection', ar: 'فحص العقارات' },

  nav_requests: { en: 'Requests', ar: 'الطلبات' },
  nav_new_request: { en: 'New request', ar: 'طلب جديد' },
  nav_lookups: { en: 'Request Lookups', ar: 'قوائم الطلبات' },
  nav_users: { en: 'Users', ar: 'المستخدمون' },
  nav_signout: { en: 'Sign out', ar: 'تسجيل الخروج' },
  nav_language: { en: 'العربية', ar: 'English' },

  login_title: { en: 'Sign in', ar: 'تسجيل الدخول' },
  login_subtitle: { en: 'Access the inspection system.', ar: 'الدخول إلى نظام الفحص.' },
  login_username: { en: 'Username', ar: 'اسم المستخدم' },
  login_password: { en: 'Password', ar: 'كلمة المرور' },
  login_submit: { en: 'Sign in', ar: 'دخول' },
  login_signing_in: { en: 'Signing in…', ar: 'جارٍ تسجيل الدخول…' },
  login_error: { en: 'Incorrect username or password.', ar: 'اسم المستخدم أو كلمة المرور غير صحيحة.' },

  requests_title: { en: 'Inspection requests', ar: 'طلبات الفحص' },
  requests_empty: { en: 'No requests yet.', ar: 'لا توجد طلبات بعد.' },
  requests_search: { en: 'Search reference, client, phone…', ar: 'ابحث بالمرجع أو العميل أو الهاتف…' },
  col_reference: { en: 'Reference', ar: 'المرجع' },
  col_client: { en: 'Client', ar: 'العميل' },
  col_area: { en: 'Area', ar: 'المنطقة' },
  col_governorate: { en: 'Governorate', ar: 'المحافظة' },
  col_created: { en: 'Created', ar: 'تاريخ الإنشاء' },
  col_actions: { en: 'Actions', ar: 'إجراءات' },

  form_new_title: { en: 'New inspection request', ar: 'طلب فحص جديد' },
  form_edit_title: { en: 'Edit inspection request', ar: 'تعديل طلب الفحص' },
  sec_address: { en: 'Address', ar: 'العنوان' },
  sec_location: { en: 'Map location', ar: 'الموقع على الخريطة' },
  sec_client: { en: 'Client', ar: 'العميل' },
  sec_property: { en: 'Property details', ar: 'تفاصيل العقار' },
  sec_images: { en: 'Property pictures', ar: 'صور العقار' },
  sec_kuwait_finder: { en: 'Kuwait Finder Picture', ar: 'صورة كويت فايندر' },
  sec_notes: { en: 'Other notes', ar: 'ملاحظات أخرى' },

  f_area: { en: 'Area', ar: 'المنطقة' },
  f_governorate: { en: 'Governorate', ar: 'المحافظة' },
  f_governorate_auto: { en: 'Set automatically from the area', ar: 'يُحدَّد تلقائيًا من المنطقة' },
  f_block: { en: 'Block', ar: 'قطعة' },
  f_street: { en: 'Street', ar: 'شارع' },
  f_house: { en: 'House number', ar: 'رقم المنزل' },
  f_client_name: { en: 'Client name', ar: 'اسم العميل' },
  f_client_phone: { en: 'Client phone', ar: 'هاتف العميل' },
  f_client_email: { en: 'Client email', ar: 'بريد العميل الإلكتروني' },
  f_purpose: { en: 'Purpose of request', ar: 'الغرض من الطلب' },
  f_status: { en: 'Real estate status', ar: 'حالة العقار' },
  f_years: { en: 'Age (years)', ar: 'العمر (سنوات)' },
  f_floors: { en: 'Number of floors', ar: 'عدد الطوابق' },
  inspection_date: { en: 'Inspection date', ar: 'تاريخ الفحص' },
  report_export: { en: 'Export report', ar: 'تصدير التقرير' },
  report_choose_title: { en: 'Choose report type', ar: 'اختر نوع التقرير' },
  report_general: { en: 'General report', ar: 'تقرير عام' },
  report_detailed: { en: 'Detailed report', ar: 'تقرير مفصّل' },
  report_general_desc: { en: 'Summary on one page: client info, photos, and overall rating.', ar: 'ملخّص في صفحة واحدة: بيانات العميل والصور والتقييم العام.' },
  report_detailed_desc: { en: 'Full breakdown of every criteria and measure.', ar: 'تفصيل كامل لكل معيار وقياس.' },
  report_overall_rating: { en: 'Overall property rating', ar: 'التقييم العام للعقار' },
  report_client_info: { en: 'Client information', ar: 'بيانات العميل' },
  report_property_image: { en: 'Property picture', ar: 'صورة العقار' },
  report_kuwait_finder: { en: 'Kuwait Finder picture', ar: 'صورة كويت فايندر' },
  report_no_image: { en: 'No image provided', ar: 'لا توجد صورة' },
  report_print: { en: 'Print / Save as PDF', ar: 'طباعة / حفظ PDF' },
  report_not_rated: { en: 'Not yet rated', ar: 'لم يُقيّم بعد' },
  report_ref: { en: 'Reference', ar: 'رقم المرجع' },
  f_inspection_date: { en: 'Select an inspection date', ar: 'اختر تاريخ الفحص' },
  land_area: { en: 'Land area (m²)', ar: 'مساحة الأرض (م²)' },
  construction_pct: { en: 'Construction percentage (%)', ar: 'نسبة البناء (%)' },
  construction_area: { en: 'Construction area (m²)', ar: 'مساحة البناء (م²)' },
  f_land_area: { en: 'Enter a valid land area', ar: 'أدخل مساحة أرض صحيحة' },
  f_construction_pct: { en: 'Percentage must be between 0 and 100', ar: 'النسبة يجب أن تكون بين 0 و100' },
  f_construction_area: { en: 'Enter a valid construction area', ar: 'أدخل مساحة بناء صحيحة' },
  f_exterior: { en: 'Exterior', ar: 'الواجهة الخارجية' },
  f_elevator: { en: 'Elevator', ar: 'المصعد' },
  f_ac: { en: 'Air conditioning', ar: 'التكييف' },
  f_pick_on_map: { en: 'Click the map to drop a pin, or drag it to adjust.', ar: 'انقر على الخريطة لوضع الدبوس، أو اسحبه للضبط.' },
  f_lat: { en: 'Latitude', ar: 'خط العرض' },
  f_lng: { en: 'Longitude', ar: 'خط الطول' },
  f_choose: { en: 'Choose…', ar: 'اختر…' },
  f_images_hint: { en: 'JPEG, PNG or WebP, up to 4 MB each.', ar: 'JPEG أو PNG أو WebP، حتى 4 ميغابايت لكل صورة.' },
  dz_prompt: { en: 'Drag photos here', ar: 'اسحب الصور إلى هنا' },
  dz_browse: { en: 'Browse files', ar: 'تصفّح الملفات' },
  dz_wrong_type: { en: 'Only JPEG, PNG or WebP images are allowed.', ar: 'يُسمح فقط بصور JPEG أو PNG أو WebP.' },
  dz_uploading: { en: 'Uploading…', ar: 'جارٍ الرفع…' },
  dz_upload_failed: { en: 'Upload failed. Please try again.', ar: 'فشل الرفع. حاول مرة أخرى.' },
  dz_upload_partial: { en: 'Uploaded {n}, but the rest failed. Please retry the others.', ar: 'تم رفع {n}، لكن فشل الباقي. أعد المحاولة.' },
  dz_remaining: { en: '{n} left', ar: 'يتبقّى {n}' },
  dz_max_reached: { en: 'Up to {n} photos.', ar: 'حتى {n} صور.' },
  dz_too_much: {
    en: 'Total attachments are too large. Remove some or add them in smaller batches.',
    ar: 'حجم المرفقات كبير جدًا. أزل بعضها أو أضفها على دفعات أصغر.'
  },
  f_notes_ph: { en: 'Anything else worth recording…', ar: 'أي شيء آخر يستحق التسجيل…' },

  btn_save: { en: 'Save request', ar: 'حفظ الطلب' },
  btn_saving: { en: 'Saving…', ar: 'جارٍ الحفظ…' },
  btn_cancel: { en: 'Cancel', ar: 'إلغاء' },
  btn_edit: { en: 'Edit', ar: 'تعديل' },
  btn_delete: { en: 'Delete', ar: 'حذف' },
  btn_add: { en: 'Add', ar: 'إضافة' },
  btn_view: { en: 'View', ar: 'عرض' },
  btn_confirm: { en: 'Confirm', ar: 'تأكيد' },

  // Criteria
  nav_criteria: { en: 'Criteria', ar: 'المعايير' },
  nav_measure_lookups: { en: 'Measure Lookups', ar: 'قوائم القياسات' },
  measure_lookups_title: { en: 'Measure Lookups', ar: 'قوائم القياسات' },
  measure_lookups_intro: {
    en: 'Maintain the status list used by criteria measures. This is separate from the request status list.',
    ar: 'إدارة قائمة الحالات المستخدمة في قياسات المعايير. وهي منفصلة عن قائمة حالات الطلبات.'
  },
  measure_status_title: { en: 'Measure Status', ar: 'حالة القياس' },
  nav_manage_link: { en: 'Navigation', ar: 'التنقل' },
  nav_manage_title: { en: 'Manage Navigation', ar: 'إدارة التنقل' },
  nav_manage_intro: {
    en: 'Reorder the top menu links and rename them in both languages. Destinations stay fixed.',
    ar: 'أعد ترتيب روابط القائمة العلوية وأعد تسميتها باللغتين. الوجهات تبقى ثابتة.'
  },
  nav_order: { en: 'Order', ar: 'الترتيب' },
  measure_score: { en: 'Score (0–3)', ar: 'الدرجة (0–3)' },
  lookup_edit_title: { en: 'Edit item', ar: 'تعديل العنصر' },
  geo_edit_gov: { en: 'Edit governorate', ar: 'تعديل المحافظة' },
  geo_edit_area: { en: 'Edit area', ar: 'تعديل المنطقة' },
  criteria_edit_title: { en: 'Edit criteria', ar: 'تعديل المعيار' },
  measure_edit_title: { en: 'Edit measure', ar: 'تعديل القياس' },

  // Floors
  floor_basement: { en: 'Basement', ar: 'السرداب' },
  floor_ground: { en: 'Ground', ar: 'الأرضي' },
  floor_mezzanine: { en: 'Mezzanine', ar: 'الميزانين' },
  floor_first: { en: 'First', ar: 'الأول' },
  floor_second: { en: 'Second', ar: 'الثاني' },
  f_has_basement: { en: 'Has basement', ar: 'يوجد سرداب' },
  f_has_mezzanine: { en: 'Has mezzanine', ar: 'يوجد ميزانين' },
  f_mezzanine_invalid: {
    en: 'A mezzanine requires a basement or at least a first floor above the ground floor.',
    ar: 'يتطلب الميزانين وجود سرداب أو طابق أول على الأقل فوق الطابق الأرضي.'
  },
  yes: { en: 'Yes', ar: 'نعم' },
  no: { en: 'No', ar: 'لا' },
  floor_remove_warning: {
    en: 'A criteria has measures filled in for a floor you are removing. Those entries will be lost. Are you sure?',
    ar: 'يوجد معيار يحتوي على قياسات مُدخلة لطابق ستقوم بإزالته. سيتم فقدان تلك البيانات. هل أنت متأكد؟'
  },

  // Labels admin
  nav_labels: { en: 'Labels', ar: 'النصوص' },
  not_found: { en: 'Page not found.', ar: 'الصفحة غير موجودة.' },
  labels_title: { en: 'Edit labels', ar: 'تعديل النصوص' },
  labels_intro: {
    en: 'Customize any text in the app. Changes apply everywhere the label is used.',
    ar: 'خصّص أي نص في التطبيق. تُطبّق التغييرات في كل مكان يُستخدم فيه النص.'
  },
  label_key: { en: 'Key', ar: 'المفتاح' },
  label_search: { en: 'Search labels…', ar: 'ابحث في النصوص…' },
  label_status: { en: 'Status', ar: 'الحالة' },
  label_custom: { en: 'Custom', ar: 'مخصّص' },
  label_default: { en: 'Default', ar: 'افتراضي' },
  label_none: { en: 'No labels match your search.', ar: 'لا توجد نصوص مطابقة لبحثك.' },
  label_edit_title: { en: 'Edit label', ar: 'تعديل النص' },
  label_reset: { en: 'Reset to default', ar: 'إعادة للافتراضي' },
  label_reset_confirm: {
    en: 'Reset this label to its default text?',
    ar: 'إعادة هذا النص إلى قيمته الافتراضية؟'
  },
  eval_score: { en: 'Score', ar: 'الدرجة' },
  eval_criteria_score: { en: 'Criteria score', ar: 'درجة المعيار' },
  eval_overall_score: { en: 'Overall score', ar: 'الدرجة الإجمالية' },
  eval_unscored: { en: 'Not scored', ar: 'غير مقيّم' },
  criteria_title: { en: 'Evaluation Criteria', ar: 'معايير التقييم' },
  criteria_intro: {
    en: 'Define reusable evaluation criteria and their measures. Assign them to requests to fill in values.',
    ar: 'عرّف معايير تقييم قابلة لإعادة الاستخدام وقياساتها. عيّنها للطلبات لتعبئة القيم.'
  },
  criteria_name: { en: 'Criteria name', ar: 'اسم المعيار' },
  criteria_add: { en: 'Add criteria', ar: 'إضافة معيار' },
  criteria_measures: { en: 'Measures', ar: 'القياسات' },
  measure_name: { en: 'Measure name', ar: 'اسم القياس' },
  measure_add: { en: 'Add measure', ar: 'إضافة قياس' },
  measure_none: { en: 'No measures yet. Add the first one.', ar: 'لا توجد قياسات بعد. أضف الأول.' },
  criteria_none: { en: 'No criteria yet.', ar: 'لا توجد معايير بعد.' },
  col_criteria_name: { en: 'Criteria', ar: 'المعيار' },
  col_status: { en: 'Status', ar: 'الحالة' },
  col_measures_count: { en: 'Measures', ar: 'القياسات' },
  status_active: { en: 'Active', ar: 'مفعّل' },
  lookup_items: { en: 'items', ar: 'عناصر' },

  // Assignment / fill on a request
  sec_evaluation: { en: 'Evaluation', ar: 'التقييم' },
  sec_criteria: { en: 'Criteria', ar: 'المعايير' },
  assign_criteria: { en: 'Assign criteria', ar: 'تعيين معيار' },
  assign_choose: { en: 'Choose a criteria to assign…', ar: 'اختر معيارًا لتعيينه…' },
  assign_btn: { en: 'Assign', ar: 'تعيين' },
  unassign_confirm: { en: 'Remove this criteria and all its filled values from the request?', ar: 'إزالة هذا المعيار وكل قيمه من الطلب؟' },
  m_status: { en: 'Status', ar: 'الحالة' },
  m_notes: { en: 'Notes', ar: 'ملاحظات' },
  m_recommendations: { en: 'Recommendations', ar: 'التوصيات' },
  m_attachments: { en: 'Attachments', ar: 'المرفقات' },
  m_save: { en: 'Save measure', ar: 'حفظ القياس' },
  eval_none: { en: 'No criteria assigned to this request yet.', ar: 'لم يتم تعيين أي معيار لهذا الطلب بعد.' },
  all_assigned: { en: 'All criteria are already assigned.', ar: 'تم تعيين جميع المعايير بالفعل.' },

  lookups_title: { en: 'Request Lookups', ar: 'قوائم الطلبات' },
  lookup_purpose: { en: 'Purpose', ar: 'الغرض' },
  lookup_status: { en: 'Status', ar: 'الحالة' },
  lookup_exterior: { en: 'Exterior', ar: 'الواجهة' },
  lookup_elevator: { en: 'Elevator', ar: 'المصعد' },
  lookup_ac: { en: 'Air conditioning', ar: 'التكييف' },
  lookup_areas: { en: 'Areas & governorates', ar: 'المناطق والمحافظات' },
  lookup_name_en: { en: 'Name (English)', ar: 'الاسم (إنجليزي)' },
  lookup_name_ar: { en: 'Name (Arabic)', ar: 'الاسم (عربي)' },
  lookup_active: { en: 'Active', ar: 'مُفعّل' },

  users_title: { en: 'Users', ar: 'المستخدمون' },
  u_name: { en: 'Name', ar: 'الاسم' },
  u_username: { en: 'Username', ar: 'اسم المستخدم' },
  u_role: { en: 'Role', ar: 'الدور' },
  u_password: { en: 'Password', ar: 'كلمة المرور' },
  u_role_super: { en: 'Super admin', ar: 'مدير عام' },
  u_role_inspector: { en: 'Inspector', ar: 'مفتش' },
  u_active: { en: 'Active', ar: 'مُفعّل' },

  saved_ok: { en: 'Saved.', ar: 'تم الحفظ.' },
  loading: { en: 'Working…', ar: 'جاري العمل' },
  saving: { en: 'Working…', ar: 'جاري العمل' },
  upload_partial: {
    en: 'The request was saved, but some photos failed to upload. Open the request and try adding them again.',
    ar: 'تم حفظ الطلب، لكن تعذّر رفع بعض الصور. افتح الطلب وحاول إضافتها مرة أخرى.'
  },
  required: { en: 'This field is required.', ar: 'هذا الحقل مطلوب.' },
  confirm_delete: { en: 'Delete this permanently?', ar: 'حذف هذا نهائيًا؟' },
  confirm_delete_request: {
    en: 'Are you sure you want to delete this request? This cannot be undone.',
    ar: 'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن ذلك.'
  },

  // Filters
  filter_all: { en: 'All', ar: 'الكل' },
  filter_clear: { en: 'Clear filters', ar: 'مسح عوامل التصفية' },
  showing_n: { en: 'Showing', ar: 'عرض' },
  of_n: { en: 'of', ar: 'من' },

  // Lookups admin
  lookups_intro: {
    en: 'Add, rename, reorder or deactivate the options used across request forms.',
    ar: 'أضف أو أعد تسمية أو رتّب أو عطّل الخيارات المستخدمة في نماذج الطلبات.'
  },
  lookup_add_new: { en: 'Add new', ar: 'إضافة جديد' },
  lookup_order: { en: 'Order', ar: 'الترتيب' },
  gov_title: { en: 'Governorates', ar: 'المحافظات' },
  area_title: { en: 'Areas', ar: 'المناطق' },
  area_of_gov: { en: 'Governorate', ar: 'المحافظة' },
  lookup_inuse: {
    en: 'In use by requests — deactivate instead of deleting.',
    ar: 'مستخدم في الطلبات — قم بالتعطيل بدلاً من الحذف.'
  },

  // Users admin
  users_intro: {
    en: 'Create inspector and admin accounts, and activate or deactivate them.',
    ar: 'أنشئ حسابات المفتشين والمديرين، وقم بتفعيلها أو تعطيلها.'
  },
  user_add: { en: 'Add user', ar: 'إضافة مستخدم' },
  user_new_password: { en: 'New password', ar: 'كلمة مرور جديدة' },
  user_reset_password: { en: 'Reset password', ar: 'إعادة تعيين كلمة المرور' },
  user_leave_blank: { en: 'Leave blank to keep current', ar: 'اتركه فارغًا للإبقاء على الحالي' },
  user_activate: { en: 'Activate', ar: 'تفعيل' },
  user_deactivate: { en: 'Deactivate', ar: 'تعطيل' },
  user_status: { en: 'Status', ar: 'الحالة' },
  user_inactive: { en: 'Inactive', ar: 'غير مفعّل' },
  user_self_note: { en: 'You', ar: 'أنت' },
  password_too_short: { en: 'Password must be at least 8 characters.', ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.' },
  username_taken: { en: 'That username is already taken.', ar: 'اسم المستخدم مستخدم بالفعل.' },

  btn_save_changes: { en: 'Save changes', ar: 'حفظ التغييرات' },
  section_toggle: { en: 'Toggle section', ar: 'طيّ/فتح القسم' }
};

// Admin overrides loaded from the database. When present for a key/locale they
// Admin overrides for UI text. These must be request-scoped: a plain module
// variable would be shared across concurrent requests on the server and cause
// values to flip between requests. On the server we use React cache() so each
// request gets its own isolated store. On the client we use a plain variable
// set once from context (a single client has one consistent value).
import { cache } from 'react';

type OverrideMap = Record<string, { en?: string | null; ar?: string | null }>;

// Server: request-scoped holder. cache() returns the same object within one
// request and a fresh one per request, so there is no cross-request bleed.
const serverOverrides = cache((): { current: OverrideMap } => ({ current: {} }));

// Client: a single browser has one user/one value, so a module variable is safe
// here (it is NOT shared across users the way the server would be).
let clientOverrides: OverrideMap = {};

const isServer = typeof window === 'undefined';

export function setLabelOverrides(overrides: OverrideMap): void {
  if (isServer) {
    serverOverrides().current = overrides ?? {};
  } else {
    clientOverrides = overrides ?? {};
  }
}

function getOverrides(): OverrideMap {
  return isServer ? serverOverrides().current : clientOverrides;
}

/** The built-in default text for a key (ignores overrides). */
export function defaultText(key: string, locale: Locale): string | undefined {
  return DICT[key]?.[locale];
}

/** All dictionary keys with their default en/ar, for the admin editor. */
export function allLabels(): Array<{ key: string; en: string; ar: string }> {
  return Object.entries(DICT).map(([key, v]) => ({ key, en: v.en, ar: v.ar }));
}

export function t(key: keyof typeof DICT | string, locale: Locale): string {
  const override = getOverrides()[key as string];
  if (override) {
    const val = override[locale];
    if (val != null && val !== '') return val;
  }
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale];
}

export type Translator = (key: string) => string;

export function translator(locale: Locale): Translator {
  return (key: string) => t(key, locale);
}
