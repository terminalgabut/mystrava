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

    <div class="mt-8 space-y-6">
    <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 class="font-black text-slate-900 uppercase tracking-tighter italic mb-6 flex items-center gap-2">
            <i data-lucide="microscope" class="w-5 h-5 text-orange-600"></i> 
            Biochemical Correlation Analysis
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <p class="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">Est. CO Saturation</p>
                <p class="text-3xl font-black text-orange-900">{{ coSaturation }}%</p>
                <p class="text-[10px] text-orange-700 mt-2 leading-relaxed">
                    Karbon Monoksida mengikat hemoglobin lebih kuat dari oksigen. Angka ini menunjukkan estimasi "ruang" di darah yang diserobot asap.
                </p>
            </div>

            <div class="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <p class="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Oxygen Efficiency</p>
                <p class="text-3xl font-black text-blue-900">{{ oxygenEfficiency }}%</p>
                <p class="text-[10px] text-blue-700 mt-2 leading-relaxed">
                    Estimasi kemampuan alveoli menyerap oksigen. Tar tinggi menciptakan lapisan residu yang menghambat difusi.
                </p>
            </div>
        </div>
    </div>

    <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10">
            <i data-lucide="brain" class="w-32 h-32"></i>
        </div>
        <h3 class="font-black text-lg mb-4 flex items-center gap-2 uppercase italic tracking-tighter">
            <i data-lucide="bot" class="w-6 h-6 text-indigo-400"></i> Coach Intelligence Deep Dive
        </h3>
        <p class="text-indigo-100 leading-relaxed font-medium italic">
            "{{ deepInsight }}"
        </p>
        </div>
    </div>
    

    <div class="mt-12 space-y-8 animate-in pb-16">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div class="flex items-center gap-3 px-4 py-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-50 border-slate-100 text-slate-600">
                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
            </div>
            <h3 class="font-black text-slate-900 uppercase tracking-tighter italic text-lg">
                Historical Intake <span class="text-orange-600">Audit</span>
            </h3>
        </div>

        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner w-full md:w-fit">
            <button @click="changeTimeFilter('weekly')" 
                    :class="timeFilter === 'weekly' ? 'bg-white shadow-sm text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                    class="flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-transparent">
                <i data-lucide="calendar-days" class="w-3.5 h-3.5"></i> Weekly
            </button>
            <button @click="changeTimeFilter('monthly')" 
            :class="timeFilter === 'monthly' ? 'bg-white shadow-sm text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
            class="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-transparent min-w-[100px]">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Monthly
    </button>
            <button @click="changeTimeFilter('yearly')" 
                    :class="timeFilter === 'yearly' ? 'bg-white shadow-sm text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                    class="flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-transparent">
                <i data-lucide="calendar-range" class="w-3.5 h-3.5"></i> Yearly
            </button>
            <button @click="changeTimeFilter('alltime')" 
                    :class="timeFilter === 'alltime' ? 'bg-white shadow-sm text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                    class="flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-transparent">
                <i data-lucide="infinity" class="w-3.5 h-3.5"></i> All Time
            </button>
        </div>
    </div>

    <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-[0.03]">
            <i data-lucide="flame" class="w-64 h-64 text-orange-950"></i>
        </div>
        
        <div class="relative z-10">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trend Analysis</p>
                    <h4 class="text-xl font-black text-slate-900 uppercase italic tracking-tight mt-1">
                        Accumulated Tar Load <span class="text-orange-500">(grams)</span>
                    </h4>
                </div>
                <div class="px-5 py-2.5 bg-slate-900 rounded-full border border-slate-700 text-white shadow-lg shadow-slate-950/20">
                    <p class="text-[9px] font-bold uppercase text-white/50 tracking-wider">Total in Period</p>
                    <p class="text-2xl font-black text-orange-400 mt-0.5">{{ totalPeriodTar }}<span class="text-lg">g</span></p>
                </div>
            </div>

            <div class="relative w-full h-80">
                <canvas id="tobaccoHistoricalChart"></canvas>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div class="absolute -bottom-10 -left-10 p-8 opacity-10">
                <i data-lucide="activity" class="w-48 h-48 text-green-400"></i>
            </div>
            
            <h5 class="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter relative z-10">
                <i data-lucide="gauge" class="w-5 h-5 text-green-400"></i> Smoke-Pace Penalty
            </h5>
            
            <div class="grid grid-cols-2 gap-6 relative z-10">
                <div>
                    <p class="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Average Pace (This Period)</p>
                    <p class="text-4xl font-black text-white">{{ stats.avgPace }}<span class="text-lg">min/km</span></p>
                </div>
                <div>
                    <p class="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">Estimated Penalty</p>
                    <p class="text-4xl font-black text-red-400">+{{ stats.pacePenalty }}<span class="text-lg">s/km</span></p>
                </div>
            </div>
            
            <div class="mt-6 pt-5 border-t border-white/10 relative z-10">
                <p class="text-xs text-white/70 leading-relaxed font-medium">
                    Analisa korelasi menunjukkan: Kenaikan 10% Tar mingguan berpotensi melambatkan Pace lari Bos sejauh <span class="text-red-400 font-bold">{{ stats.pacePenalty }} detik per kilometer</span> karena beban kerja jantung yang meningkat.
                </p>
            </div>
        </div>

        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div class="w-20 h-20 rounded-full border-4 border-orange-100 bg-orange-50 flex items-center justify-center text-orange-600 mb-6">
                <i data-lucide="battery-charging" class="w-10 h-10 animate-pulse"></i>
            </div>
            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Alveoli Recovery Window</p>
            <p class="text-4xl font-black text-slate-900 uppercase italic tracking-tight">~{{ stats.recoveryDays }} <span class="text-2xl text-slate-500">Days</span></p>
            <p class="text-[10px] text-slate-500 mt-3 leading-relaxed max-w-xs">
                Waktu estimasi untuk membersihkan residu Tar di paru-paru jika Bos berhenti merokok mulai hari ini, berdasarkan akumulasi All-Time.
            </p>
        </div>
    </div>
</div>


</div>
`;
