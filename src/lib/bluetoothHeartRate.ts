import { useSyncExternalStore } from 'react';

export type HeartRateZone = 'warmup' | 'fatburn' | 'cardio' | 'peak';

export interface HeartRateState {
  bpm: number | null;
  zone: HeartRateZone | null;
  percentMax: number | null;
  deviceName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isSupported: boolean;
  error: string | null;
}

const DEFAULT_MAX_HR = 190;

export function getHRZone(bpm: number, maxHr: number = DEFAULT_MAX_HR): { zone: HeartRateZone; percentMax: number } {
  const percentMax = Math.round((bpm / maxHr) * 100);
  if (percentMax < 60) return { zone: 'warmup', percentMax };
  if (percentMax < 70) return { zone: 'fatburn', percentMax };
  if (percentMax < 85) return { zone: 'cardio', percentMax };
  return { zone: 'peak', percentMax };
}

export const ZONE_CONFIG: Record<HeartRateZone, { labelEn: string; labelAr: string; color: string; bg: string; border: string }> = {
  warmup: {
    labelEn: 'Warmup / Recovery',
    labelAr: 'إحماء واستشفاء',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)'
  },
  fatburn: {
    labelEn: 'Fat Burn',
    labelAr: 'حرق دهون',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)'
  },
  cardio: {
    labelEn: 'Cardio / Aerobic',
    labelAr: 'هوائي / لياقة',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)'
  },
  peak: {
    labelEn: 'Peak / Anaerobic',
    labelAr: 'الذروة والشدة القصوى',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.35)'
  }
};

class BluetoothHeartRateManager {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private maxHr: number = DEFAULT_MAX_HR;

  private state: HeartRateState = {
    bpm: null,
    zone: null,
    percentMax: null,
    deviceName: null,
    isConnected: false,
    isConnecting: false,
    isSupported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    error: null
  };

  private listeners = new Set<() => void>();

  public getState = (): HeartRateState => {
    return this.state;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  public setMaxHr(maxHr: number) {
    this.maxHr = Math.max(120, Math.min(220, maxHr));
    if (this.state.bpm) {
      const { zone, percentMax } = getHRZone(this.state.bpm, this.maxHr);
      this.state = { ...this.state, zone, percentMax };
      this.notify();
    }
  }

  public async connect(): Promise<boolean> {
    if (!this.state.isSupported) {
      this.state = { ...this.state, error: 'Web Bluetooth is not supported on this browser or platform.' };
      this.notify();
      return false;
    }

    try {
      this.state = { ...this.state, isConnecting: true, error: null };
      this.notify();

      const bluetooth = (navigator as any).bluetooth;
      this.device = await bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      if (!this.device) {
        this.state = { ...this.state, isConnecting: false };
        this.notify();
        return false;
      }

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService('heart_rate');
      this.characteristic = await service.getCharacteristic('heart_rate_measurement');

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateMeasurement);

      this.state = {
        ...this.state,
        deviceName: this.device.name || 'Bluetooth Heart Rate Monitor',
        isConnected: true,
        isConnecting: false,
        error: null
      };
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      const isUserCancel = err?.name === 'NotFoundError' || err?.message?.includes('cancelled');
      this.state = {
        ...this.state,
        isConnecting: false,
        isConnected: false,
        error: isUserCancel ? null : (err?.message || 'Could not connect to heart rate device.')
      };
      this.notify();
      return false;
    }
  }

  private handleHeartRateMeasurement = (event: any) => {
    const dataView = event.target.value as DataView;
    if (!dataView || dataView.byteLength < 2) return;

    const flags = dataView.getUint8(0);
    // Bit 0: 0 = 8-bit Heart Rate value, 1 = 16-bit Heart Rate value
    const is16Bit = (flags & 0x01) !== 0;
    const bpm = is16Bit ? dataView.getUint16(1, /* littleEndian */ true) : dataView.getUint8(1);

    if (bpm > 0) {
      const { zone, percentMax } = getHRZone(bpm, this.maxHr);
      this.state = {
        ...this.state,
        bpm,
        zone,
        percentMax,
        isConnected: true
      };
      this.notify();
    }
  };

  private onDisconnected = () => {
    this.state = {
      ...this.state,
      bpm: null,
      zone: null,
      percentMax: null,
      isConnected: false,
      isConnecting: false
    };
    this.notify();
  };

  public disconnect() {
    try {
      if (this.characteristic) {
        this.characteristic.removeEventListener('characteristicvaluechanged', this.handleHeartRateMeasurement);
        this.characteristic.stopNotifications().catch(() => {});
      }
      if (this.device) {
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        if (this.device.gatt?.connected) {
          this.device.gatt.disconnect();
        }
      }
    } catch (err) {
      console.warn('Error during Bluetooth disconnection:', err);
    } finally {
      this.device = null;
      this.server = null;
      this.characteristic = null;
      this.state = {
        ...this.state,
        bpm: null,
        zone: null,
        percentMax: null,
        deviceName: null,
        isConnected: false,
        isConnecting: false,
        error: null
      };
      this.notify();
    }
  }
}

export const bluetoothHeartRate = new BluetoothHeartRateManager();

export function useBluetoothHeartRate() {
  return useSyncExternalStore(bluetoothHeartRate.subscribe, bluetoothHeartRate.getState);
}
