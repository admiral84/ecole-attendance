// lib/roles.js
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEACHER: 'teacher'
}

export const PRIVILEGES = {
  // Gestion des classes
  VIEW_ALL_CLASSES: 'view_all_classes',
  VIEW_OWN_CLASSES: 'view_own_classes',
  CREATE_CLASS: 'create_class',
  EDIT_CLASS: 'edit_class',
  DELETE_CLASS: 'delete_class',
  
  // Gestion des élèves
  VIEW_ALL_STUDENTS: 'view_all_students',
  VIEW_CLASS_STUDENTS: 'view_class_students',
  CREATE_STUDENT: 'create_student',
  EDIT_STUDENT: 'edit_student',
  DELETE_STUDENT: 'delete_student',
  
  // Gestion des absences
  VIEW_ALL_ABSENCES: 'view_all_absences',
  VIEW_CLASS_ABSENCES: 'view_class_absences',
  VIEW_STUDENT_ABSENCE_HISTORY: 'view_student_absence_history',
  MARK_ABSENCE: 'mark_absence',
  JUSTIFY_ABSENCE: 'justify_absence',
  EDIT_ABSENCE: 'edit_absence',
  DELETE_ABSENCE: 'delete_absence',
  
  // Gestion des sanctions
  VIEW_ALL_SANCTIONS: 'view_all_sanctions',
  VIEW_CLASS_SANCTIONS: 'view_class_sanctions',
  VIEW_STUDENT_SANCTION_HISTORY: 'view_student_sanction_history',
  CREATE_SANCTION: 'create_sanction',
  EDIT_SANCTION: 'edit_sanction',
  DELETE_SANCTION: 'delete_sanction',
  
  // Gestion des utilisateurs
  VIEW_ALL_USERS: 'view_all_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  APPROVE_USER: 'approve_user',
  CHANGE_USER_ROLE: 'change_user_role',
  
  // Gestion des demandes (join class)
  SEND_JOIN_REQUEST: 'send_join_request',
  RECEIVE_JOIN_REQUEST: 'receive_join_request',
  ACCEPT_JOIN_REQUEST: 'accept_join_request',
  REJECT_JOIN_REQUEST: 'reject_join_request',
  
  // Rapports
  VIEW_ABSENCE_REPORTS: 'view_absence_reports',
  VIEW_SANCTION_REPORTS: 'view_sanction_reports',
  VIEW_GLOBAL_STATS: 'view_global_stats',
  EXPORT_REPORTS: 'export_reports',
  
  // Autres
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  VIEW_SYSTEM_LOGS: 'view_system_logs'
}

// Définition des privilèges par rôle
export const ROLE_PRIVILEGES = {
  [ROLES.ADMIN]: [
    // Tous les privilèges
    ...Object.values(PRIVILEGES)
  ],
  
  [ROLES.MANAGER]: [
    // Gestion des classes
    PRIVILEGES.VIEW_ALL_CLASSES,
    PRIVILEGES.VIEW_OWN_CLASSES,
    PRIVILEGES.CREATE_CLASS,
    PRIVILEGES.EDIT_CLASS,
    
    // Gestion des élèves
    PRIVILEGES.VIEW_ALL_STUDENTS,
    PRIVILEGES.VIEW_CLASS_STUDENTS,
    PRIVILEGES.CREATE_STUDENT,
    PRIVILEGES.EDIT_STUDENT,
    
    // Gestion des absences
    PRIVILEGES.VIEW_ALL_ABSENCES,
    PRIVILEGES.VIEW_CLASS_ABSENCES,
    PRIVILEGES.VIEW_STUDENT_ABSENCE_HISTORY,
    PRIVILEGES.MARK_ABSENCE,
    PRIVILEGES.JUSTIFY_ABSENCE,
    PRIVILEGES.EDIT_ABSENCE,
    
    // Gestion des sanctions
    PRIVILEGES.VIEW_ALL_SANCTIONS,
    PRIVILEGES.VIEW_CLASS_SANCTIONS,
    PRIVILEGES.VIEW_STUDENT_SANCTION_HISTORY,
    PRIVILEGES.CREATE_SANCTION,
    PRIVILEGES.EDIT_SANCTION,
    
    // Gestion des utilisateurs
    PRIVILEGES.VIEW_ALL_USERS,
    PRIVILEGES.APPROVE_USER,
    
    // Gestion des demandes
    PRIVILEGES.SEND_JOIN_REQUEST,
    PRIVILEGES.RECEIVE_JOIN_REQUEST,
    PRIVILEGES.ACCEPT_JOIN_REQUEST,
    PRIVILEGES.REJECT_JOIN_REQUEST,
    
    // Rapports
    PRIVILEGES.VIEW_ABSENCE_REPORTS,
    PRIVILEGES.VIEW_SANCTION_REPORTS,
    PRIVILEGES.VIEW_GLOBAL_STATS,
    PRIVILEGES.EXPORT_REPORTS,
    
    // Autres
    PRIVILEGES.VIEW_DASHBOARD,
    PRIVILEGES.EDIT_OWN_PROFILE
  ],
  
  [ROLES.TEACHER]: [
    // Gestion des classes
    PRIVILEGES.VIEW_OWN_CLASSES,
    
    // Gestion des élèves
    PRIVILEGES.VIEW_CLASS_STUDENTS,
    
    // Gestion des absences
    PRIVILEGES.VIEW_CLASS_ABSENCES,
    PRIVILEGES.VIEW_STUDENT_ABSENCE_HISTORY,
    PRIVILEGES.MARK_ABSENCE,
    PRIVILEGES.JUSTIFY_ABSENCE,
    PRIVILEGES.EDIT_ABSENCE,
    
    // Gestion des sanctions
    PRIVILEGES.VIEW_CLASS_SANCTIONS,
    PRIVILEGES.VIEW_STUDENT_SANCTION_HISTORY,
    PRIVILEGES.CREATE_SANCTION,
    
    // Gestion des demandes
    PRIVILEGES.RECEIVE_JOIN_REQUEST,
    PRIVILEGES.ACCEPT_JOIN_REQUEST,
    PRIVILEGES.REJECT_JOIN_REQUEST,
    
    // Rapports
    PRIVILEGES.VIEW_ABSENCE_REPORTS,
    PRIVILEGES.VIEW_SANCTION_REPORTS,
    PRIVILEGES.EXPORT_REPORTS,
    
    // Autres
    PRIVILEGES.VIEW_DASHBOARD,
    PRIVILEGES.EDIT_OWN_PROFILE
  ]
}

// Labels des rôles
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'مدير',
  [ROLES.MANAGER]: 'مدير عام',
  [ROLES.TEACHER]: 'أستاذ'
}

// Labels des privilèges en arabe
export const PRIVILEGE_LABELS = {
  [PRIVILEGES.VIEW_ALL_CLASSES]: 'عرض جميع الأقسام',
  [PRIVILEGES.VIEW_OWN_CLASSES]: 'عرض أقسامي',
  [PRIVILEGES.CREATE_CLASS]: 'إضافة قسم',
  [PRIVILEGES.EDIT_CLASS]: 'تعديل قسم',
  [PRIVILEGES.DELETE_CLASS]: 'حذف قسم',
  
  [PRIVILEGES.VIEW_ALL_STUDENTS]: 'عرض جميع التلاميذ',
  [PRIVILEGES.VIEW_CLASS_STUDENTS]: 'عرض تلاميذ أقسامي',
  [PRIVILEGES.CREATE_STUDENT]: 'إضافة تلميذ',
  [PRIVILEGES.EDIT_STUDENT]: 'تعديل تلميذ',
  [PRIVILEGES.DELETE_STUDENT]: 'حذف تلميذ',
  
  [PRIVILEGES.VIEW_ALL_ABSENCES]: 'عرض جميع الغيابات',
  [PRIVILEGES.VIEW_CLASS_ABSENCES]: 'عرض غيابات أقسامي',
  [PRIVILEGES.VIEW_STUDENT_ABSENCE_HISTORY]: 'عرض سجل غيابات تلميذ',
  [PRIVILEGES.MARK_ABSENCE]: 'تسجيل غياب',
  [PRIVILEGES.JUSTIFY_ABSENCE]: 'تبرير غياب',
  [PRIVILEGES.EDIT_ABSENCE]: 'تعديل غياب',
  [PRIVILEGES.DELETE_ABSENCE]: 'حذف غياب',
  
  [PRIVILEGES.VIEW_ALL_SANCTIONS]: 'عرض جميع العقوبات',
  [PRIVILEGES.VIEW_CLASS_SANCTIONS]: 'عرض عقوبات أقسامي',
  [PRIVILEGES.VIEW_STUDENT_SANCTION_HISTORY]: 'عرض سجل عقوبات تلميذ',
  [PRIVILEGES.CREATE_SANCTION]: 'إضافة عقوبة',
  [PRIVILEGES.EDIT_SANCTION]: 'تعديل عقوبة',
  [PRIVILEGES.DELETE_SANCTION]: 'حذف عقوبة',
  
  [PRIVILEGES.VIEW_ALL_USERS]: 'عرض جميع المستخدمين',
  [PRIVILEGES.CREATE_USER]: 'إضافة مستخدم',
  [PRIVILEGES.EDIT_USER]: 'تعديل مستخدم',
  [PRIVILEGES.DELETE_USER]: 'حذف مستخدم',
  [PRIVILEGES.APPROVE_USER]: 'قبول مستخدم',
  [PRIVILEGES.CHANGE_USER_ROLE]: 'تغيير دور مستخدم',
  
  [PRIVILEGES.SEND_JOIN_REQUEST]: 'إرسال طلب انضمام',
  [PRIVILEGES.RECEIVE_JOIN_REQUEST]: 'استقبال طلب انضمام',
  [PRIVILEGES.ACCEPT_JOIN_REQUEST]: 'قبول طلب انضمام',
  [PRIVILEGES.REJECT_JOIN_REQUEST]: 'رفض طلب انضمام',
  
  [PRIVILEGES.VIEW_ABSENCE_REPORTS]: 'عرض تقارير الغياب',
  [PRIVILEGES.VIEW_SANCTION_REPORTS]: 'عرض تقارير العقوبات',
  [PRIVILEGES.VIEW_GLOBAL_STATS]: 'عرض الإحصائيات العامة',
  [PRIVILEGES.EXPORT_REPORTS]: 'تصدير التقارير',
  
  [PRIVILEGES.VIEW_DASHBOARD]: 'عرض لوحة التحكم',
  [PRIVILEGES.EDIT_OWN_PROFILE]: 'تعديل الملف الشخصي',
  [PRIVILEGES.VIEW_SYSTEM_LOGS]: 'عرض سجلات النظام'
}

// Fonctions utilitaires
export function hasPrivilege(userRole, privilege) {
  if (!userRole || !privilege) return false
  const userPrivileges = ROLE_PRIVILEGES[userRole] || []
  return userPrivileges.includes(privilege)
}

export function getPrivilegesByRole(role) {
  return ROLE_PRIVILEGES[role] || []
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'مستخدم'
}