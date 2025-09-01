import { ApiClient } from '@/lib/apiClient';
import type { ApiResponse, Notification } from '@/types';

export class NotificationsApi {
  static async getNotifications(): Promise<ApiResponse<{ notifications: Notification[] }>> {
    return await ApiClient.get<ApiResponse<{ notifications: Notification[] }>>('/notifications');
  }

  static async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    return await ApiClient.post<ApiResponse<{ message: string }>>(`/notifications/${notificationId}/read`, {});
  }
}
