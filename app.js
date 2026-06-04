const todayKey = new Date().toISOString().slice(0,10);
const state = JSON.parse(localStorage.getItem('calmStrengthState') || '{}');
const defaults = {
  profile: { maintenance: 2100, lossPerWeek: 1.5, plannedMove: 500 },
  days: {}
};
const app = { ...defaults, ...state, profile: { ...defaults.profile, ...(state.profile || {}) }, days: { ...(state.days || {}) } };
if (!app.days[todayKey]) app.days[todayKey] = { pain: 'green', food: [], workouts: [], body: [] };

const foodDb = {
  'rice': { qty:'1 cup cooked', cals:200 }, 'half rice': { qty:'1/2 cup cooked', cals:100 }, 'egg': { qty:'1 pc', cals:75 }, 'fried egg': { qty:'1 pc', cals:90 },
  'chicken breast': { qty:'100 g', cals:165 }, 'chicken thigh': { qty:'1 pc', cals:220 }, 'adobo': { qty:'1 serving', cals:380 }, 'sinigang': { qty:'1 bowl', cals:320 },
  'tinola': { qty:'1 bowl', cals:250 }, 'tofu': { qty:'100 g', cals:140 }, 'bangus': { qty:'1 serving', cals:260 }, 'tuna': { qty:'1 can', cals:150 },
  'pandesal': { qty:'1 pc', cals:120 }, 'banana': { qty:'1 medium', cals:105 }, 'greek yogurt': { qty:'1 cup', cals:140 }, 'coffee with milk': { qty:'1 cup', cals:60 },
  '3 in 1 coffee': { qty:'1 sachet', cals:90 }, 'milk tea': { qty:'1 regular', cals:350 }, 'coke': { qty:'1 can', cals:140 }, 'pancit': { qty:'1 plate', cals:400 }
};

const workouts = [
  { title:'Lower Body Build', mins:25, cals:160, safe:['green','yellow'], tags:['No grip','Legs','Glutes'], note:'Sit-to-stand, wall squat, glute bridge, step-ups, calf raises.' },
  { title:'Walking Intervals', mins:40, cals:220, safe:['green','yellow'], tags:['No elbow load','Fat loss','Intervals'], note:'Easy warm-up, then 2 min normal + 1 min brisk.' },
  { title:'Recovery Core', mins:18, cals:70, safe:['green','yellow','red'], tags:['No plank','Back-based','Gentle'], note:'Heel taps, supine marching, pelvic tilts, dead bug legs only.' },
  { title:'Elbow Mobility Only', mins:10, cals:20, safe:['green','yellow','red','nerve'], tags:['Rehab','No load','Gentle'], note:'Bend/straighten, forearm rotation, wrist motion, hand opening.' },
  { title:'Low-Impact Burn', mins:24, cals:140, safe:['green'], tags:['No grip','Cardio','Circuit'], note:'Marching, side steps, sit-to-stand, low step-ups.' },
  { title:'Tempo Strength', mins:26, cals:150, safe:['green'], tags:['No weights','Anti-plateau','Control'], note:'Slow sit-to-stand, bridge holds, wall squat holds.' }
];

function save(){ localStorage.setItem('calmStrengthState', JSON.stringify(app)); }
function day(){ return app.days[todayKey]; }
function targetDeficit(){ return Number(app.profile.lossPerWeek) * 3500 / 7; }
function idealIntake(){ return Math.round(Number(app.profile.maintenance) + Number(app.profile.plannedMove) - targetDeficit()); }
function foodTotal(){ return day().food.reduce((s,x)=>s+Number(x.cals||0),0); }
function moveTotal(){ return day().workouts.reduce((s,x)=>s+Number(x.cals||0),0); }
function formatDate(){
  const d = new Date();
  document.getElementById('dateText').textContent = d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  document.getElementById('dayText').textContent = d.toLocaleDateString(undefined,{weekday:'long'});
  const hour = d.getHours();
  document.getElementById('greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, Aileen 👋`;
}
function updatePainUI(){
  const pain = day().pain;
  document.querySelectorAll('.pain-option').forEach(b => b.classList.toggle('selected', b.dataset.pain === pain));
  const banner = document.getElementById('painBanner');
  const copy = {
    green:['🛡️','Green day detected','You’re good to train. We’ll recommend the best plan for today.'],
    yellow:['🟡','Yellow day detected','Maintain, don’t push. Walking and gentle strength only.'],
    red:['🔴','Red day detected','Recovery mode. No strength progression today.'],
    nerve:['⚡','Nerve symptoms selected','Avoid elbow loading and consider medical assessment.']
  }[pain];
  banner.innerHTML = `<span>${copy[0]}</span><p><strong>${copy[1]}</strong> — ${copy[2]}</p>`;
  banner.style.background = pain === 'green' ? '#eaf7ee' : pain === 'yellow' ? '#fff7df' : pain === 'red' ? '#fff1ef' : '#f6edff';
}
function updateBudget(){
  const ideal = idealIntake(); const food = foodTotal(); const move = moveTotal(); const planned = Number(app.profile.plannedMove);
  const foodLeft = ideal - food; const moveLeft = Math.max(0, planned - move);
  document.getElementById('idealCalories').textContent = ideal;
  document.getElementById('foodLogged').textContent = food;
  document.getElementById('foodLeft').textContent = foodLeft >= 0 ? `${foodLeft} cal left` : `${Math.abs(foodLeft)} cal over`;
  document.getElementById('foodBudgetSmall').textContent = ideal;
  document.getElementById('moveDone').textContent = move;
  document.getElementById('moveTargetSmall').textContent = planned;
  document.getElementById('moveLeft').textContent = `${moveLeft} cal left`;
  document.getElementById('moveBudgetSmall').textContent = planned;
  document.getElementById('foodRing').style.setProperty('--p', Math.min(100, Math.round(food/ideal*100)));
  document.getElementById('moveRing').style.setProperty('--p', planned ? Math.min(100, Math.round(move/planned*100)) : 100);
  const pain = day().pain;
  let title='On Track', icon='✅', note=`You have ${Math.max(0,foodLeft)} calories left and ${moveLeft} movement calories left.`;
  if (foodLeft < 0 && moveLeft > 0) { title='Recoverable'; icon='🎯'; note=`You are ${Math.abs(foodLeft)} calories over food target. You still have ${moveLeft} safe movement calories left, if elbows allow.`; }
  if (foodLeft < 0 && moveLeft === 0) { title='Over Target'; icon='⚠️'; note=`You are ${Math.abs(foodLeft)} calories over today. Do not punish-train; balance this tomorrow or through the weekly bank.`; }
  if (foodLeft >= 0 && foodLeft < 300) { title='Tight but Okay'; icon='🟡'; note=`You have ${foodLeft} calories left. Keep the next meal controlled or add easy walking if safe.`; }
  if (pain === 'red' || pain === 'nerve') { title = pain === 'nerve' ? 'Protect First' : 'Recovery Mode'; icon = pain === 'nerve' ? '⚡' : '🔴'; note = `Do not force the ${planned}-cal movement target today. Keep movement gentle and protect your elbows.`; }
  document.getElementById('balanceIcon').textContent = icon;
  document.getElementById('balanceTitle').textContent = title;
  document.getElementById('balanceNote').textContent = note;
  document.getElementById('sumFood').textContent = food;
  document.getElementById('sumMove').textContent = move;
  document.getElementById('sumIdeal').textContent = ideal;
  document.getElementById('sumPain').textContent = pain[0].toUpperCase()+pain.slice(1);
}
function updatePlan(){
  const pain=day().pain; let plan;
  if (pain==='green') plan=[['🚶','Move','500 cal target','e.g. 60 min walk'],['🏃‍♀️','Strength','Lower Body','25–30 min'],['💜','Rehab','Elbow Mobility','10 min'],['🍴','Food Focus','High protein','at each meal']];
  else if (pain==='yellow') plan=[['🚶','Move','Easy walking','20–40 min'],['🧘','Strength','Maintain only','no progression'],['💜','Rehab','Mobility only','gentle'],['🍴','Food Focus','Watch portions','avoid liquid calories']];
  else plan=[['🚶','Move','Gentle only','if comfortable'],['🛑','Strength','Skip today','no progression'],['💜','Rehab','Calm-down','heat + mobility'],['🍴','Food Focus','Stay steady','no crash diet']];
  document.getElementById('todayPlan').innerHTML = plan.map(p=>`<div class="plan-item"><span>${p[0]}</span><div><strong>${p[1]}</strong><p>${p[2]}<br><small>${p[3]}</small></p></div></div>`).join('');
}
function renderEntries(){
  const entries = [...day().food.map((x,i)=>({...x,type:'food',i})), ...day().workouts.map((x,i)=>({...x,type:'workout',i}))];
  document.getElementById('entryList').innerHTML = entries.length ? entries.map(e=>`<div class="entry"><div><strong>${e.type==='food'?'🍏':'👟'} ${e.name}</strong><small>${e.qty || e.mins+' min'} · ${e.meal || e.kind} · ${e.cals} cal</small></div><button data-deltype="${e.type}" data-delindex="${e.i}">Delete</button></div>`).join('') : '<p class="hint">No entries yet today.</p>';
  document.querySelectorAll('[data-deltype]').forEach(btn=>btn.onclick=()=>{ const arr = btn.dataset.deltype === 'food' ? day().food : day().workouts; arr.splice(Number(btn.dataset.delindex),1); save(); renderAll(); });
}
function renderWorkouts(){
  const pain=day().pain;
  document.getElementById('workoutCards').innerHTML = workouts.filter(w=>w.safe.includes(pain)).map(w=>`<article class="card compact workout-card"><div><h3>${w.title}</h3><p>${w.note}</p><div class="workout-tags"><span class="tag green">${w.mins} min</span><span class="tag">${w.cals} cal est.</span>${w.tags.map(t=>`<span class="tag warn">${t}</span>`).join('')}</div></div><button data-startworkout="${w.title}">Add</button></article>`).join('');
  document.querySelectorAll('[data-startworkout]').forEach(btn=>btn.onclick=()=>{ const w=workouts.find(x=>x.title===btn.dataset.startworkout); day().workouts.push({name:w.title, mins:w.mins, cals:w.cals, kind:'Workout'}); save(); renderAll(); switchTab('today'); });
}
function renderLibrary(){
  document.getElementById('foodLibrary').innerHTML = Object.entries(foodDb).map(([name,v])=>`<div class="library-food"><strong>${name}</strong><span>${v.qty} · ${v.cals} cal</span></div>`).join('');
}
function renderBody(){
  const hist = Object.entries(app.days).flatMap(([date,d])=>(d.body||[]).map(b=>({...b,date}))).slice(-10).reverse();
  document.getElementById('bodyHistory').innerHTML = hist.length ? hist.map(b=>`<div class="entry"><div><strong>${b.date}</strong><small>Weight: ${b.weight || '—'} · Waist: ${b.waist || '—'}</small></div></div>`).join('') : '<p class="hint">No body check-ins yet.</p>';
}
function renderAll(){ updatePainUI(); updateBudget(); updatePlan(); renderEntries(); renderWorkouts(); renderLibrary(); renderBody(); }
function switchTab(tab){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(tab+'Screen').classList.add('active');
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
document.querySelectorAll('.pain-option').forEach(b=>b.addEventListener('click',()=>{ day().pain=b.dataset.pain; save(); renderAll(); }));
document.querySelectorAll('[data-modal]').forEach(b=>b.addEventListener('click',()=>{ const m=document.getElementById(b.dataset.modal); if(m) m.showModal(); }));
document.querySelector('[data-action="openFood"]').onclick=()=>switchTab('log');
document.querySelector('[data-action="openWorkout"]').onclick=()=>switchTab('log');

document.getElementById('estimateFoodBtn').onclick=()=>{
  const key = document.getElementById('foodName').value.trim().toLowerCase();
  const found = Object.keys(foodDb).find(k=>key.includes(k));
  if(found){ document.getElementById('foodQty').value = foodDb[found].qty; document.getElementById('foodCals').value = foodDb[found].cals; }
  else alert('No estimate found yet. Enter calories manually, then save it as part of your log.');
};
document.getElementById('addFoodBtn').onclick=()=>{
  const name=document.getElementById('foodName').value.trim(); const qty=document.getElementById('foodQty').value.trim(); const cals=Number(document.getElementById('foodCals').value); const meal=document.getElementById('mealType').value;
  if(!name || !cals) return alert('Please enter food name and calories.');
  day().food.push({name,qty,cals,meal}); ['foodName','foodQty','foodCals'].forEach(id=>document.getElementById(id).value=''); save(); renderAll();
};
document.getElementById('estimateWorkoutBtn').onclick=()=>{
  const mins=Number(document.getElementById('workoutMins').value||0); if(!mins) return alert('Enter minutes first.');
  document.getElementById('workoutName').value ||= 'Walking'; document.getElementById('workoutCals').value = Math.round(mins*5);
};
document.getElementById('addWorkoutBtn').onclick=()=>{
  const name=document.getElementById('workoutName').value.trim(); const mins=Number(document.getElementById('workoutMins').value); const cals=Number(document.getElementById('workoutCals').value); const kind=document.getElementById('workoutType').value;
  if(!name || !cals) return alert('Please enter activity name and calories.');
  day().workouts.push({name,mins,cals,kind}); ['workoutName','workoutMins','workoutCals'].forEach(id=>document.getElementById(id).value=''); save(); renderAll();
};

document.getElementById('goalModal').addEventListener('show',()=>{
  document.getElementById('maintenanceInput').value=app.profile.maintenance;
  document.getElementById('lossInput').value=app.profile.lossPerWeek;
  document.getElementById('plannedMoveInput').value=app.profile.plannedMove;
});
document.getElementById('saveGoalBtn').onclick=()=>{
  app.profile.maintenance=Number(document.getElementById('maintenanceInput').value||2100);
  app.profile.lossPerWeek=Number(document.getElementById('lossInput').value||1.5);
  app.profile.plannedMove=Number(document.getElementById('plannedMoveInput').value||500);
  save(); renderAll();
};
document.getElementById('saveBodyBtn').onclick=()=>{
  const weight=document.getElementById('weightInput').value; const waist=document.getElementById('waistInput').value;
  if(!weight && !waist) return alert('Enter weight or waist.');
  day().body.push({weight,waist,time:new Date().toLocaleTimeString()}); document.getElementById('weightInput').value=''; document.getElementById('waistInput').value=''; save(); renderAll();
};

formatDate(); renderAll();
