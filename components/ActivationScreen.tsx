
import React, { useState } from 'react';
import { Lock, ShieldCheck, ShoppingBag, ExternalLink, Smartphone } from 'lucide-react';
import { getDeviceId, verifyLicense } from '../services/authService';

interface ActivationScreenProps {
  onActivated: () => void;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const deviceId = getDeviceId();

  const handleActivate = async () => {
    if (!key) return;
    setLoading(true);
    setError('');

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = await verifyLicense(key.trim().toUpperCase());
    if (success) {
      onActivated();
    } else {
      setError('激活码无效或与设备不匹配 (Invalid Key)');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-white font-sans">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
        
        {/* Logo & Title */}
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none mb-6">
            <Lock className="text-white" size={40} />
          </div>
          <h1 className="text-2xl font-extrabold">人情账本 Pro</h1>
          <p className="text-slate-500 text-sm mt-2">尊享离线存储与专业数据分析</p>
        </div>

        {/* Device Info */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center text-xs text-slate-400 mb-2">
            <Smartphone size={14} className="mr-1" />
            <span>当前设备标识 (Device ID):</span>
          </div>
          <code className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 block tracking-widest text-center select-all">
            {deviceId}
          </code>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">输入激活码 (Activation Key)</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="RL-XXXX-XXXX"
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-transparent text-center font-mono text-xl focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

          <button
            onClick={handleActivate}
            disabled={loading || !key}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
              loading || !key ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 active:scale-95 shadow-blue-200'
            }`}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ShieldCheck size={20} />}
            <span>{loading ? '验证中...' : '立即激活软件'}</span>
          </button>
        </div>

        {/* Sales Link */}
        <div className="pt-4 border-t dark:border-slate-700">
          <a 
            href="https://www.xiaohongshu.com/goods-detail/698811a0265eb90001edbc59?t=1770525213664&xsec_token=ABaMCLbvVdf-wDxINkwyurfp4pOZgfIAbZrHgnHkUG0dU%3D&xsec_source=app_arkselfshare"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-blue-500 font-medium hover:underline"
          >
            <ShoppingBag size={18} />
            <span>获取授权激活码</span>
            <ExternalLink size={14} />
          </a>
          <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed">
            一个激活码仅限绑定一台设备使用。<br/>
            购买后请向卖家提供您的 Device ID 以换取激活码。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivationScreen;
