export type Lang = 'ar' | 'darija' | 'fr' | 'en';
type T = Record<string, string>;

// ── Modern Standard Arabic ────────────────────────────────────────────────────
const ar: T = {
  // Language names
  'lang.ar': 'العربية', 'lang.darija': 'الدارجة', 'lang.fr': 'Français', 'lang.en': 'English',

  // Navigation
  'nav.dashboard': 'لوحة التحكم', 'nav.products': 'المنتجات', 'nav.orders': 'الطلبات',
  'nav.messages': 'الرسائل', 'nav.customers': 'العملاء', 'nav.analytics': 'التحليلات',
  'nav.insights': 'الأداء', 'nav.connections': 'الاتصالات', 'nav.delivery': 'التوصيل',
  'nav.notifications': 'الإشعارات', 'nav.settings': 'الإعدادات', 'nav.myStore': 'متجري',
  'nav.studio': 'الاستوديو', 'nav.coupons': 'الكوبونات', 'nav.services': 'الخدمات',
  'nav.import': 'استيراد المحادثات',

  // Common actions
  'save': 'حفظ', 'cancel': 'إلغاء', 'delete': 'حذف', 'edit': 'تعديل',
  'add': 'إضافة', 'search': 'بحث...', 'filter': 'تصفية', 'export': 'تصدير',
  'import': 'استيراد', 'close': 'إغلاق', 'back': 'رجوع', 'next': 'التالي',
  'previous': 'السابق', 'confirm': 'تأكيد', 'reject': 'رفض', 'approve': 'قبول',
  'connect': 'اتصال وتحقق', 'disconnect': 'قطع الاتصال', 'test': 'اختبار',
  'refresh': 'تحديث', 'view': 'عرض', 'copy': 'نسخ', 'share': 'مشاركة',
  'print': 'طباعة', 'loading': 'جارٍ التحميل...', 'saving': 'جارٍ الحفظ...',
  'sending': 'جارٍ الإرسال...', 'testing': 'جارٍ الاختبار...', 'yes': 'نعم', 'no': 'لا',
  'all': 'الكل', 'total': 'المجموع', 'date': 'التاريخ', 'name': 'الاسم',
  'price': 'السعر', 'phone': 'الهاتف', 'city': 'المدينة', 'address': 'العنوان',
  'notes': 'ملاحظات', 'status': 'الحالة', 'actions': 'الإجراءات', 'details': 'التفاصيل',
  'enable': 'تفعيل', 'disable': 'إيقاف', 'enabled': 'مفعّل', 'disabled': 'معطّل',
  'required': 'مطلوب', 'optional': 'اختياري', 'new': 'جديد', 'send': 'إرسال',

  // Status
  'status.active': 'نشط', 'status.inactive': 'غير نشط', 'status.pending': 'قيد الانتظار',
  'status.approved': 'مقبول', 'status.rejected': 'مرفوض', 'status.processing': 'قيد المعالجة',
  'status.shipped': 'تم الشحن', 'status.delivered': 'تم التوصيل', 'status.cancelled': 'ملغي',

  // Dashboard
  'dashboard.title': 'لوحة التحكم', 'dashboard.sub': 'نظرة شاملة على أداء متجرك',
  'dashboard.revenue': 'إجمالي الإيرادات', 'dashboard.orders': 'الطلبات',
  'dashboard.customers': 'العملاء', 'dashboard.products': 'المنتجات',
  'dashboard.today': 'اليوم', 'dashboard.week': 'هذا الأسبوع', 'dashboard.month': 'هذا الشهر',
  'dashboard.pending': 'بانتظار المعالجة', 'dashboard.goodMorning': 'صباح الخير',
  'dashboard.goodEvening': 'مساء الخير', 'dashboard.noOrders': 'لا توجد طلبات جديدة',

  // Products
  'products.title': 'المنتجات والخدمات', 'products.sub': 'أضف منتجاتك وشاركها مع عملائك',
  'products.add': 'إضافة منتج', 'products.edit': 'تعديل المنتج', 'products.name': 'اسم المنتج',
  'products.price': 'السعر', 'products.oldPrice': 'السعر الأصلي', 'products.stock': 'المخزون',
  'products.category': 'الفئة', 'products.description': 'الوصف', 'products.images': 'الصور',
  'products.addImages': 'إضافة صور', 'products.saved': '✅ تم حفظ "{name}" بنجاح',
  'products.updated': '✅ تم تحديث "{name}"', 'products.deleted': '🗑️ تم حذف "{name}"',
  'products.deleteConfirm': 'هل تريد حذف "{name}" نهائياً؟',
  'products.empty': 'لم تضف أي منتج بعد', 'products.addFirst': 'أضف منتجك الأول الآن',
  'products.validName': 'يرجى إدخال اسم المنتج', 'products.validPrice': 'يرجى إدخال سعر صحيح',
  'products.addImage': 'أضف صورة واحدة على الأقل',
  'products.stockAdjusted': '📦 تم تحديث مخزون "{name}"',
  'products.imageTypeError': '⚠️ نوع الملف غير مدعوم — استخدم JPG أو PNG أو WebP',
  'products.imageSizeError': '⚠️ الصورة تتجاوز الحد المسموح (5MB)',
  'products.imageLimitError': '⚠️ الحد الأقصى 10 صور',
  'products.noImages': '⚠️ لم تضف أي صورة — سيظهر المنتج بدون صورة',
  'products.duplicate': '⚠️ يوجد منتج بهذا الاسم مسبقاً',

  // Orders
  'orders.title': 'الطلبات', 'orders.sub': 'تابع وأدر جميع الطلبات الواردة',
  'orders.new': 'طلب جديد', 'orders.approve': 'قبول', 'orders.reject': 'رفض',
  'orders.ship': 'شحن', 'orders.deliver': 'تسليم',
  'orders.approved': '✅ تم قبول الطلب #{id}', 'orders.rejected': '❌ تم رفض الطلب #{id}',
  'orders.shipped': '🚚 تم شحن الطلب #{id}', 'orders.delivered': '✅ تم تسليم الطلب #{id}',
  'orders.customer': 'العميل', 'orders.tracking': 'رقم التتبع',
  'orders.empty': 'لا توجد طلبات حتى الآن', 'orders.items': 'المنتجات',
  'orders.rejectReason': 'سبب الرفض (اختياري)', 'orders.confirmApprove': 'قبول هذا الطلب؟',
  'orders.confirmReject': 'رفض هذا الطلب؟', 'orders.created': '🛒 تم إنشاء طلب جديد',

  // Customers
  'customers.title': 'العملاء', 'customers.sub': 'قاعدة بيانات عملائك الكاملة',
  'customers.add': 'إضافة عميل', 'customers.edit': 'تعديل البيانات',
  'customers.name': 'الاسم الكامل', 'customers.phone': 'رقم الهاتف',
  'customers.saved': '✅ تم حفظ بيانات {name}', 'customers.updated': '✅ تم تحديث {name}',
  'customers.deleted': '🗑️ تم حذف {name}', 'customers.madeVip': '⭐ {name} أصبح عميلاً مميزاً',
  'customers.removedVip': '{name} أُزيل من العملاء المميزين',
  'customers.dupPhone': '⚠️ رقم الهاتف مسجل مسبقاً لـ {name}',
  'customers.empty': 'لا يوجد عملاء حتى الآن',
  'customers.validName': 'يرجى إدخال اسم العميل',
  'customers.validPhone': 'يرجى إدخال رقم هاتف صحيح',
  'customers.deleteConfirm': 'هل تريد حذف {name} نهائياً؟',

  // Messages
  'messages.title': 'المحادثات', 'messages.sub': 'تواصل مع عملائك بشكل مباشر',
  'messages.placeholder': 'اكتب رسالتك...', 'messages.deleted': '🗑️ تم حذف المحادثة',
  'messages.pinned': '📌 تم تثبيت المحادثة', 'messages.unpinned': 'تم إلغاء تثبيت المحادثة',
  'messages.empty': 'لا توجد محادثات بعد', 'messages.noConv': 'اختر محادثة للبدء',
  'messages.aiTyping': 'الذكاء الاصطناعي يكتب...', 'messages.markedRead': 'تم تحديد المحادثات كمقروءة',

  // Connections
  'connections.title': 'ربط الخدمات', 'connections.sub': 'اربط حساباتك مرة واحدة — النظام يتكفل بالباقي',
  'connections.status': 'حالة الاتصالات', 'connections.testAll': 'اختبار جميع الاتصالات',
  'connections.guide': 'كيف تحصل على هذه المعلومات؟',
  'connections.officialGuide': 'الدليل الرسمي', 'connections.fillAll': 'يرجى ملء جميع الحقول',
  'connections.connected': '✅ {name} متصل! {info}', 'connections.disconnected': '🔌 تم قطع الاتصال بـ {name}',
  'connections.failed': '❌ {name}: {error}', 'connections.serverManaged': '🔒 مُدار بالخادم',
  'connections.serverManagedDesc': 'هذه الخدمة مُفعَّلة عبر متغيرات البيئة — لا حاجة لإدخال البيانات يدوياً',
  'connections.afterConnect': '🔓 بعد الربط يمكنك:',
  'connections.noConfig': 'التطبيق يعمل بمحاكاة ذكية بدون ربط — الربط للنشر الحقيقي فقط',
  'connections.secNote': 'ملاحظة أمنية', 'connections.secDesc': 'المفاتيح تُحفظ مشفّرة في قاعدة البيانات. لا تشاركها مع أحد.',
  'connections.retest': 'إعادة اختبار',

  // Delivery
  'delivery.title': 'شركات التوصيل', 'delivery.sub': 'إعداد شركات التوصيل للشحن التلقائي',
  'delivery.add': 'إضافة شركة', 'delivery.saved': '✅ تم إضافة {name}',
  'delivery.deleted': '🗑️ تم حذف شركة التوصيل', 'delivery.test': 'اختبار',
  'delivery.responds': '✅ {name} يستجيب · {info}', 'delivery.noResponse': '⚠️ لا يمكن الوصول إلى {name}',
  'delivery.empty': 'لم تضف شركة توصيل بعد', 'delivery.fillRequired': 'يرجى ملء: الاسم، رابط الدخول، المستخدم، كلمة المرور',
  'delivery.whatsappDesc': 'أضف رقم واتساب شركة التوصيل — سيتم إرسال تفاصيل الطلب تلقائياً',
  'delivery.autoSend': 'إرسال تلقائي للتوصيل عند الموافقة',
  'delivery.notifyCustomer': 'إشعار العميل عند الشحن',
  'delivery.unsaved': 'لديك بيانات غير محفوظة. هل تريد الإغلاق؟',

  // Settings
  'settings.title': 'الإعدادات', 'settings.sub': 'إعدادات متجرك والتطبيق',
  'settings.brand': 'العلامة التجارية', 'settings.storeName': 'اسم المتجر',
  'settings.language': 'اللغة', 'settings.theme': 'المظهر', 'settings.currency': 'العملة',
  'settings.ai': 'إعدادات الذكاء الاصطناعي', 'settings.saved': '✅ تم حفظ الإعدادات',
  'settings.passwordSaved': '✅ تم تغيير كلمة المرور بنجاح',
  'settings.passwordError': '❌ كلمة المرور الحالية غير صحيحة',
  'settings.passwordShort': '⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل',

  // Analytics
  'analytics.title': 'التحليلات والأداء', 'analytics.sub': 'تتبع أداء متجرك بالتفصيل',

  // Notifications
  'notif.title': 'الإشعارات', 'notif.empty': 'لا توجد إشعارات', 'notif.markAll': 'تحديد الكل كمقروء',
  'notif.session': '🔒 انتهت صلاحية الجلسة — يرجى إعادة تسجيل الدخول',
  'notif.network': '🌐 خطأ في الاتصال — تحقق من الإنترنت',
  'notif.synced': '☁️ تمت المزامنة السحابية بنجاح',
  'notif.syncFail': '⚠️ فشلت المزامنة — سيُعاد المحاولة',

  // Auth
  'auth.login': 'تسجيل الدخول', 'auth.loginSub': 'أهلاً بعودتك — أدر متجرك الذكي',
  'auth.register': 'إنشاء حساب جديد', 'auth.registerSub': 'أطلق متجرك مجاناً اليوم',
  'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة المرور',
  'auth.storeName': 'اسم المتجر (اختياري)', 'auth.haveAccount': 'لديك حساب بالفعل؟',
  'auth.noAccount': 'ليس لديك حساب؟', 'auth.demo': 'تجربة مجانية بدون تسجيل',
  'auth.loginSuccess': '✅ أهلاً بعودتك!', 'auth.registerSuccess': '🎉 مرحباً بك في SAHAR shop!',
  'auth.logoutConfirm': 'هل تريد تسجيل الخروج؟', 'auth.loginBtn': 'دخول',
  'auth.registerBtn': 'إنشاء حساب', 'auth.logout': 'خروج',
  'auth.fillAll': 'يرجى ملء البريد الإلكتروني وكلمة المرور',

  // Landing page
  'landing.hero.title1': 'نظام التجارة الذكي',
  'landing.hero.title2': 'للتاجر المغربي',
  'landing.how.step1': 'أضف منتجاتك وخدماتك',
  'landing.how.step2': 'أدر طلباتك بالذكاء الاصطناعي',
  'landing.how.step3': 'وصّل واجمع أرباحك',
  'onboarding.type.product': 'منتجات', 'onboarding.type.service': 'خدمات', 'onboarding.type.both': 'منتجات وخدمات', 'onboarding.skip': 'تخطي',
  'landing.tagline': 'منصة التجارة الذكية', 'landing.subtitle': 'أطلق متجرك الرقمي وبع أكثر بقوة الذكاء الاصطناعي',
  'landing.customer.title': 'أنا عميل', 'landing.customer.desc': 'تصفح المنتجات واطلب مع توصيل سريع',
  'landing.customer.cta': 'تسوق الآن',
  'landing.customer.f1': 'منتجات متنوعة', 'landing.customer.f2': 'توصيل سريع', 'landing.customer.f3': 'أسعار تنافسية',
  'landing.customer.noLink': 'اطلب من التاجر مشاركة رابط متجره',
  'landing.merchant.title': 'أنا تاجر', 'landing.merchant.desc': 'أضف منتجاتك وأدر طلباتك بذكاء اصطناعي',
  'landing.merchant.ctaNew': 'ابدأ مجاناً', 'landing.merchant.ctaExisting': 'لوحة التحكم',
  'landing.merchant.f1': 'ذكاء اصطناعي', 'landing.merchant.f2': 'إدارة الطلبات', 'landing.merchant.f3': 'تحليلات متقدمة',
  'landing.feature.ai': 'ذكاء اصطناعي', 'landing.feature.whatsapp': 'واتساب',
  'landing.feature.delivery': 'توصيل ذكي', 'landing.feature.analytics': 'تحليلات',
  'landing.feature.secure': 'آمن 100٪', 'landing.feature.banner': 'بنر AI',
  'landing.stats.merchants': 'تاجر نشط', 'landing.stats.products': 'منتج', 'landing.stats.orders': 'طلب يومياً',

  // Tour guide
  'tour.skip': 'تخطي', 'tour.next': 'التالي', 'tour.prev': 'السابق',
  'tour.finish': 'ابدأ الاستخدام ✨', 'tour.step': '{cur} / {total}',
  'tour.s1.title': 'لوحة التحكم', 'tour.s1.desc': 'نظرة شاملة على أداء متجرك — الإيرادات والطلبات والعملاء في لمحة واحدة.',
  'tour.s2.title': 'المنتجات', 'tour.s2.desc': 'أضف منتجاتك بالصور والأوصاف والأسعار. يمكن للذكاء الاصطناعي توليد الأوصاف والهاشتاق تلقائياً.',
  'tour.s3.title': 'الطلبات', 'tour.s3.desc': 'تابع كل طلب من الاستلام حتى التوصيل. اقبل أو ارفض أو أرسل للشحن بضغطة زر.',
  'tour.s4.title': 'الرسائل', 'tour.s4.desc': 'تحدث مع عملائك مباشرة. يمكن للذكاء الاصطناعي الرد بالدارجة أو العربية أو الفرنسية.',
  'tour.s5.title': 'العملاء', 'tour.s5.desc': 'قاعدة بيانات كاملة لعملائك مع تاريخ الطلبات ونقاط الولاء والتصنيف.',
  'tour.s6.title': 'التوصيل', 'tour.s6.desc': 'أضف شركات التوصيل — النظام يملأ بيانات الطلب تلقائياً بدونك.',
  'tour.s7.title': 'ربط الخدمات', 'tour.s7.desc': 'اربط متجرك بـ WhatsApp وOpenAI وInstagram وCloudinary لتفعيل جميع الميزات.',
  'tour.s8.title': 'الإعدادات', 'tour.s8.desc': 'خصّص اسم متجرك والعملة والألوان والذكاء الاصطناعي والإشعارات.',
  'tour.s9.title': 'متجرك للعملاء', 'tour.s9.desc': 'متجرك الرقمي جاهز الآن! شارك الرابط مع عملائك ليطلبوا منك مباشرة.',
};

// ── Moroccan Darija ───────────────────────────────────────────────────────────
const darija: T = {
  'lang.ar': 'العربية', 'lang.darija': 'الدارجة', 'lang.fr': 'Français', 'lang.en': 'English',

  'nav.dashboard': 'الداشبور', 'nav.products': 'البضايع', 'nav.orders': 'الكوماندات',
  'nav.messages': 'الرسايل', 'nav.customers': 'الزبناء', 'nav.analytics': 'الإحصائيات',
  'nav.insights': 'الپرفورمانس', 'nav.connections': 'الربط ديال الخدمات', 'nav.delivery': 'التوصيل',
  'nav.notifications': 'الإشعارات', 'nav.settings': 'الپاراميترات', 'nav.myStore': 'متجري',
  'nav.studio': 'الاستوديو', 'nav.coupons': 'الكوبونات',

  'save': 'سجّل', 'cancel': 'إلغاء', 'delete': 'امسح', 'edit': 'عدّل',
  'add': 'زيد', 'search': 'قلّب على...', 'filter': 'فلتر', 'export': 'صدّر',
  'import': 'استورد', 'close': 'سكّر', 'back': 'ارجع', 'next': 'التالي',
  'previous': 'اللي فات', 'confirm': 'تأكيد', 'reject': 'ارفض', 'approve': 'قبل',
  'connect': 'وصّل وتحقق', 'disconnect': 'قطّع', 'test': 'اختبر',
  'refresh': 'جدّد', 'view': 'شوف', 'copy': 'نقل', 'share': 'شارك',
  'print': 'طبّع', 'loading': 'كيتحمّل...', 'saving': 'كيتسجّل...',
  'sending': 'كيتبعت...', 'testing': 'كيتختبر...', 'yes': 'آه', 'no': 'لا',
  'all': 'الكل', 'total': 'المجموع', 'date': 'التاريخ', 'name': 'الاسم',
  'price': 'الثمن', 'phone': 'التيليفون', 'city': 'المدينة', 'address': 'العنوان',
  'notes': 'ملاحظات', 'status': 'الحالة', 'actions': 'الإجراءات', 'details': 'التفاصيل',
  'enable': 'فعّل', 'disable': 'عطّل', 'enabled': 'مفعّل', 'disabled': 'معطّل',
  'required': 'مطلوب', 'optional': 'اختياري', 'new': 'جديد', 'send': 'بعّث',

  'status.active': 'نشط', 'status.inactive': 'مش نشط', 'status.pending': 'فباش يتعالج',
  'status.approved': 'مقبول', 'status.rejected': 'مرفوض', 'status.processing': 'كيتعالج',
  'status.shipped': 'تشحن', 'status.delivered': 'وصل', 'status.cancelled': 'ملغي',

  'dashboard.title': 'الداشبور', 'dashboard.sub': 'شوف كيفاش كيمشي المتجر ديالك',
  'dashboard.revenue': 'إجمالي الربح', 'dashboard.orders': 'الكوماندات',
  'dashboard.customers': 'الزبناء', 'dashboard.products': 'البضايع',
  'dashboard.today': 'اليوم', 'dashboard.week': 'هاد الأسبوع', 'dashboard.month': 'هاد الشهر',
  'dashboard.pending': 'فباش يتعالجوا', 'dashboard.goodMorning': 'صباح الخير',
  'dashboard.goodEvening': 'مساء الخير',

  'products.title': 'البضايع والخدمات', 'products.sub': 'زيد بضايعك وشاركهم مع الزبناء',
  'products.add': 'زيد بضاعة', 'products.edit': 'عدّل البضاعة', 'products.name': 'سمية البضاعة',
  'products.price': 'الثمن', 'products.oldPrice': 'الثمن الأصلي', 'products.stock': 'المخزن',
  'products.category': 'الصنف', 'products.description': 'الوصف', 'products.images': 'الصور',
  'products.saved': '✅ تسجّلت "{name}" بنجاح', 'products.updated': '✅ تحدّثت "{name}"',
  'products.deleted': '🗑️ تمسحت "{name}"', 'products.deleteConfirm': 'واش تمسح "{name}" للقايد؟',
  'products.empty': 'ماعندكش بضايع', 'products.addFirst': 'زيد أولى بضاعة دابا',
  'products.validName': 'دخل اسم البضاعة', 'products.validPrice': 'دخل ثمن صحيح',
  'products.addImage': 'زيد ولو صورة وحدة', 'products.stockAdjusted': '📦 تحدّد المخزن ديال "{name}"',
  'products.noImages': '⚠️ ماعندكش صور — البضاعة غتبان بلا صورة',

  'orders.title': 'الكوماندات', 'orders.sub': 'تابع وسيّر كامل الكوماندات',
  'orders.new': 'كوماندا جديدة', 'orders.approve': 'قبل', 'orders.reject': 'ارفض',
  'orders.ship': 'شحن', 'orders.deliver': 'وصّل',
  'orders.approved': '✅ تقبّلات الكوماندا #{id}', 'orders.rejected': '❌ ترفضات الكوماندا #{id}',
  'orders.shipped': '🚚 تشحّنات الكوماندا #{id}', 'orders.delivered': '✅ توصّلات الكوماندا #{id}',
  'orders.customer': 'الزبون', 'orders.empty': 'ماكاينش كوماندات',

  'customers.title': 'الزبناء', 'customers.sub': 'قاعدة بيانات الزبناء ديالك',
  'customers.add': 'زيد زبون', 'customers.name': 'الاسم الكامل', 'customers.phone': 'التيليفون',
  'customers.saved': '✅ تسجّلات بيانات {name}', 'customers.deleted': '🗑️ تمسح {name}',
  'customers.madeVip': '⭐ {name} صاب VIP', 'customers.empty': 'ماعندكش زبناء',
  'customers.dupPhone': '⚠️ التيليفون هاد مسجّل ل {name}',

  'messages.title': 'الرسايل', 'messages.sub': 'هضر مع الزبناء مباشرة',
  'messages.placeholder': 'كتب رسالتك...', 'messages.deleted': '🗑️ تمسحات المحادثة',
  'messages.pinned': '📌 تثبّتات المحادثة', 'messages.empty': 'ماكاينش محادثات',
  'messages.noConv': 'اختار محادثة تبدأ',

  'connections.title': 'ربط الخدمات', 'connections.sub': 'ربط الحسابات ديالك مرة واحدة',
  'connections.fillAll': 'عمّر كامل الخانات', 'connections.connected': '✅ {name} متوصّل! {info}',
  'connections.disconnected': '🔌 قطعت الاتصال مع {name}', 'connections.failed': '❌ {name}: {error}',

  'delivery.title': 'شركات التوصيل', 'delivery.sub': 'هيّئ شركات التوصيل باش تشحن بشكل أوتوماتيكي',
  'delivery.add': 'زيد شركة', 'delivery.saved': '✅ تزادت {name}',
  'delivery.deleted': '🗑️ تمسحات شركة التوصيل',
  'delivery.empty': 'ماعندكش شركات توصيل', 'delivery.unsaved': 'عندك بيانات مكتوبة. واش تخرج؟',

  'settings.title': 'الپاراميترات', 'settings.sub': 'الإعدادات ديال المتجر والأپليكاسيون',
  'settings.brand': 'العلامة التجارية', 'settings.storeName': 'اسم المتجر',
  'settings.language': 'اللغة', 'settings.saved': '✅ تسجّلات الإعدادات',

  'analytics.title': 'الإحصائيات', 'analytics.sub': 'شوف بالتفصيل كيفاش كيمشي المتجر',

  'notif.title': 'الإشعارات', 'notif.empty': 'ماكاينش إشعارات',
  'notif.session': '🔒 سالات المدة — دخل من جديد',

  'auth.login': 'دخول', 'auth.loginSub': 'أهلاً بيك — سيّر المتجر ديالك',
  'auth.register': 'أنشئ حساب جديد', 'auth.registerSub': 'بدأ المتجر ديالك بالمجان',
  'auth.email': 'الإيميل', 'auth.password': 'كلمة السر', 'auth.storeName': 'اسم المتجر (اختياري)',
  'auth.demo': 'جرّب بلا تسجيل', 'auth.loginSuccess': '✅ أهلاً بيك!',
  'auth.registerSuccess': '🎉 مرحباً بيك فـ SAHAR shop!',
  'auth.logoutConfirm': 'واش تخرج؟', 'auth.loginBtn': 'دخول', 'auth.registerBtn': 'أنشئ حساب',

  'landing.hero.title1': 'نظام التجارة الذكي',
  'landing.hero.title2': 'للتاجر المغربي',
  'landing.how.step1': 'زيد بضايعك وخدماتك',
  'landing.how.step2': 'سيّر الكوماندات بالذكاء الاصطناعي',
  'landing.how.step3': 'وصّل وجمع الربح ديالك',
  'onboarding.type.product': 'بضايع', 'onboarding.type.service': 'خدمات', 'onboarding.type.both': 'بضايع وخدمات', 'onboarding.skip': 'تخطّ',
  'landing.tagline': 'منصة التجارة الذكية', 'landing.subtitle': 'بدأ المتجر ديالك وبيع أكثر بالذكاء الاصطناعي',
  'landing.customer.title': 'أنا زبون', 'landing.customer.desc': 'قلّب على البضايع واطلب مع توصيل سريع',
  'landing.customer.cta': 'تسوّق دابا', 'landing.customer.f1': 'بضايع متنوعة',
  'landing.customer.f2': 'توصيل سريع', 'landing.customer.f3': 'أثمنة مزيانة',
  'landing.customer.noLink': 'طلب من التاجر رابط متجره',
  'landing.merchant.title': 'أنا تاجر', 'landing.merchant.desc': 'زيد بضايعك وسيّر الكوماندات بالذكاء الاصطناعي',
  'landing.merchant.ctaNew': 'ابدأ بالمجان', 'landing.merchant.ctaExisting': 'الداشبور',
  'landing.merchant.f1': 'ذكاء اصطناعي', 'landing.merchant.f2': 'سيّر الكوماندات', 'landing.merchant.f3': 'إحصائيات',

  'tour.skip': 'تخطّ', 'tour.next': 'التالي', 'tour.prev': 'السابق',
  'tour.finish': 'بدأ تستعمل ✨', 'tour.step': '{cur} / {total}',
  'tour.s1.title': 'الداشبور', 'tour.s1.desc': 'شوف كيفاش كيمشي المتجر ديالك — الربح والكوماندات والزبناء.',
  'tour.s2.title': 'البضايع', 'tour.s2.desc': 'زيد بضايعك بالصور والوصف والثمن. الذكاء الاصطناعي يقدر يكتب الوصف عليك.',
  'tour.s3.title': 'الكوماندات', 'tour.s3.desc': 'تابع كل كوماندا من الاستلام حتى التوصيل. قبل أو ارفض أو شحن بكليك واحد.',
  'tour.s4.title': 'الرسايل', 'tour.s4.desc': 'هضر مع الزبناء مباشرة. الذكاء الاصطناعي يقدر يرد عليهم بالدارجة.',
  'tour.s5.title': 'الزبناء', 'tour.s5.desc': 'قاعدة بيانات كاملة للزبناء ديالك مع تاريخ الكوماندات والنقاط.',
  'tour.s6.title': 'التوصيل', 'tour.s6.desc': 'زيد شركات التوصيل — النظام يعمّر بيانات الطلب أوتوماتيكياً.',
  'tour.s7.title': 'الربط', 'tour.s7.desc': 'ربط المتجر ديالك مع واتساب وOpenAI وInstagram.',
  'tour.s8.title': 'الپاراميترات', 'tour.s8.desc': 'خصّص اسم المتجر والعملة والألوان والذكاء الاصطناعي.',
  'tour.s9.title': 'المتجر ديالك', 'tour.s9.desc': 'المتجر ديالك جاهز! شارك الرابط مع الزبناء باش يطلبوا منك.',
};

// ── French (Français professionnel) ──────────────────────────────────────────
const fr: T = {
  'lang.ar': 'العربية', 'lang.darija': 'الدارجة', 'lang.fr': 'Français', 'lang.en': 'English',

  'nav.dashboard': 'Tableau de bord', 'nav.products': 'Produits', 'nav.orders': 'Commandes',
  'nav.messages': 'Messages', 'nav.customers': 'Clients', 'nav.analytics': 'Analytiques',
  'nav.insights': 'Performance', 'nav.connections': 'Connexions', 'nav.delivery': 'Livraison',
  'nav.notifications': 'Notifications', 'nav.settings': 'Paramètres', 'nav.myStore': 'Ma boutique',
  'nav.studio': 'Studio', 'nav.coupons': 'Coupons',

  'save': 'Enregistrer', 'cancel': 'Annuler', 'delete': 'Supprimer', 'edit': 'Modifier',
  'add': 'Ajouter', 'search': 'Rechercher...', 'filter': 'Filtrer', 'export': 'Exporter',
  'import': 'Importer', 'close': 'Fermer', 'back': 'Retour', 'next': 'Suivant',
  'previous': 'Précédent', 'confirm': 'Confirmer', 'reject': 'Refuser', 'approve': 'Accepter',
  'connect': 'Connecter et vérifier', 'disconnect': 'Déconnecter', 'test': 'Tester',
  'refresh': 'Actualiser', 'view': 'Voir', 'copy': 'Copier', 'share': 'Partager',
  'print': 'Imprimer', 'loading': 'Chargement...', 'saving': 'Enregistrement...',
  'sending': 'Envoi en cours...', 'testing': 'Test en cours...', 'yes': 'Oui', 'no': 'Non',
  'all': 'Tout', 'total': 'Total', 'date': 'Date', 'name': 'Nom',
  'price': 'Prix', 'phone': 'Téléphone', 'city': 'Ville', 'address': 'Adresse',
  'notes': 'Notes', 'status': 'Statut', 'actions': 'Actions', 'details': 'Détails',
  'enable': 'Activer', 'disable': 'Désactiver', 'enabled': 'Activé', 'disabled': 'Désactivé',
  'required': 'Requis', 'optional': 'Optionnel', 'new': 'Nouveau', 'send': 'Envoyer',

  'status.active': 'Actif', 'status.inactive': 'Inactif', 'status.pending': 'En attente',
  'status.approved': 'Acceptée', 'status.rejected': 'Refusée', 'status.processing': 'En cours',
  'status.shipped': 'Expédiée', 'status.delivered': 'Livrée', 'status.cancelled': 'Annulée',

  'dashboard.title': 'Tableau de bord', 'dashboard.sub': 'Vue d\'ensemble de votre boutique',
  'dashboard.revenue': 'Chiffre d\'affaires', 'dashboard.orders': 'Commandes',
  'dashboard.customers': 'Clients', 'dashboard.products': 'Produits',
  'dashboard.today': 'Aujourd\'hui', 'dashboard.week': 'Cette semaine', 'dashboard.month': 'Ce mois',
  'dashboard.pending': 'En attente', 'dashboard.goodMorning': 'Bonjour',
  'dashboard.goodEvening': 'Bonsoir',

  'products.title': 'Produits et services', 'products.sub': 'Gérez votre catalogue produits',
  'products.add': 'Ajouter un produit', 'products.edit': 'Modifier le produit',
  'products.name': 'Nom du produit', 'products.price': 'Prix', 'products.oldPrice': 'Prix barré',
  'products.stock': 'Stock', 'products.category': 'Catégorie', 'products.description': 'Description',
  'products.images': 'Images', 'products.saved': '✅ "{name}" enregistré avec succès',
  'products.updated': '✅ "{name}" mis à jour', 'products.deleted': '🗑️ "{name}" supprimé',
  'products.deleteConfirm': 'Supprimer définitivement "{name}" ?',
  'products.empty': 'Aucun produit ajouté', 'products.addFirst': 'Ajoutez votre premier produit',
  'products.validName': 'Veuillez saisir le nom du produit',
  'products.validPrice': 'Veuillez saisir un prix valide', 'products.addImage': 'Ajoutez au moins une image',
  'products.stockAdjusted': '📦 Stock de "{name}" mis à jour',
  'products.noImages': '⚠️ Aucune image — le produit s\'affichera sans image',

  'orders.title': 'Commandes', 'orders.sub': 'Gérez toutes vos commandes',
  'orders.new': 'Nouvelle commande', 'orders.approve': 'Accepter', 'orders.reject': 'Refuser',
  'orders.ship': 'Expédier', 'orders.deliver': 'Livrer',
  'orders.approved': '✅ Commande #{id} acceptée', 'orders.rejected': '❌ Commande #{id} refusée',
  'orders.shipped': '🚚 Commande #{id} expédiée', 'orders.delivered': '✅ Commande #{id} livrée',
  'orders.customer': 'Client', 'orders.tracking': 'N° de suivi', 'orders.empty': 'Aucune commande',

  'customers.title': 'Clients', 'customers.sub': 'Base de données clients complète',
  'customers.add': 'Ajouter un client', 'customers.name': 'Nom complet', 'customers.phone': 'Téléphone',
  'customers.saved': '✅ {name} enregistré', 'customers.deleted': '🗑️ {name} supprimé',
  'customers.madeVip': '⭐ {name} est maintenant VIP', 'customers.empty': 'Aucun client',
  'customers.dupPhone': '⚠️ Ce numéro est déjà enregistré pour {name}',

  'messages.title': 'Messages', 'messages.sub': 'Communiquez avec vos clients',
  'messages.placeholder': 'Écrivez votre message...', 'messages.deleted': '🗑️ Conversation supprimée',
  'messages.pinned': '📌 Conversation épinglée', 'messages.empty': 'Aucun message',
  'messages.noConv': 'Sélectionnez une conversation',

  'connections.title': 'Connexions', 'connections.sub': 'Connectez vos comptes une seule fois',
  'connections.fillAll': 'Veuillez remplir tous les champs',
  'connections.connected': '✅ {name} connecté ! {info}', 'connections.disconnected': '🔌 {name} déconnecté',
  'connections.failed': '❌ {name} : {error}',

  'delivery.title': 'Livraison', 'delivery.sub': 'Configurez vos transporteurs',
  'delivery.add': 'Ajouter', 'delivery.saved': '✅ {name} ajouté', 'delivery.deleted': '🗑️ Transporteur supprimé',
  'delivery.empty': 'Aucun transporteur configuré', 'delivery.unsaved': 'Données non enregistrées. Quitter ?',

  'settings.title': 'Paramètres', 'settings.sub': 'Configurez votre boutique et l\'application',
  'settings.brand': 'Marque', 'settings.storeName': 'Nom de la boutique',
  'settings.language': 'Langue', 'settings.saved': '✅ Paramètres enregistrés',

  'analytics.title': 'Analytiques', 'analytics.sub': 'Suivez la performance de votre boutique',

  'notif.title': 'Notifications', 'notif.empty': 'Aucune notification',
  'notif.session': '🔒 Session expirée — veuillez vous reconnecter',

  'auth.login': 'Connexion', 'auth.loginSub': 'Bienvenue — gérez votre boutique intelligente',
  'auth.register': 'Créer un compte', 'auth.registerSub': 'Lancez votre boutique gratuitement',
  'auth.email': 'E-mail', 'auth.password': 'Mot de passe', 'auth.storeName': 'Nom de la boutique (optionnel)',
  'auth.demo': 'Essai gratuit sans inscription', 'auth.loginSuccess': '✅ Bienvenue !',
  'auth.registerSuccess': '🎉 Bienvenue sur SAHAR shop !',
  'auth.logoutConfirm': 'Voulez-vous vous déconnecter ?', 'auth.loginBtn': 'Connexion', 'auth.registerBtn': 'Créer',

  'landing.hero.title1': 'Le système de commerce intelligent',
  'landing.hero.title2': 'pour le commerçant marocain',
  'landing.how.step1': 'Ajoutez vos produits et services',
  'landing.how.step2': 'Gérez vos commandes avec l\'IA',
  'landing.how.step3': 'Livrez et encaissez vos bénéfices',
  'onboarding.type.product': 'Produits', 'onboarding.type.service': 'Services', 'onboarding.type.both': 'Produits et services', 'onboarding.skip': 'Ignorer',
  'landing.tagline': 'La plateforme de commerce intelligent',
  'landing.subtitle': 'Lancez votre boutique et vendez plus grâce à l\'IA',
  'landing.customer.title': 'Je suis client', 'landing.customer.desc': 'Parcourez les produits et commandez avec livraison rapide',
  'landing.customer.cta': 'Acheter maintenant', 'landing.customer.f1': 'Produits variés',
  'landing.customer.f2': 'Livraison rapide', 'landing.customer.f3': 'Prix compétitifs',
  'landing.customer.noLink': 'Demandez le lien de la boutique au vendeur',
  'landing.merchant.title': 'Je suis vendeur', 'landing.merchant.desc': 'Ajoutez vos produits et gérez vos commandes avec l\'IA',
  'landing.merchant.ctaNew': 'Commencer gratuitement', 'landing.merchant.ctaExisting': 'Tableau de bord',
  'landing.merchant.f1': 'Intelligence artificielle', 'landing.merchant.f2': 'Gestion commandes', 'landing.merchant.f3': 'Analytiques',

  'tour.skip': 'Ignorer', 'tour.next': 'Suivant', 'tour.prev': 'Précédent',
  'tour.finish': 'Commencer ✨', 'tour.step': '{cur} / {total}',
  'tour.s1.title': 'Tableau de bord', 'tour.s1.desc': 'Vue complète de votre boutique — revenus, commandes, clients en un coup d\'œil.',
  'tour.s2.title': 'Produits', 'tour.s2.desc': 'Ajoutez vos produits avec photos, descriptions et prix. L\'IA génère les descriptions automatiquement.',
  'tour.s3.title': 'Commandes', 'tour.s3.desc': 'Suivez chaque commande de la réception à la livraison. Acceptez, refusez ou expédiez en un clic.',
  'tour.s4.title': 'Messages', 'tour.s4.desc': 'Communiquez avec vos clients. L\'IA peut répondre en arabe, darija ou français.',
  'tour.s5.title': 'Clients', 'tour.s5.desc': 'Base de données complète avec historique des commandes et points de fidélité.',
  'tour.s6.title': 'Livraison', 'tour.s6.desc': 'Ajoutez vos transporteurs — le système remplit automatiquement les données.',
  'tour.s7.title': 'Connexions', 'tour.s7.desc': 'Connectez WhatsApp, OpenAI, Instagram et Cloudinary.',
  'tour.s8.title': 'Paramètres', 'tour.s8.desc': 'Personnalisez votre boutique, devise, thème et IA.',
  'tour.s9.title': 'Votre boutique', 'tour.s9.desc': 'Votre boutique est prête ! Partagez le lien avec vos clients.',
};

// ── English ───────────────────────────────────────────────────────────────────
const en: T = {
  'lang.ar': 'العربية', 'lang.darija': 'الدارجة', 'lang.fr': 'Français', 'lang.en': 'English',

  'nav.dashboard': 'Dashboard', 'nav.products': 'Products', 'nav.orders': 'Orders',
  'nav.messages': 'Messages', 'nav.customers': 'Customers', 'nav.analytics': 'Analytics',
  'nav.insights': 'Performance', 'nav.connections': 'Connections', 'nav.delivery': 'Delivery',
  'nav.notifications': 'Notifications', 'nav.settings': 'Settings', 'nav.myStore': 'My Store',
  'nav.studio': 'Studio', 'nav.coupons': 'Coupons',

  'save': 'Save', 'cancel': 'Cancel', 'delete': 'Delete', 'edit': 'Edit',
  'add': 'Add', 'search': 'Search...', 'filter': 'Filter', 'export': 'Export',
  'import': 'Import', 'close': 'Close', 'back': 'Back', 'next': 'Next',
  'previous': 'Previous', 'confirm': 'Confirm', 'reject': 'Reject', 'approve': 'Approve',
  'connect': 'Connect & verify', 'disconnect': 'Disconnect', 'test': 'Test',
  'refresh': 'Refresh', 'view': 'View', 'copy': 'Copy', 'share': 'Share',
  'print': 'Print', 'loading': 'Loading...', 'saving': 'Saving...', 'sending': 'Sending...',
  'testing': 'Testing...', 'yes': 'Yes', 'no': 'No', 'all': 'All', 'total': 'Total',
  'date': 'Date', 'name': 'Name', 'price': 'Price', 'phone': 'Phone', 'city': 'City',
  'address': 'Address', 'notes': 'Notes', 'status': 'Status', 'actions': 'Actions',
  'details': 'Details', 'enable': 'Enable', 'disable': 'Disable', 'enabled': 'Enabled',
  'disabled': 'Disabled', 'required': 'Required', 'optional': 'Optional', 'new': 'New', 'send': 'Send',

  'status.active': 'Active', 'status.inactive': 'Inactive', 'status.pending': 'Pending',
  'status.approved': 'Approved', 'status.rejected': 'Rejected', 'status.processing': 'Processing',
  'status.shipped': 'Shipped', 'status.delivered': 'Delivered', 'status.cancelled': 'Cancelled',

  'dashboard.title': 'Dashboard', 'dashboard.sub': 'Your store performance at a glance',
  'dashboard.revenue': 'Total Revenue', 'dashboard.orders': 'Orders',
  'dashboard.customers': 'Customers', 'dashboard.products': 'Products',
  'dashboard.today': 'Today', 'dashboard.week': 'This week', 'dashboard.month': 'This month',
  'dashboard.pending': 'Awaiting action', 'dashboard.goodMorning': 'Good morning',
  'dashboard.goodEvening': 'Good evening',

  'products.title': 'Products & Services', 'products.sub': 'Manage your product catalog',
  'products.add': 'Add product', 'products.edit': 'Edit product', 'products.name': 'Product name',
  'products.price': 'Price', 'products.oldPrice': 'Original price', 'products.stock': 'Stock',
  'products.category': 'Category', 'products.description': 'Description', 'products.images': 'Images',
  'products.saved': '✅ "{name}" saved successfully', 'products.updated': '✅ "{name}" updated',
  'products.deleted': '🗑️ "{name}" deleted', 'products.deleteConfirm': 'Permanently delete "{name}"?',
  'products.empty': 'No products added yet', 'products.addFirst': 'Add your first product now',
  'products.validName': 'Please enter a product name', 'products.validPrice': 'Please enter a valid price',
  'products.addImage': 'Add at least one image', 'products.stockAdjusted': '📦 Stock updated for "{name}"',
  'products.noImages': '⚠️ No image — product will appear without an image',

  'orders.title': 'Orders', 'orders.sub': 'Track and manage all incoming orders',
  'orders.new': 'New order', 'orders.approve': 'Approve', 'orders.reject': 'Reject',
  'orders.ship': 'Ship', 'orders.deliver': 'Deliver',
  'orders.approved': '✅ Order #{id} approved', 'orders.rejected': '❌ Order #{id} rejected',
  'orders.shipped': '🚚 Order #{id} shipped', 'orders.delivered': '✅ Order #{id} delivered',
  'orders.customer': 'Customer', 'orders.tracking': 'Tracking number', 'orders.empty': 'No orders yet',

  'customers.title': 'Customers', 'customers.sub': 'Your complete customer database',
  'customers.add': 'Add customer', 'customers.name': 'Full name', 'customers.phone': 'Phone number',
  'customers.saved': '✅ {name} saved', 'customers.deleted': '🗑️ {name} deleted',
  'customers.madeVip': '⭐ {name} is now VIP', 'customers.empty': 'No customers yet',
  'customers.dupPhone': '⚠️ This phone number is already registered for {name}',

  'messages.title': 'Messages', 'messages.sub': 'Communicate directly with your customers',
  'messages.placeholder': 'Write your message...', 'messages.deleted': '🗑️ Conversation deleted',
  'messages.pinned': '📌 Conversation pinned', 'messages.empty': 'No messages yet',
  'messages.noConv': 'Select a conversation to start',

  'connections.title': 'Service Connections', 'connections.sub': 'Connect your accounts once — the system handles the rest',
  'connections.fillAll': 'Please fill in all fields', 'connections.connected': '✅ {name} connected! {info}',
  'connections.disconnected': '🔌 {name} disconnected', 'connections.failed': '❌ {name}: {error}',

  'delivery.title': 'Delivery Companies', 'delivery.sub': 'Set up delivery providers for automated shipping',
  'delivery.add': 'Add company', 'delivery.saved': '✅ {name} added', 'delivery.deleted': '🗑️ Delivery company removed',
  'delivery.empty': 'No delivery companies added yet', 'delivery.unsaved': 'You have unsaved data. Exit?',

  'settings.title': 'Settings', 'settings.sub': 'Configure your store and app settings',
  'settings.brand': 'Brand', 'settings.storeName': 'Store name',
  'settings.language': 'Language', 'settings.saved': '✅ Settings saved',

  'analytics.title': 'Analytics', 'analytics.sub': 'Track your store performance in detail',

  'notif.title': 'Notifications', 'notif.empty': 'No notifications',
  'notif.session': '🔒 Session expired — please sign in again',

  'auth.login': 'Sign In', 'auth.loginSub': 'Welcome back — manage your smart store',
  'auth.register': 'Create Account', 'auth.registerSub': 'Launch your store for free today',
  'auth.email': 'Email address', 'auth.password': 'Password',
  'auth.storeName': 'Store name (optional)', 'auth.demo': 'Free trial without registration',
  'auth.loginSuccess': '✅ Welcome back!', 'auth.registerSuccess': '🎉 Welcome to SAHAR shop!',
  'auth.logoutConfirm': 'Sign out?', 'auth.loginBtn': 'Sign In', 'auth.registerBtn': 'Create Account',

  'landing.hero.title1': 'The Intelligent Commerce System',
  'landing.hero.title2': 'for the Moroccan Merchant',
  'landing.how.step1': 'Add your products and services',
  'landing.how.step2': 'Manage orders with AI',
  'landing.how.step3': 'Deliver and collect your profits',
  'onboarding.type.product': 'Products', 'onboarding.type.service': 'Services', 'onboarding.type.both': 'Products & Services', 'onboarding.skip': 'Skip',
  'landing.tagline': 'The Smart Commerce Platform',
  'landing.subtitle': 'Launch your digital store and sell more with AI',
  'landing.customer.title': 'I\'m a Customer', 'landing.customer.desc': 'Browse products and order with fast delivery',
  'landing.customer.cta': 'Shop Now', 'landing.customer.f1': 'Diverse products',
  'landing.customer.f2': 'Fast delivery', 'landing.customer.f3': 'Competitive prices',
  'landing.customer.noLink': 'Ask the merchant to share their store link',
  'landing.merchant.title': 'I\'m a Merchant', 'landing.merchant.desc': 'Add products and manage orders with AI',
  'landing.merchant.ctaNew': 'Start Free', 'landing.merchant.ctaExisting': 'Dashboard',
  'landing.merchant.f1': 'AI-powered', 'landing.merchant.f2': 'Order management', 'landing.merchant.f3': 'Analytics',

  'tour.skip': 'Skip tour', 'tour.next': 'Next', 'tour.prev': 'Previous',
  'tour.finish': 'Get started ✨', 'tour.step': '{cur} / {total}',
  'tour.s1.title': 'Dashboard', 'tour.s1.desc': 'Complete overview of your store — revenue, orders, and customers at a glance.',
  'tour.s2.title': 'Products', 'tour.s2.desc': 'Add products with photos, descriptions, and prices. AI generates descriptions automatically.',
  'tour.s3.title': 'Orders', 'tour.s3.desc': 'Track every order from receipt to delivery. Approve, reject, or ship with one click.',
  'tour.s4.title': 'Messages', 'tour.s4.desc': 'Chat with customers directly. AI can respond in Arabic, Darija, or French.',
  'tour.s5.title': 'Customers', 'tour.s5.desc': 'Full database with order history, loyalty points, and VIP classification.',
  'tour.s6.title': 'Delivery', 'tour.s6.desc': 'Add delivery companies — the system fills order data automatically.',
  'tour.s7.title': 'Connections', 'tour.s7.desc': 'Connect WhatsApp, OpenAI, Instagram and Cloudinary.',
  'tour.s8.title': 'Settings', 'tour.s8.desc': 'Customize your store name, currency, theme, and AI settings.',
  'tour.s9.title': 'Your Store', 'tour.s9.desc': 'Your digital store is ready! Share the link and start receiving orders.',
};

export const translations: Record<Lang, T> = { ar, darija, fr, en };

export function t(lang: Lang, key: string, vars?: Record<string, string>): string {
  const map = translations[lang] || translations['ar'];
  let str = map[key] ?? translations['ar'][key] ?? key;
  if (vars) str = Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  return str;
}
