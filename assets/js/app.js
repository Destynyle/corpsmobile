    // --------------------------
    // Helpers (storage)
    // --------------------------
    const config = window.CC_CONFIG || {};
    const KEY = config.key || "cc_calisthenics_v2";
    const WEEKLY_GOAL = Number(config.weeklyGoal) || 5;
    const TIMER_DEFAULT_HINT = config.timerDefaultHint || "60–120s repos • 45–90s étirements";
    const SESSION_DONE_MESSAGE = config.sessionDoneMessage || "Séance validée ✅";
    const checklistByTab = config.checklistByTab || {};
    const goals = Array.isArray(config.goals) ? config.goals : [];
    const todayISO = () => new Date().toISOString().slice(0,10);

    function defaultGoalsState(){
      const map = {};
      goals.forEach((goal) => {
        map[goal.k] = false;
      });
      return map;
    }

    function createDefaultState(){
      return {
        sessionsDone: 0,
        streak: 0,
        lastDoneDate: null,
        weekStart: weekStartISO(new Date()),
        weekCount: 0,
        todayChecks: {},
        goals: defaultGoalsState()
      };
    }

    function normalizeState(raw){
      const safe = (raw && typeof raw === "object") ? raw : {};
      const defaults = createDefaultState();
      return {
        ...defaults,
        ...safe,
        todayChecks: (safe.todayChecks && typeof safe.todayChecks === "object") ? safe.todayChecks : {},
        goals: {
          ...defaults.goals,
          ...(safe.goals && typeof safe.goals === "object" ? safe.goals : {})
        }
      };
    }

    function loadState(){
      try{
        const raw = localStorage.getItem(KEY);
        if(!raw) return createDefaultState();
        return normalizeState(JSON.parse(raw));
      }catch(e){
        return createDefaultState();
      }
    }
    function saveState(s){
      localStorage.setItem(KEY, JSON.stringify(s));
    }

    function weekStartISO(d){
      // Monday as week start
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      return date.toISOString().slice(0,10);
    }

    function daysBetween(aISO, bISO){
      const a = new Date(aISO + "T00:00:00");
      const b = new Date(bISO + "T00:00:00");
      return Math.round((b - a) / (1000*60*60*24));
    }

    let state = loadState();

    // Reset weekly counter if new week
    (function ensureWeek(){
      const nowWeek = weekStartISO(new Date());
      if(state.weekStart !== nowWeek){
        state.weekStart = nowWeek;
        state.weekCount = 0;
        saveState(state);
      }
    })();

    // --------------------------
    // Tabs
    // --------------------------
    const tabBtns = Array.from(document.querySelectorAll(".tabbtn"));
    const panels = tabBtns.reduce((acc, btn) => {
      const panelId = btn.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if(panel) acc[btn.id] = panel;
      return acc;
    }, {});

    function setActiveTab(btn){
      const panel = panels[btn.id];
      if(!panel) return;
      tabBtns.forEach(b => b.setAttribute("aria-selected", String(b === btn)));
      Object.values(panels).forEach(p => p.classList.remove("active"));
      panel.classList.add("active");

      // Update today checklist based on tab
      buildTodayList(btn.id);
      // Save last tab
      localStorage.setItem(KEY + "_lasttab", btn.id);
    }

    tabBtns.forEach(btn => btn.addEventListener("click", () => setActiveTab(btn)));

    // Restore last tab
    const lastTab = localStorage.getItem(KEY + "_lasttab");
    const lastBtn = lastTab ? document.getElementById(lastTab) : null;
    if(lastBtn) setActiveTab(lastBtn);

    // --------------------------
    // Timer
    // --------------------------
    let timerSeconds = 0;
    let timerRunning = false;
    let timerInterval = null;

    const timerText = document.getElementById("timerText");
    const timerHint = document.getElementById("timerHint");
    const btnStart = document.getElementById("timerStart");
    const btnMinus = document.getElementById("timerMinus");
    const btnPlus  = document.getElementById("timerPlus");
    const btnReset = document.getElementById("timerReset");

    function fmt(sec){
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
    }
    function renderTimer(){
      timerText.textContent = fmt(timerSeconds);
      btnStart.textContent = timerRunning ? "⏸" : "▶︎";
    }
    function stopTimer(){
      timerRunning = false;
      if(timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      renderTimer();
    }
    function startTimer(){
      if(timerSeconds <= 0) return;
      timerRunning = true;
      renderTimer();
      if(timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if(!timerRunning) return;
        timerSeconds = Math.max(0, timerSeconds - 1);
        renderTimer();
        if(timerSeconds === 0){
          stopTimer();
          // gentle vibration if supported
          if(navigator.vibrate) navigator.vibrate([120,60,120]);
          // subtle beep (WebAudio)
          try{
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = "sine";
            o.frequency.value = 880;
            g.gain.value = 0.04;
            o.connect(g); g.connect(ctx.destination);
            o.start();
            setTimeout(()=>{ o.stop(); ctx.close(); }, 180);
          }catch(e){}
        }
      }, 1000);
    }

    btnStart.addEventListener("click", () => {
      if(timerRunning) stopTimer();
      else startTimer();
    });
    btnMinus.addEventListener("click", () => { timerSeconds = Math.max(0, timerSeconds - 10); renderTimer(); });
    btnPlus.addEventListener("click",  () => { timerSeconds = timerSeconds + 10; renderTimer(); });
    btnReset.addEventListener("click", () => { stopTimer(); timerSeconds = 0; renderTimer(); timerHint.textContent = TIMER_DEFAULT_HINT; });

    document.querySelectorAll("[data-quicktimer]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const sec = parseInt(b.getAttribute("data-quicktimer"),10) || 60;
        timerSeconds = sec;
        timerHint.textContent = "Prêt : " + sec + " secondes";
        renderTimer();
        stopTimer();
        startTimer();
      });
    });

    renderTimer();

    // --------------------------
    // Today checklist (interactive)
    // --------------------------
    const todayList = document.getElementById("todayList");

    function getTodayKey(tabId){
      return todayISO() + "::" + tabId;
    }

    function buildTodayList(tabId){
      const items = checklistByTab[tabId] || [];
      const key = getTodayKey(tabId);
      state.todayChecks[key] = state.todayChecks[key] || {};
      saveState(state);

      todayList.innerHTML = "";
      items.forEach(it=>{
        const done = !!state.todayChecks[key][it.id];
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div class="left">
            <div class="check ${done ? "done":""}" role="button" aria-label="Cocher">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="rgba(232,238,252,.95)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h4>${it.title}</h4>
              <p>${it.desc}</p>
            </div>
          </div>
          <div class="right">
            <span class="kbd">Aujourd’hui</span>
          </div>
        `;
        el.querySelector(".check").addEventListener("click", ()=>{
          const cur = !!state.todayChecks[key][it.id];
          state.todayChecks[key][it.id] = !cur;
          saveState(state);
          buildTodayList(tabId);
        });
        todayList.appendChild(el);
      });
      updateStatsUI();
    }

    // --------------------------
    // Goals list
    // --------------------------
    const goalsList = document.getElementById("goalsList");
    function buildGoals(){
      goalsList.innerHTML = "";
      goals.forEach(g=>{
        const done = !!state.goals[g.k];
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div class="left">
            <div class="check ${done ? "done":""}" role="button" aria-label="Cocher objectif">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="rgba(232,238,252,.95)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h4>${g.title}</h4>
              <p>${g.desc}</p>
            </div>
          </div>
          <div class="right">
            <span class="kbd">${done ? "OK ✅" : "En cours"}</span>
          </div>
        `;
        el.querySelector(".check").addEventListener("click", ()=>{
          state.goals[g.k] = !done;
          saveState(state);
          buildGoals();
        });
        goalsList.appendChild(el);
      });
    }

    // --------------------------
    // Stats (sessions / streak)
    // --------------------------
    const sessionsDoneEl = document.getElementById("sessionsDone");
    const streakEl = document.getElementById("streak");
    const weekBar = document.getElementById("weekBar");

    function updateStatsUI(){
      sessionsDoneEl.textContent = String(state.sessionsDone || 0);
      streakEl.textContent = String(state.streak || 0);

      const week = state.weekCount || 0;
      const pct = Math.max(0, Math.min(100, (week / WEEKLY_GOAL) * 100));
      weekBar.style.width = pct.toFixed(0) + "%";
    }

    document.getElementById("markSessionDone").addEventListener("click", ()=>{
      const today = todayISO();
      const last = state.lastDoneDate;

      // Update streak
      if(!last){
        state.streak = 1;
      }else{
        const diff = daysBetween(last, today);
        if(diff === 0){
          // already done today, don't double count streak
        }else if(diff === 1){
          state.streak = (state.streak || 0) + 1;
        }else{
          state.streak = 1;
        }
      }

      // Sessions counters
      if(state.lastDoneDate !== today){
        state.sessionsDone = (state.sessionsDone || 0) + 1;
        state.weekCount = (state.weekCount || 0) + 1;
      }
      state.lastDoneDate = today;
      saveState(state);

      // Feedback
      if(navigator.vibrate) navigator.vibrate([60,40,60]);
      updateStatsUI();
      alert(SESSION_DONE_MESSAGE);
    });

    document.getElementById("resetAll").addEventListener("click", ()=>{
      if(!confirm("Reset complet ? (stats + checklist + objectifs)")) return;
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY + "_lasttab");
      state = loadState();
      ensureStart();
      location.reload();
    });

    document.getElementById("clearToday").addEventListener("click", ()=>{
      const activeTab = document.querySelector(".tabbtn[aria-selected='true']").id;
      const key = getTodayKey(activeTab);
      state.todayChecks[key] = {};
      saveState(state);
      buildTodayList(activeTab);
    });

    document.getElementById("openToday").addEventListener("click", ()=>{
      // scroll to checklist on right panel (mobile friendly)
      document.querySelector("aside.card").scrollIntoView({behavior:"smooth", block:"start"});
    });

    function ensureStart(){
      // ensure week is correct
      const nowWeek = weekStartISO(new Date());
      if(state.weekStart !== nowWeek){
        state.weekStart = nowWeek;
        state.weekCount = 0;
      }
      saveState(state);
    }

    // Init UI
    ensureStart();
    buildGoals();
    updateStatsUI();

    // Build today checklist for active tab
    const activeTab = document.querySelector(".tabbtn[aria-selected='true']").id;
    buildTodayList(activeTab);
