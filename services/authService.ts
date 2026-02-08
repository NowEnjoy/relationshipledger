
/**
 * 商业化授权服务
 * 算法规则：RL- (设备ID前4位) - (4位随机字符)
 */

const STORAGE_KEY_LICENSE = 'rl_license_key';
const STORAGE_KEY_ACTIVATED = 'rl_activated_status';
const STORAGE_KEY_IS_ADMIN = 'rl_is_admin'; 
const STORAGE_KEY_HISTORY = 'rl_license_history';

export interface LicenseHistoryItem {
  id: string;
  date: string;
  deviceId: string;
  licenseKey: string;
}

/**
 * 生成设备唯一标识 (硬件级指纹)
 * 移除 UserAgent，使用更稳定的屏幕和硬件属性
 */
export const getDeviceId = (): string => {
  // 选取跨浏览器表现一致的硬件参数
  const hardwareFeatures = [
    window.screen.width,              // 屏幕物理宽度
    window.screen.height,             // 屏幕物理高度
    window.screen.colorDepth,         // 屏幕色彩深度
    window.navigator.maxTouchPoints || 0, // 硬件最大触摸点数 (手机通常为 5 或 10)
    // 某些浏览器可能屏蔽硬件并发数，赋予默认值以保证稳定性
    (window.navigator as any).hardwareConcurrency || 8 
  ].join('|');
  
  // 简单的哈希算法
  let hash = 0;
  for (let i = 0; i < hardwareFeatures.length; i++) {
    const char = hardwareFeatures.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  
  // 转为 36 进制大写字符串
  return Math.abs(hash).toString(36).toUpperCase();
};

export const getLicenseHistory = (): LicenseHistoryItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

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

export const generateLicenseForKey = (deviceId: string): string => {
  if (!deviceId || deviceId.length < 4) return "INVALID_ID";
  const prefix = deviceId.substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const licenseKey = `RL-${prefix}-${randomPart}`;
  
  recordLicenseToHistory(deviceId, licenseKey);
  return licenseKey;
};

export const verifyLicense = async (licenseKey: string): Promise<boolean> => {
  const deviceId = getDeviceId();
  const devicePrefix = deviceId.substring(0, 4).toUpperCase();

  // 管理员后门 Key
  if (licenseKey === 'RL-ADMIN-8888') {
    localStorage.setItem(STORAGE_KEY_ACTIVATED, 'true');
    localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
    localStorage.setItem(STORAGE_KEY_IS_ADMIN, 'true');
    return true;
  }
  
  // 验证激活码是否包含当前设备指纹前缀
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
