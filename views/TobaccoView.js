export default `
<div class="tobacco-engine-wrapper animate-in pb-12 px-4">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Tobacco <span class="text-orange-600">Engine</span></h1>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                    <i data-lucide="flame" class="w-3 h-3 text-orange-500"></i>
                    <span>{{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
                </p>
            </div>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            
            <div class="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200 shadow-inner">
                <button @click="viewMode = 'log'" 
                        :class="viewMode === 'log' ? 'bg-white shadow-md text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="pen-tool" class="w-4 h-4"></i> Quick Log
                </button>
                <button @click="viewMode = 'master'" 
                        :class="viewMode === 'master' ? 'bg-white shadow-md text-orange-600 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="database" class="w-4 h-4"></i> Master Produk
                </button>
            </div>

            <div v-if="viewMode === 'log'" class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center border bg-orange-50 border-orange-100 text-orange-600">
                            <i data-lucide="cigarette" class="w-5 h-5"></i>
                        </div>
                        <h3 class="font-black text-slate-900 uppercase tracking-tighter italic">
                            Record Intake
                        </h3>
                    </div>

                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Produk (Tersimpan)</label>
                            <select v-model="logForm.product_id" 
                                    class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-xl font-black text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all appearance-none">
                                <option v-for="item in products" :key="item.id" :value="item.id">
                                    {{ item.brand_name }} ({{ item.tar_mg }}mg Tar)
                                </option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Batang</label>
                                <div class="flex items-center bg-slate-50 border border-slate-100 rounded-3xl p-2">
                                    <button @click="logForm.sticks > 1 ? logForm.sticks-- : null" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-600 font-bold">-</button>
                                    <input type="number" v-model="logForm.sticks" class="flex-1 bg-transparent text-center text-2xl font-black text-slate-900 focus:outline-none">
                                    <button @click="logForm.sticks++" class="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm text-slate-600 font-bold">+</button>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu Log</label>
                                <input type="time" v-model="logForm.time" 
                                       class="w-full bg-slate-50 border border-slate-100 p-4 rounded-3xl text-xl font-black text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="viewMode === 'master'" class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 mb-8">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-50 border-slate-100 text-slate-600">
                        <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    </div>
                    <h3 class="font-black text-slate-900 uppercase tracking-tighter italic">Tambah Produk Baru</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <input type="text" v-model="masterForm.brand_name" placeholder="Nama Merk" class="bg-slate-50 border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <div class="grid grid-cols-2 gap-4">
                        <input type="number" step="0.01" v-model="masterForm.tar_mg" placeholder="Tar (mg)" class="bg-slate-50 border p-4 rounded-2xl focus:outline-none">
                        <input type="number" step="0.01" v-model="masterForm.nicotine_mg" placeholder="Nic (mg)" class="bg-slate-50 border p-4 rounded-2xl focus:outline-none">
                    </div>
                </div>
                <div class="flex gap-4 mb-8">
                    <button @click="masterForm.is_clove = !masterForm.is_clove" 
                            :class="masterForm.is_clove ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-slate-50 text-slate-400'"
                            class="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all">Kretek</button>
                    <button @click="masterForm.is_filter = !masterForm.is_filter"
                            :class="masterForm.is_filter ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-50 text-slate-400'"
                            class="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase border transition-all">Filter</button>
                </div>
                <button @click="saveMasterProduct" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black italic tracking-widest text-xs uppercase hover:bg-slate-800 transition-all">Simpan Katalog</button>
            </div>

            <button v-if="viewMode === 'log'" @click="saveSmokeLog" 
                    class="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-sm hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3">
                <i data-lucide="zap" class="w-5 h-5 text-yellow-300"></i>
                SYNC TOXIC LOAD DATA
            </button>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h3 class="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter">
                    <i data-lucide="skull" class="w-5 h-5 text-orange-400"></i> Toxic Exposure
                </h3>
                <div class="space-y-8">
                    <div>
                        <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Tar Today</p>
                        <p class="text-4xl font-black text-orange-400">{{ stats.todayTar || 0 }}<span class="text-lg">mg</span></p>
                        <div class="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div class="bg-orange-500 h-full transition-all" :style="{ width: (stats.todayTar / 500 * 100) + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p class="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Nicotine Intake</p>
                            <p class="text-xl font-black text-white">{{ stats.todayNicotine || 0 }}<span class="text-[10px] ml-1">MG</span></p>
                        </div>
                        <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p class="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Sticks Count</p>
                            <p class="text-xl font-black text-white">{{ stats.todaySticks || 0 }}</p>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-white/10">
                        <div class="flex items-start gap-3">
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-yellow-400 mt-1"></i>
                            <p class="text-[10px] text-white/60 font-medium leading-relaxed">
                                <span class="text-yellow-400 font-bold uppercase">Coach Note:</span> 
                                High Tar levels detected. Oxygen diffusion in alveoli might be obstructed for the next 2-4 hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
