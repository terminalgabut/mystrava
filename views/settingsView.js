// views/settingsView.js
export default `
<div class="dashboard-wrapper animate-in" :class="{ 'is-loading': isLoading }">
    <header class="dashboard-header mb-8">
        <div>
            <h1 class="text-display">Performance Settings</h1>
            <p class="text-caption mt-1">Configure your physiological thresholds for precise analytics [cite: 35]</p>
        </div>
    </header>

    <div class="bento-grid-detailed">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bento-card p-6 shadow-premium [cite: 8]">
                <div class="card-header mb-6">
                    <span class="label-muted ">Body Composition</span>
                    <div class="icon-box"><i data-lucide="monitor-weight" class="w-4 h-4"></i></div>
                </div>
                
                <div class="form-group">
                    <label class="label-muted block mb-2" style="font-size: 8px;">Current Weight (KG)</label>
                    <div class="relative flex items-center">
                        <input type="number" v-model="profile.weight" step="0.1"
                            class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl stat-value text-lg text-slate-900 outline-none focus:border-brand-primary transition-all [cite: 26, 40]">
                        <span class="absolute right-4 text-slate-400 font-bold" style="font-size: 10px;">KG</span>
                    </div>
                </div>
            </div>

            <div class="bento-card p-6 shadow-premium">
                <div class="card-header mb-6">
                    <span class="label-muted">Cycling Power</span>
                    <div class="icon-box"><i data-lucide="zap" class="w-4 h-4 text-blue-500"></i></div>
                </div>
                
                <div class="form-group mb-4">
                    <label class="label-muted block mb-2" style="font-size: 8px;">FTP (Watts)</label>
                    <div class="relative flex items-center">
                        <input type="number" v-model="profile.ftp_watts"
                            class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl stat-value text-lg text-slate-900 outline-none focus:border-blue-500 transition-all">
                        <span class="absolute right-4 text-slate-400 font-bold" style="font-size: 10px;">W</span>
                    </div>
                </div>

                <div class="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div class="flex justify-between items-center">
                        <span class="label-muted" style="font-size: 8px;">Power-to-Weight Ratio</span>
                        <span class="stat-value text-brand-primary text-xl [cite: 1]">{{ calculatePWR }} <small class="text-[8px]">W/kg</small></span>
                    </div>
                </div>
            </div>

            <div class="bento-card p-6 shadow-premium md:col-span-2">
                <div class="card-header mb-6">
                    <span class="label-muted">Running & Heartrate</span>
                    <div class="icon-box"><i data-lucide="trending-up" class="w-4 h-4 text-green-600"></i></div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="form-group">
                        <label class="label-muted block mb-2" style="font-size: 8px;">Threshold Pace (Total Seconds/KM)</label>
                        <div class="relative flex items-center">
                            <input type="number" v-model="profile.running_threshold_pace_seconds"
                                class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl stat-value text-lg text-slate-900 outline-none focus:border-green-500 transition-all">
                            <span class="absolute right-4 text-slate-400 font-bold" style="font-size: 10px;">SEC</span>
                        </div>
                        <p class="text-slate-400 mt-2 tracking-tighter" style="font-size: 9px; font-weight: 800;">
                            Current: {{ formattedPace }} (Ex: 455 for 7:35/km)
                        </p>
                    </div>
                    
                    <div class="form-group">
                        <label class="label-muted block mb-2" style="font-size: 8px;">Max Heartrate (BPM)</label>
                        <div class="relative flex items-center">
                            <input type="number" v-model="profile.max_heartrate_setting"
                                class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl stat-value text-lg text-slate-900 outline-none focus:border-red-500 transition-all">
                            <span class="absolute right-4 text-slate-400 font-bold" style="font-size: 10px;">BPM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 flex items-center gap-6">
            <button @click="saveProfile" :disabled="isSaving"
                class="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-premium flex items-center disabled:opacity-50 [cite: 52]">
                <i v-if="!isSaving" data-lucide="save" class="w-4 h-4 mr-2"></i>
                <span class="text-sm">{{ isSaving ? 'SAVING...' : 'SAVE CHANGES' }}</span>
            </button>
            
            <p v-if="statusMsg" :class="statusClass" class="stat-value text-xs tracking-widest uppercase animate-in">
                {{ statusMsg }}
            </p>
        </div>
    </div>
</div>
`;
