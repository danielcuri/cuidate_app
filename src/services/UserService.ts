import { apiClient } from '../api/apiClient';
import type { Simple } from '../interfaces/general';
import type { User, UserAnswer } from '../interfaces/login';
import { localStorage, secureStorage, USER_STORAGE_KEY } from '../utils/storage';

export type LoginCredentials = {
  dni: string;
  password: string;
};

export type RecoverPayload = {
  email: string;
};

export type ChangePasswordPayload = {
  user_id: number;
  old_password: string;
  password: string;
  password_confirmation: string;
};

export class UserService {
  user: Partial<User> = {};

  async login(data: LoginCredentials): Promise<UserAnswer> {
    const res = await apiClient.post<UserAnswer>('/login', data);
    return res.data;
  }

  async recoverPassword(data: RecoverPayload): Promise<UserAnswer> {
    const res = await apiClient.post<UserAnswer>('/recoverPass', data);
    return res.data;
  }

  async profileSection(data: unknown): Promise<unknown> {
    const res = await apiClient.post('/profileSection', data);
    return res.data;
  }

  async changePassword(data: ChangePasswordPayload): Promise<Simple> {
    const res = await apiClient.post<Simple>('/changePassword', data);
    return res.data;
  }

  async logout(): Promise<Simple | void> {
    try {
      const res = await apiClient.post<Simple>('/logout', {});
      await this.clearAll();
      return res.data;
    } catch {
      await this.clearAll();
    }
  }

  async checkUser(): Promise<boolean> {
    await this.loadStorage();
    const token = await secureStorage.getToken();
    const access = (this.user as User)?.access_token;
    if (!token || !access) {
      return false;
    }
    return true;
  }

  async clearAll(): Promise<void> {
    this.user = {};
    await secureStorage.removeToken();
    await localStorage.removeItem(USER_STORAGE_KEY);
  }

  async saveData(): Promise<void> {
    const u = this.user as User;
    if (u.access_token) {
      await secureStorage.setToken(u.access_token);
    }
    await localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
  }

  async loadStorage(): Promise<void> {
    const raw = await localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      try {
        this.user = JSON.parse(raw) as Partial<User>;
      } catch {
        this.user = {};
      }
    }
  }
}

export const userService = new UserService();
