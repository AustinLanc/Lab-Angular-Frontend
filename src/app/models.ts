export interface ProductName {
  code: number;
  name: string;
}

export interface MonthlyBatch {
  batch: string;
  code: number;
  dateStart: string;
  dateEnd: string;
  lbs: number;
  released: string;
  type: string;
}

export interface TestingData {
  batch: string;
  code: string;
  date: string;
  pen0x: string;
  pen60x: string;
  pen10k: string;
  pen100k: string;
  dropPoint: string;
  weld: string;
  timken: string;
  rust: string;
  copperCorrosion: string;
  oxidation: string;
  oilBleed: string;
  sprayOff: string;
  washout: string;
  pressureBleed: string;
  rollStabilityDry: string;
  rollStabilityWet: string;
  wear: string;
  ftIr: string;
  minitestMinus40: string;
  minitestMinus30: string;
  minitestMinus20: string;
  minitest0: string;
  minitest20: string;
  rheometer: string;
  rheometerTemp: string;
}

export interface QcLog {
  batch: string;
  code: string;
  suffix: string;
  pen60x: string;
  dropPoint: string;
  date: string;
  releasedBy: string;
}

export interface Retain {
  id: number;
  batch: string;
  code: number;
  date: string;
  box: number;
}

export interface Reminder {
  id: number;
  reminderId: string;
  batch: string;
  intervalType: string;
  due: string;
  notified: boolean;
  createdAt: string;
}
