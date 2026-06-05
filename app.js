const $ = id => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0,10);
const storeKey = 'cta_v3_state';
const defaultState = { profile:null, pain:null, food:[], moves:[], checkins:[], prefs:{focus:'balanced'}, date: todayKey() };
let state = load();
function load(){ try { return {...defaultState, ...JSON.parse(localStorage.getItem(storeKey)||'{}')}; } catch(e){ return {...defaultState}; }}
function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
function ensureToday(){ if(state.date !== todayKey()){ state.date=todayKey(); state.food=[]; state.moves=[]; state.pain=null; save(); }}
ensureToday();

const libraries = {
  cardio:['Easy walk','Brisk interval walk','Split walk day','March in place','Side step-touch','Chair march intervals','Seated side-step cardio','Low step-ups'],
  lower:['Sit-to-stand','Wall squat','Wall sit','Step-up','Glute bridge','Wall-foot glute bridge','Standing calf raise','Chair leg extension','Standing hamstring curl','Side-lying leg raise'],
  core:['Dead bug legs only','Heel taps','Supine marching','Pelvic tilt','Chair core lean-back','Wall dead bug prep','Standing knee lift','Side-lying wall leg press'],
  posture:['Chin tuck','Scapular setting','Wall posture reset','Wall angels pain-free range','Shoulder rolls','Chest opener gentle','Wall breathing reset'],
  rehab:['Warm compress timer','Elbow bend and straighten','Forearm rotation unloaded','Wrist motion unloaded','Gentle hand opening','Wrist flexion isometric','Pronation isometric','Finger flexor isometric'],
  wallPilates:['Wall roll-down prep','Wall-foot glute bridge','Wall-foot bridge march','Wall Pilates squat and heel lift','Wall calf raise flow','Wall standing leg sweep','Wall sit with breathing','Legs-up-the-wall recovery','Wall hamstring stretch','Wall hip opener','Wall side leg sweep','Wall supported balance reach'],
  chair:['Chair march intervals','Chair toe-heel taps','Chair sit-to-stand flow','Chair leg extension flow','Chair core lean-back','Seated side-step cardio','Chair posture reset','Seated knee lift','Seated calf raise','Chair breathing reset'],
  locked:['Wall push-up','Wall plank','Roll-down to push-up','Plank knee taps','All-fours bird dog','Dumbbell row','Band rows held in hands']
};
const foodDb = [
  ['rice cooked 1 cup',200],['rice cooked 1/2 cup',100],['fried egg 1 piece',90],['boiled egg 1 piece',70],['chicken breast 100g',165],['chicken thigh 1 piece',220],['fish grilled 100g',150],['tofu 100g',90],['Greek salad 1 bowl',300],['chicken souvlaki pita 1 piece',550],['gyro pita 1 piece',650],['moussaka 1 serving',550],['spanakopita 1 piece',300],['yogurt Greek plain 1 cup',130],['banana 1 medium',105],['apple 1 medium',95],['pancit 1 plate',400],['adobo 1 serving',350],['sinigang 1 bowl',300],['tocino 1 serving',300],['longganisa 1 piece',180],['milk tea regular',450],['coffee with milk sugar',120],['coke regular can',140]
];

function lbToKg(x){return Number(x)*0.45359237}
function kgToLb(x){return Number(x)*2.20462262}
function calcProfile(){
  const p = state.profile; if(!p) return null;
  const kg = p.weightUnit==='kg' ? Number(p.weight) : lbToKg(p.weight);
  const cm = p.heightUnit==='cm' ? Number(p.heightCm) : (Number(p.heightFt)*30.48 + Number(p.heightIn)*2.54);
  const bmr = p.sex==='male' ? (10*kg + 6.25*cm - 5*p.age + 5) : (10*kg + 6.25*cm - 5*p.age - 161);
  const maintenance = Math.round(bmr * Number(p.activity));
  const targetDeficit = Math.round((Number(p.lossPerWeek)*3500)/7);
  const plannedMove = Number(p.plannedMove || 500);
  const idealIntake = Math.round(maintenance + plannedMove - targetDeficit);
  return {kg, cm, bmr:Math.round(bmr), maintenance, targetDeficit, plannedMove, idealIntake};
}
function totalFood(){ return state.food.reduce((a,x)=>a+Number(x.calories||0),0); }
function totalMove(){ return state.moves.reduce((a,x)=>a+Number(x.calories||0),0); }
function render(){
  const p=state.profile, c=calcProfile();
  $('profileGate').classList.toggle('hidden', !!p);
  $('helloText').textContent = p ? `Hi ${p.name || 'there'}, your safe plan` : 'Your safe plan';
  document.querySelectorAll('.pain').forEach(b=>b.classList.toggle('active', b.dataset.pain===state.pain));
  const painMsg={green:'Green day: full elbow-safe routine with controlled progression.',yellow:'Yellow day: complete routine but lighter. Maintain, do not progress.',red:'Red day: recovery routine only. Gentle movement and rehab.',nerve:'Nerve symptoms: safest routine only and consider assessment.'};
  $('painMessage').textContent = painMsg[state.pain] || 'Choose your elbow status so CTA can select safe training.';
  if(c){
    const food=totalFood(), move=totalMove();
    const foodLeft=c.idealIntake-food;
    const moveLeft=Math.max(0,c.plannedMove-move);
    $('idealIntake').textContent=`${c.idealIntake} cal`;
    $('foodLeft').textContent= foodLeft>=0 ? `${foodLeft} cal` : `${Math.abs(foodLeft)} over`;
    $('moveDone').textContent=`${move} / ${c.plannedMove}`;
    $('moveLeft').textContent=`${moveLeft} cal`;
    const loss=Number(state.profile.lossPerWeek);
    $('safetyBadge').textContent = loss>3 ? 'Extreme goal' : loss>2 ? 'Very aggressive' : 'Calculated';
    $('safetyBadge').classList.toggle('danger', loss>3);
    $('foodBar').style.width=`${Math.min(100,Math.max(0,(food/c.idealIntake)*100))}%`;
    $('moveBar').style.width=`${Math.min(100,Math.max(0,(move/c.plannedMove)*100))}%`;
    let note = `Ideal intake is based on maintenance + ${c.plannedMove} movement calories - ${c.targetDeficit} target deficit.`;
    if(foodLeft<0 && moveLeft>0) note = `You are ${Math.abs(foodLeft)} calories over food budget, but still have ${moveLeft} movement calories left. Use only elbow-safe movement.`;
    else if(foodLeft<0) note = `You are ${Math.abs(foodLeft)} calories over today. Do not punish-train; use tomorrow or weekly balance.`;
    else if(moveLeft>0) note = `You have ${foodLeft} food calories left and ${moveLeft} movement calories left.`;
    else note = `Movement target complete. You have ${foodLeft} food calories left.`;
    $('balanceNote').textContent=note;
  }
  renderLogs(); renderLibrary();
}
function renderLogs(){
  $('foodLog').innerHTML = state.food.slice().reverse().map(x=>`<div class="log-item"><div><strong>${x.food}</strong><small>${x.meal} • ${x.qty||''}</small></div><strong>${x.calories} cal</strong></div>`).join('') || '<p class="coach-note">No food logged yet.</p>';
  $('movementLog').innerHTML = state.moves.slice().reverse().map(x=>`<div class="log-item"><div><strong>${x.type}</strong><small>${x.source} • ${x.minutes||0} min • ${x.steps||0} steps</small></div><strong>${x.calories} cal</strong></div>`).join('') || '<p class="coach-note">No movement imported yet.</p>';
  $('progressLog').innerHTML = state.checkins.slice().reverse().map(x=>`<div class="log-item"><div><strong>${x.date}</strong><small>Waist: ${x.waist||'—'}</small></div><strong>${x.weight||'—'}</strong></div>`).join('') || '<p class="coach-note">No check-ins yet.</p>';
}
function renderLibrary(){
  $('libraryList').innerHTML = Object.entries(libraries).map(([k,arr])=>`<div class="lib-section"><h3>${label(k)}</h3>${arr.map(v=>`<span class="pill ${k==='locked'?'danger':''}">${v}</span>`).join('')}</div>`).join('');
}
function label(k){return {cardio:'Cardio',lower:'Lower Body',core:'Core',posture:'Posture',rehab:'Rehab',wallPilates:'Wall Pilates',chair:'Chair Exercises',locked:'Locked For Now'}[k]||k}

function buildRoutine(kind='best'){
  const pain=state.pain||'green', focus=$('focusInput').value, week=Number($('weekInput').value||1);
  const phase = week<=4?'Foundation':week<=8?'Volume':week<=12?'Tempo':week<=16?'Density':'Next Cycle';
  const isRed=pain==='red'||pain==='nerve';
  const isYellow=pain==='yellow';
  let title = kind==='easy'?'Easier Coach Option':kind==='burn'?'Calorie-Focused Option':'Best Coach Choice';
  let minutes = isRed?18:isYellow?25:(kind==='burn'||focus==='burn'?42:32);
  let burn = isRed?'40–90':isYellow?'80–160':(kind==='burn'||focus==='burn'?'220–420':'140–260');
  const pick=(arr,i)=>arr[(week+i)%arr.length];
  const routine=[];
  if(isRed){
    routine.push(['Cardio', 'Easy walk or chair march', '5–10 min, very easy']);
    routine.push(['Lower Body', pick(libraries.chair,1), '2 sets, gentle']);
    routine.push(['Core', 'Pelvic tilt', '2 x 8']);
    routine.push(['Posture', 'Wall posture reset', '2 min']);
    routine.push(['Rehab', pain==='nerve'?'Gentle hand opening':'Elbow bend and straighten', '1–2 x 10, pain-free']);
    routine.push(['Wall Pilates', 'Legs-up-the-wall recovery', '3–5 min']);
  } else {
    routine.push(['Cardio', kind==='burn'||focus==='burn'? 'Brisk interval walk':'Easy walk + step-touch', kind==='burn'||focus==='burn'? '30–40 min intervals':'15–25 min']);
    routine.push(['Lower Body', pick(libraries.lower,2), phase==='Tempo'?'3 x 8 slow 3-sec lower':'3 x 10–12']);
    routine.push(['Core', pick(libraries.core,3), '2–3 sets, no planks']);
    routine.push(['Posture', pick(libraries.posture,4), '2 x 8 or 2 min']);
    routine.push(['Rehab', isYellow?'Mobility only':pick(libraries.rehab,5), isYellow?'1–2 x 10, no progression':'5 gentle holds or 2 x 10']);
    routine.push(['Wall Pilates', pick(libraries.wallPilates,6), phase==='Density'?'2–3 timed rounds':'2 sets']);
    routine.push(['Chair', pick(libraries.chair,7), 'Optional finisher, 3–6 min']);
  }
  return {title, phase, minutes, burn, routine, kind};
}
function renderOptions(){
  const options=[buildRoutine('best'),buildRoutine('easy'),buildRoutine('burn')];
  $('coachOptions').innerHTML=options.map((o,i)=>`<div class="option"><h3>${o.title}</h3><p class="coach-note">${o.phase} • ${o.minutes} min • est. ${o.burn} cal</p>${o.routine.slice(0,5).map(r=>`<span class="pill">${r[0]}</span>`).join('')}<button class="primary full" onclick="startWorkout(${i})">Start this workout</button></div>`).join('');
  window._workoutOptions=options;
}
window.startWorkout=function(i){
  const o=window._workoutOptions[i];
  $('activeWorkout').classList.remove('hidden');
  $('activeWorkout').innerHTML=`<p class="eyebrow">Active Workout</p><h2>${o.title}</h2><p class="coach-note">${o.phase} • ${o.minutes} min • estimated ${o.burn} calories. No gripping, no all-fours, no elbow weight-bearing.</p>${o.routine.map(r=>`<div class="exercise"><h4>${r[0]} — ${r[1]}</h4><p class="coach-note">${r[2]}</p></div>`).join('')}<div class="grid two"><label>Calories to log <input id="finishCal" type="number" placeholder="e.g. 180" /></label><label>Minutes <input id="finishMin" type="number" value="${o.minutes}" /></label></div><button class="primary full" onclick="finishWorkout('${o.title.replace(/'/g,'')}')">Finish + Log Workout</button>`;
  $('activeWorkout').scrollIntoView({behavior:'smooth',block:'start'});
}
window.finishWorkout=function(title){
  const calories=Number($('finishCal').value||0), minutes=Number($('finishMin').value||0);
  if(!calories){ alert('Enter estimated calories from your watch, Apple Health, Garmin, or estimate.'); return; }
  state.moves.push({date:todayKey(),source:'CTA workout',type:title,minutes,steps:0,calories}); save(); render(); alert('Workout logged.');
}

// Events
$('heightUnit').addEventListener('change',()=>{document.querySelectorAll('.height-cm').forEach(x=>x.classList.toggle('hidden',$('heightUnit').value!=='cm'));document.querySelectorAll('.height-ft').forEach(x=>x.classList.toggle('hidden',$('heightUnit').value!=='ftin'));});
$('saveProfileBtn').onclick=()=>{ state.profile={name:$('nameInput').value||'Aileen',age:Number($('ageInput').value),sex:$('sexInput').value,weightUnit:$('weightUnit').value,weight:Number($('weightInput').value||0),heightUnit:$('heightUnit').value,heightCm:Number($('heightCm').value||0),heightFt:Number($('heightFt').value||0),heightIn:Number($('heightIn').value||0),activity:$('activityInput').value,lossPerWeek:$('lossInput').value,plannedMove:Number($('plannedMoveInput').value||500)}; if(!state.profile.weight){alert('Please enter your current weight.');return;} save(); render(); };
$('editProfileBtn').onclick=()=>{$('profileGate').classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'});};
document.querySelectorAll('.pain').forEach(b=>b.onclick=()=>{state.pain=b.dataset.pain; save(); render();});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active');});
$('generateBtn').onclick=()=>{ renderOptions(); setTimeout(()=>$('coachOptions').scrollIntoView({behavior:'smooth',block:'start'}),50); };
$('estimateBtn').onclick=()=>{ const q=(`${$('qtyInput').value} ${$('foodInput').value}`).toLowerCase(); let found=foodDb.find(([name])=> q.includes(name.split(' ')[0]) && q.includes(name.split(' ')[1]||'')); if(found){$('calInput').value=found[1];} else {$('calInput').value=350; $('copyNote').textContent='Unknown food: default estimate entered. Use online lookup for better accuracy.';} };
$('addFoodBtn').onclick=()=>{ if(!$('foodInput').value||!$('calInput').value){alert('Enter food and calories.');return;} state.food.push({date:todayKey(),meal:$('mealInput').value,food:$('foodInput').value,qty:$('qtyInput').value,calories:Number($('calInput').value)}); $('foodInput').value='';$('qtyInput').value='';$('calInput').value=''; save(); render(); };
function searchPhrase(){return `calories ${$('qtyInput').value} ${$('foodInput').value}`.trim();}
$('googleBtn').onclick=()=>{window.open('https://www.google.com/search?q='+encodeURIComponent(searchPhrase()),'_blank');};
$('usdaBtn').onclick=()=>{window.open('https://fdc.nal.usda.gov/fdc-app.html#/?query='+encodeURIComponent(`${$('qtyInput').value} ${$('foodInput').value}`),'_blank');};
$('copySearchBtn').onclick=async()=>{await navigator.clipboard.writeText(searchPhrase()); $('copyNote').textContent=`Copied: ${searchPhrase()}`;};
$('estimateMoveBtn').onclick=()=>{ const min=Number($('minutesInput').value||0); const type=$('workoutTypeInput').value; let rate= type==='Walking'?4:type==='Wall Pilates'?3:type==='Chair workout'?2.5:type==='Lower-body strength'?4.5:3; $('activeCalInput').value=Math.round(min*rate); };
$('importMoveBtn').onclick=()=>{ if(!$('activeCalInput').value){alert('Enter active calories, or estimate from minutes.');return;} state.moves.push({date:todayKey(),source:$('sourceInput').value,type:$('workoutTypeInput').value,steps:Number($('stepsInput').value||0),minutes:Number($('minutesInput').value||0),calories:Number($('activeCalInput').value)}); ['stepsInput','minutesInput','activeCalInput'].forEach(id=>$(id).value=''); save(); render(); };
$('saveCheckinBtn').onclick=()=>{state.checkins.push({date:todayKey(),weight:$('checkWeight').value,waist:$('checkWaist').value}); save(); render();};
$('resetDayBtn').onclick=()=>{if(confirm('Clear today food, movement, and pain status?')){state.food=[];state.moves=[];state.pain=null;state.date=todayKey();save();render();}};
$('focusInput').onchange=()=>{state.prefs.focus=$('focusInput').value;save();};
render();
