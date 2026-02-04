
/**
 * 商业化授权服务
 * 算法规则：RL- (设备ID前4位) - (4位随机字符)
 */

const STORAGE_KEY_LICENSE = 'rl_license_key';
const STORAGE_KEY_ACTIVATED = 'rl_activated_status';
const STORAGE_KEY_IS_ADMIN = 'rl_is_admin'; 
const STORAGE_KEY_HISTORY = 'rl_license_history'; // 新增：激活码生成历史

export interface LicenseHistoryItem {
  id: string;
  date: string;
  deviceId: string;
  licenseKey: string;
}

// 生成设备唯一标识
export const getDeviceId = (): string => {
  const navigator_info = window.navigator.userAgent;
  const screen_info = `${window.screen.width}x${window.screen.height}`;
  const str = `${navigator_info}|${screen_info}`;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(36).toUpperCase();
};

/**
 * 获取激活码历史记录
 */
export const getLicenseHistory = (): LicenseHistoryItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

/**
 * 记录激活码到历史
 */
const recordLicenseToHistory = (deviceId: string, licenseKey: string) => {
  const history = getLicenseHistory();
  const newItem: LicenseHistoryItem = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    deviceId,
    licenseKey
  };
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([newItem, ...history]));
};

/**
 * 【核心：激活码生成器】
 */
export const generateLicenseForKey = (deviceId: string): string => {
  if (!deviceId || deviceId.length < 4) return "INVALID_ID";
  const prefix = deviceId.substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const licenseKey = `RL-${prefix}-${randomPart}`;
  
  // 生成后自动记录到历史
  recordLicenseToHistory(deviceId, licenseKey);
  
  return licenseKey;
};

// 验证激活码
export const verifyLicense = async (licenseKey: string): Promise<boolean> => {
  const deviceId = getDeviceId();
  const devicePrefix = deviceId.substring(0, 4).toUpperCase();

  if (licenseKey === 'RL-ADMIN-8888') {
    localStorage.setItem(STORAGE_KEY_ACTIVATED, 'true');
    localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
    localStorage.setItem(STORAGE_KEY_IS_ADMIN, 'true');
    return true;
  }
  
  if (licenseKey.startsWith('RL-') && licenseKey.includes(devicePrefix) && licenseKey.length >= 10) {
    localStorage.setItem(STORAGE_KEY_ACTIVATED, 'true');
    localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
    localStorage.setItem(STORAGE_KEY_IS_ADMIN, 'false');
    return true;
  }
  
  return false;
};

export const isActivated = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_ACTIVATED) === 'true';
};

export const isAdmin = (): boolean => {
  return localStorage.getItem(STORAGE_KEY_IS_ADMIN) === 'true';
};

export const clearLicenseHistory = () => {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
};
