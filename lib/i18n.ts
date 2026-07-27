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
  nav_lookups: { en: 'Lookups', ar: 'القوائم' },
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

  lookups_title: { en: 'Manage lookups', ar: 'إدارة القوائم' },
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
  loading: { en: 'Please wait…', ar: 'يرجى الانتظار…' },
  saving: { en: 'Saving…', ar: 'جارٍ الحفظ…' },
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

export function t(key: keyof typeof DICT | string, locale: Locale): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[locale];
}

export type Translator = (key: string) => string;

export function translator(locale: Locale): Translator {
  return (key: string) => t(key, locale);
}
