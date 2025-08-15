import { db } from '../config/firebase';
import { NetWorthSnapshot } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { AssetService } from './assetService';
import { DebtService } from './debtService';

export class NetWorthService {
  private collection = db.collection('netWorthSnapshots');
  private assetService = new AssetService();
  private debtService = new DebtService();

  async getNetWorthHistory(userId: string, limit?: number): Promise<NetWorthSnapshot[]> {
    let query = this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as NetWorthSnapshot[];
  }

  async createNetWorthSnapshot(
    userId: string,
    totalAssets: number,
    totalDebts: number
  ): Promise<NetWorthSnapshot> {
    const now = Timestamp.now();
    const netWorth = totalAssets - totalDebts;

    const docData = {
      userId,
      totalAssets,
      totalDebts,
      netWorth,
      createdAt: now
    };

    const docRef = await this.collection.add(docData);

    return {
      id: docRef.id,
      ...docData,
      createdAt: now.toDate()
    } as NetWorthSnapshot;
  }

  async shouldCreateSnapshot(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('createdAt', '>=', todayTimestamp)
      .limit(1)
      .get();

    return snapshot.empty;
  }

  async createSnapshotFromCurrentData(userId: string): Promise<NetWorthSnapshot | null> {
    try {
      const totalAssets = await this.assetService.getTotalAssetsValue(userId);
      const totalDebts = await this.debtService.getTotalDebtsValue(userId);

      return await this.createNetWorthSnapshot(userId, totalAssets, totalDebts);
    } catch (error) {
      console.error('Error creating net worth snapshot:', error);
      return null;
    }
  }

  async getCurrentNetWorth(userId: string): Promise<{
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
  }> {
    const totalAssets = await this.assetService.getTotalAssetsValue(userId);
    const totalDebts = await this.debtService.getTotalDebtsValue(userId);
    const netWorth = totalAssets - totalDebts;

    return {
      totalAssets,
      totalDebts,
      netWorth
    };
  }
}
