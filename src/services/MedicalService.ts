import type { GeneralAnswer } from '../interfaces/learning';
import type { MedicalAnswer, MedicalUser } from '../interfaces/medical';
import { queryService } from './QueryService';

export class MedicalService {
  data: unknown;

  async registerRestMedical(_data: unknown): Promise<GeneralAnswer> {
    return queryService.executeQueryMedical<GeneralAnswer>('post', '/saveData', _data);
  }

  async getRestMedical(_data: unknown): Promise<MedicalAnswer> {
    return queryService.executeQueryMedical<MedicalAnswer>('post', '/getRestRecords', _data);
  }

  async getInfoUser(data: { dni: string }): Promise<MedicalUser> {
    return queryService.executeQueryMedical<MedicalUser>('post', '/getUserMedical', data);
  }

  setRecords(data: unknown): void {
    this.data = data;
  }

  getRecords(): unknown {
    return this.data;
  }
}

export const medicalService = new MedicalService();
