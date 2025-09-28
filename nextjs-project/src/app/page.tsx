import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/vi'); // Hoặc '/en' nếu bạn muốn mặc định là tiếng Anh
}
