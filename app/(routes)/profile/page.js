// app/profile/page.js
import Profile from './Profile'

export const metadata = {
  title: 'الملف الشخصي',
  description: 'عرض وتعديل الملف الشخصي'
}

export default function ProfilePage() {
  return <Profile />
}