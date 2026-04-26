const BASE_URL = 'http://localhost:5000/api';

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
  return data;
};