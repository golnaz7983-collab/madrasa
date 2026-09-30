const SUPABASE_URL="https://qqwifsgnzweslkcyuqmg.supabase.co";
const SUPABASE_KEY="sb_publishable_AI6rSMSOAag61TCJzapLbg_frex6ks9";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const SUBJECTS=[["minecraft","ماینکرفت","⛏️","ساخت، بقا و دنیاسازی"],["cod","کالاف دیوتی","🎯","مهارت، تاکتیک و تیم"],["freefire","فری فایر","🔥","استراتژی و بازی تیمی"],["math","ریاضی","📐","حل مسئله و منطق"],["chemistry","شیمی","⚗️","آزمایش و علوم"],["games","بازی‌ها","🎮","طراحی و تحلیل بازی"],["english","انگلیسی","📚","زبان کاربردی بازی و فناوری"],["computer","کامپیوتر","💻","مهارت‌های دیجیتال"]];
const $=s=>document.querySelector(s), fa=n=>Number(n||0).toLocaleString("fa-IR");
const subjectName=id=>(SUBJECTS.find(x=>x[0]===id)||[id,id])[1];
function uid(role){const k="madrasa_"+role+"_id";let v=localStorage.getItem(k);if(!v){v=crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();localStorage.setItem(k,v)}return v}
function nameOf(role){const k="madrasa_"+role+"_name";let n=localStorage.getItem(k);if(!n){n=prompt(role==="teacher"?"نام معلم را وارد کنید:":"نام دانش‌آموز را وارد کنید:","");n=(n||"").trim()||(role==="teacher"?"معلم مهمان":"دانش‌آموز");localStorage.setItem(k,n)}return n}
function toast(t){const e=$("#toast");if(!e)return alert(t);e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2800)}
function fmtDate(x){return new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x))}
function fillSubjects(e){e.innerHTML=SUBJECTS.map(s=>"<option value='"+s[0]+"'>"+s[1]+"</option>").join("")}
async function ensureStudent(name){const grade=Number(localStorage.getItem("madrasa_grade")||1);return (await db.from("madrasa_students").upsert({browser_id:uid("student"),name,grade_level:grade,updated_at:new Date().toISOString()},{onConflict:"browser_id"}).select().single()).data}
async function initStudent(){
 const name=nameOf("student");$("#studentNameBadge").textContent=name;$("#studentNameTitle").textContent=name+" 👋";$("#changeStudentName").onclick=()=>{localStorage.removeItem("madrasa_student_name");location.reload()};
 await ensureStudent(name);$("#studentConnection").textContent="آنلاین ✓";$("#studentGrade").value=localStorage.getItem("madrasa_grade")||"1";$("#studentGrade").onchange=async()=>{localStorage.setItem("madrasa_grade",$("#studentGrade").value);await db.from("madrasa_students").update({grade_level:+$("#studentGrade").value}).eq("browser_id",uid("student"));toast("پایه ذخیره شد ✓")};
 $("#subjectsGrid").innerHTML=SUBJECTS.map(s=>"<article class='subject-card' data-s='"+s[0]+"'><span class='subject-badge'>رشته</span><div class='subject-art'>"+s[2]+"</div><h3>"+s[1]+"</h3><small>"+s[3]+"</small></article>").join("");
 document.querySelectorAll(".subject-card").forEach(e=>e.onclick=()=>studentClasses(e.dataset.s,e));
 await grades();studentClasses("minecraft",document.querySelector("[data-s='minecraft']"))
}
async function studentClasses(subject,card){
 document.querySelectorAll(".subject-card").forEach(e=>e.classList.toggle("active",e===card));$("#selectedSubjectLabel").textContent=subjectName(subject);const ss=await db.from("madrasa_students").select("id").eq("browser_id",uid("student")).maybeSingle();if(ss.data)await db.from("madrasa_enrollments").upsert({student_id:ss.data.id,subject,term:1},{onConflict:"student_id,subject,term"});
 const r=await db.from("madrasa_classes").select("*").eq("subject",subject).in("status",["scheduled","live"]).order("starts_at",{ascending:true});const box=$("#studentClasses");
 if(!r.data?.length){box.className="class-list empty";box.textContent="برای این رشته هنوز کلاسی ساخته نشده است.";return}
 box.className="class-list";box.innerHTML=r.data.map(c=>"<div class='class-row'><div><h3>"+esc(c.title)+"</h3><p>ترم "+fa(c.term)+" • جلسه "+fa(c.session_number)+"/۳۲ • استاد "+esc(c.teacher_name)+"</p><p>"+fmtDate(c.starts_at)+" • "+fa(c.duration_minutes)+" دقیقه</p></div><div class='class-meta'><b>"+(c.status==="live"?"🔴 زنده":"🕒 برنامه‌ریزی‌شده")+"</b><button class='primary join' data-id='"+c.id+"' data-room='"+c.room_code+"' data-s='"+c.subject+"'>"+(c.status==="live"?"ورود به کلاس":"ورود/انتظار")+"</button></div></div>").join("");
 box.querySelectorAll(".join").forEach(b=>b.onclick=()=>location.href="class.html?class="+encodeURIComponent(b.dataset.id)+"&room="+encodeURIComponent(b.dataset.room)+"&subject="+encodeURIComponent(b.dataset.s)+"&role=student")
}
async function grades(){
 const s=await db.from("madrasa_students").select("id").eq("browser_id",uid("student")).maybeSingle();const box=$("#studentGrades");if(!s.data){box.innerHTML="";return}
 const r=await db.from("madrasa_grades").select("*").eq("student_id",s.data.id).order("term",{ascending:false});if(!r.data?.length){box.innerHTML="<div class='class-list empty'>هنوز نمره‌ای ثبت نشده است.</div>";return}
 box.innerHTML=r.data.map(g=>"<div class='grade-row'><span><b>"+subjectName(g.subject)+"</b><small> • ترم "+fa(g.term)+"</small><br><small>"+esc(g.note||"بدون توضیح")+" • "+esc(g.teacher_name)+"</small></span><b>"+g.score+"/۲۰</b></div>").join("")
}
async function initTeacher(){
 const name=nameOf("teacher");$("#teacherNameBadge").textContent=name;$("#changeTeacherName").onclick=()=>{localStorage.removeItem("madrasa_teacher_name");location.reload()};fillSubjects($("#classSubject"));fillSubjects($("#gradeSubject"));
 const d=new Date(Date.now()+30*60000);$("#classStart").value=new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 $("#createClassForm").onsubmit=createClass;$("#gradeForm").onsubmit=saveGrade;loadTeacher()
}
async function createClass(e){
 e.preventDefault();const row={subject:$("#classSubject").value,term:+$("#classTerm").value,session_number:+$("#classSession").value,title:$("#classTitle").value.trim(),teacher_name:nameOf("teacher"),starts_at:new Date($("#classStart").value).toISOString(),duration_minutes:+$("#classDuration").value,status:"scheduled",room_code:"M-"+Math.random().toString(36).slice(2,8).toUpperCase(),teacher_browser_id:uid("teacher")};
 const r=await db.from("madrasa_classes").insert(row);if(r.error)return toast(r.error.message);toast("اتاق درس ساخته شد ✓");e.target.reset();$("#classTerm").value=row.session_number>=32?row.term+1:row.term;$("#classSession").value=row.session_number>=32?1:row.session_number+1;loadTeacher()
}
async function loadTeacher(){
 const [cr,sr]=await Promise.all([db.from("madrasa_classes").select("*").order("starts_at"),db.from("madrasa_students").select("*").order("name")]);const classes=cr.data||[],students=sr.data||[];
 $("#teacherStudentCount").textContent=fa(students.length);$("#teacherClassCount").textContent=fa(classes.length);
 $("#teacherClasses").innerHTML=classes.map(c=>"<div class='class-row'><div><h3>"+esc(c.title)+"</h3><p>"+subjectName(c.subject)+" • ترم "+fa(c.term)+" • جلسه "+fa(c.session_number)+"/۳۲</p><p>"+fmtDate(c.starts_at)+" • استاد "+esc(c.teacher_name)+"</p></div><div class='class-meta'><b>"+(c.status==="live"?"🔴 زنده":"🕒 آماده")+"</b><button class='primary open' data-id='"+c.id+"' data-room='"+c.room_code+"' data-s='"+c.subject+"'>باز کردن اتاق</button></div></div>").join("")||"<div class='class-list empty'>کلاسی ساخته نشده.</div>";
 document.querySelectorAll(".open").forEach(b=>b.onclick=async()=>{await db.from("madrasa_classes").update({status:"live"}).eq("id",b.dataset.id);location.href="class.html?class="+encodeURIComponent(b.dataset.id)+"&room="+encodeURIComponent(b.dataset.room)+"&subject="+encodeURIComponent(b.dataset.s)+"&role=teacher"});
 $("#teacherStudents").innerHTML=students.map(s=>"<div class='student-row'><b>"+esc(s.name)+"</b><small>پایه "+fa(s.grade_level)+"</small><small>"+esc(s.browser_id.slice(0,6))+"</small></div>").join("")||"<div class='class-list empty'>هنوز دانش‌آموزی وارد نشده.</div>";
 $("#gradeStudent").innerHTML=students.map(s=>"<option value='"+s.id+"'>"+esc(s.name)+"</option>").join("")
}
async function saveGrade(e){
 e.preventDefault();const r=await db.from("madrasa_grades").upsert({student_id:$("#gradeStudent").value,subject:$("#gradeSubject").value,term:+$("#gradeTerm").value,score:+$("#gradeScore").value,note:$("#gradeNote").value.trim(),teacher_name:nameOf("teacher")},{onConflict:"student_id,subject,term"});toast(r.error?r.error.message:"نمره ثبت شد ✓");if(!r.error)e.target.reset()
}
let CHANNEL=null,ROLE=null,ME=null,NAME=null,ROOM=null,CLASS=null,STREAM=null,PRESENT=null,PEERS=new Map(),CHAT="group",DOWN=false,LAST=null,BOARD_MODE="draw",TEXT_EDITOR=null,BOARD_OPS=[],RECORDER=null,REC_CHUNKS=[],REC_CAPTURE=null,REC_AUDIO_CTX=null;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function initClass(){
 const q=new URLSearchParams(location.search);const id=q.get("class"),room=q.get("room");ROLE=q.get("role")||"student";ME=uid(ROLE);NAME=nameOf(ROLE);ROOM=room;document.body.classList.toggle("teacher-view",ROLE==="teacher");$("#backPortal").href=ROLE==="teacher"?"teacher.html":"student.html";
 const r=await db.from("madrasa_classes").select("*").eq("id",id).single();if(r.error)return toast("کلاس پیدا نشد");CLASS=r.data;$("#roomTitle").textContent="• "+subjectName(CLASS.subject)+" • "+CLASS.title+" • جلسه "+fa(CLASS.session_number)+"/۳۲";if(ROLE==="teacher")await db.from("madrasa_classes").update({status:"live"}).eq("id",id);else await markAttendance(id);
 setupBoard();setupChat();setupLeave();$("#clearBoard").onclick=clearBoard;$("#shareScreenBtn").onclick=togglePresentation;$("#recordBtn").onclick=toggleRecording;$("#drawMode").onclick=()=>setBoardMode("draw");$("#textMode").onclick=()=>setBoardMode("text");$("#micBtn").onclick=toggleMic;$("#speakerBtn").onclick=()=>{$("#remoteAudio").muted=!$("#remoteAudio").muted;$("#speakerBtn").textContent=$("#remoteAudio").muted?"🔇 صدا خاموش":"🔊 صدا"};await realtime()
}
async function markAttendance(id){const s=await ensureStudent(NAME);if(s)await db.from("madrasa_attendance").upsert({class_id:id,student_id:s.id},{onConflict:"class_id,student_id"})}
async function realtime(){
 CHANNEL=db.channel("madrasa-"+ROOM,{config:{broadcast:{self:false,ack:true},presence:{key:ME}}});
 CHANNEL.on("presence",{event:"sync"},presence).on("presence",{event:"join"},presence).on("presence",{event:"leave"},presence);
 CHANNEL.on("broadcast",{event:"signal"},x=>signal(x.payload)).on("broadcast",{event:"board"},x=>boardEvent(x.payload)).on("broadcast",{event:"chat"},x=>chatEvent(x.payload));
 await new Promise((ok,bad)=>CHANNEL.subscribe(async st=>{if(st==="SUBSCRIBED"){await CHANNEL.track({name:NAME,role:ROLE});setTimeout(()=>send({type:"hello",from:ME,to:"teacher"}),350);ok()}if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"){toast("اتصال کلاس قطع شد؛ در حال اتصال دوباره...");setTimeout(reconnectRealtime,1500)}if(st==="CLOSED"){setTimeout(reconnectRealtime,1000)}}))
}
async function reconnectRealtime(){try{if(CHANNEL)await db.removeChannel(CHANNEL)}catch{}CHANNEL=null;try{await realtime();toast("اتصال کلاس برقرار شد ✓")}catch(e){setTimeout(reconnectRealtime,2500)}}
function presence(){
 const all=[];Object.entries(CHANNEL.presenceState()).forEach(([id,a])=>a.forEach(x=>all.push({id,...x})));$("#onlineCount").textContent=fa(all.length);
 $("#participants").innerHTML=all.map(p=>"<div class='participant'><div class='avatar'>"+(p.role==="teacher"?"🧑‍🏫":"🎓")+"</div><div><b>"+esc(p.name)+"</b><small>"+(p.role==="teacher"?"معلم":"دانش‌آموز")+(p.id===ME?" (شما)":"")+"</small></div></div>").join("");
 if(ROLE==="teacher")$("#studentMicControls").innerHTML=all.filter(p=>p.role==="student").map(p=>"<button class='mic-open' data-id='"+p.id+"'>🎙️ اجازه صحبت به "+esc(p.name)+"</button>").join("");if(ROLE==="teacher")document.querySelectorAll(".mic-open").forEach(b=>b.onclick=()=>send({type:"open-mic",from:ME,to:b.dataset.id}))
}
async function send(x){if(CHANNEL)await CHANNEL.send({type:"broadcast",event:"signal",payload:x})}
function peer(id){
 if(PEERS.has(id))return PEERS.get(id);const p=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun.cloudflare.com:3478"}]});
 p.onicecandidate=e=>{if(e.candidate)send({type:"ice",from:ME,to:id,candidate:e.candidate})};p.ontrack=e=>{if(e.track.kind==="video"){const v=$("#screenVideo");v.srcObject=e.streams[0]||new MediaStream([e.track]);v.classList.add("show");v.play().catch(()=>{})}else{$("#remoteAudio").srcObject=e.streams[0]||new MediaStream([e.track]);$("#audioState").textContent="فعال";$("#remoteAudio").play().catch(()=>{})}};PEERS.set(id,p);return p
}
async function teacherOffer(id){
 const p=peer(id);if(STREAM)STREAM.getTracks().forEach(t=>{if(!p.getSenders().some(s=>s.track&&s.track.kind===t.kind))p.addTrack(t,STREAM)});if(PRESENT){const t=PRESENT.getVideoTracks()[0];if(t&&!p.getSenders().some(s=>s.track&&s.track.kind==="video"))p.addTrack(t,PRESENT)}if(!STREAM&&!p.getTransceivers().some(t=>t.receiver.track&&t.receiver.track.kind==="audio"))p.addTransceiver("audio",{direction:"recvonly"});const o=await p.createOffer();await p.setLocalDescription(o);await send({type:"offer",from:ME,to:id,sdp:p.localDescription})
}
async function signal(m){
 if(!m||(m.to&&m.to!==ME))return;
 if(m.type==="hello"&&ROLE==="teacher"){await send({type:"board-state",from:ME,to:m.from,ops:BOARD_OPS});return teacherOffer(m.from);}
 if(m.type==="board-state"&&ROLE==="student"){BOARD_OPS=m.ops||[];redrawBoard();return}
 if(m.type==="offer"&&ROLE==="student"){const p=peer(m.from);await p.setRemoteDescription(m.sdp);const a=await p.createAnswer();await p.setLocalDescription(a);return send({type:"answer",from:ME,to:m.from,sdp:p.localDescription})}
 if(m.type==="offer"&&ROLE==="teacher"){const p=peer(m.from);await p.setRemoteDescription(m.sdp);const a=await p.createAnswer();await p.setLocalDescription(a);return send({type:"answer",from:ME,to:m.from,sdp:p.localDescription})}
 if(m.type==="answer"){return peer(m.from).setRemoteDescription(m.sdp)}
 if(m.type==="ice"){try{await peer(m.from).addIceCandidate(m.candidate)}catch{}}
 if(m.type==="open-mic"&&ROLE==="student"){toast("معلم اجازه صحبت داد؛ میکروفون را بزن.");$("#micBtn").dataset.allowed="1"}
}
async function getMic(){try{STREAM=await navigator.mediaDevices.getUserMedia({audio:true});$("#micBtn").textContent="🎙️ میکروفون روشن";return true}catch(e){toast("دسترسی Microphone را فعال کن.");return false}}
async function toggleMic(){
 if(ROLE==="student"&&$("#micBtn").dataset.allowed!=="1")return toast("اول از معلم اجازه صحبت بگیر.");
 if(!STREAM){if(!(await getMic()))return;if(ROLE==="student"){const p=peer("teacher");STREAM.getTracks().forEach(t=>p.addTrack(t,STREAM));const o=await p.createOffer();await p.setLocalDescription(o);await send({type:"offer",from:ME,to:"teacher",sdp:p.localDescription})}else for(const id of PEERS.keys())await teacherOffer(id)}
 else{STREAM.getAudioTracks().forEach(t=>t.enabled=!t.enabled);$("#micBtn").textContent=STREAM.getAudioTracks()[0].enabled?"🎙️ میکروفون روشن":"🔇 میکروفون خاموش"}
}
function setupBoard(){
 const c=$("#whiteboard"),x=c.getContext("2d"),resize=()=>{const r=c.getBoundingClientRect(),d=devicePixelRatio||1,old=document.createElement("canvas");old.width=c.width;old.height=c.height;if(old.width)old.getContext("2d").drawImage(c,0,0);c.width=r.width*d;c.height=r.height*d;x.setTransform(d,0,0,d,0,0);x.lineWidth=3;x.lineCap="round";if(old.width)x.drawImage(old,0,0,old.width/d,old.height/d)};new ResizeObserver(resize).observe(c);resize();const pt=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};c.onpointerdown=e=>{if(BOARD_MODE==="text"){openTextEditor(pt(e));return}DOWN=true;LAST=pt(e);c.setPointerCapture(e.pointerId)};c.onpointermove=e=>{if(!DOWN||BOARD_MODE!=="draw")return;const p=pt(e);line(x,LAST,p);LAST=p};c.onpointerup=async e=>{if(!DOWN)return;DOWN=false;const p=pt(e);line(x,LAST,p);const op={kind:"line",a:LAST,b:p};BOARD_OPS.push(op);await CHANNEL.send({type:"broadcast",event:"board",payload:op});LAST=null};c.onpointercancel=()=>{DOWN=false;LAST=null};document.addEventListener("keydown",e=>{if(e.target?.tagName==="INPUT")return;if(e.key.toLowerCase()==="g"){e.preventDefault();setBoardMode("text")}if(e.key.toLowerCase()==="w"){e.preventDefault();setBoardMode("draw")}})}
function setBoardMode(mode){BOARD_MODE=mode;document.body.classList.toggle("text-mode",mode==="text");$("#drawMode").classList.toggle("active",mode==="draw");$("#textMode").classList.toggle("active",mode==="text");$("#boardHint").textContent=mode==="text"?"حالت تایپ فعال است • روی تخته کلیک کن • Enter ثبت • W خروج":"رسم آزاد • برای تایپ G • خروج از تایپ با W";if(mode==="draw")closeTextEditor()}
function openTextEditor(p){closeTextEditor();const box=$("#textEditor"),input=$("#boardTextInput"),stage=$("#boardStage");box.classList.add("show");box.style.left=Math.max(4,Math.min(p.x,stage.clientWidth-225))+"px";box.style.top=Math.max(4,Math.min(p.y,stage.clientHeight-45))+"px";input.value="";TEXT_EDITOR={x:p.x,y:p.y};input.focus();input.onkeydown=async e=>{if(e.key==="Enter"){e.preventDefault();const t=input.value.trim(),pos=TEXT_EDITOR;if(t){drawText(pos.x,pos.y,t);const op={kind:"text",x:pos.x,y:pos.y,text:t};BOARD_OPS.push(op);await CHANNEL.send({type:"broadcast",event:"board",payload:op})}closeTextEditor()}else if(e.key==="Escape")closeTextEditor()}}
function closeTextEditor(){const box=$("#textEditor"),input=$("#boardTextInput");if(!box)return;box.classList.remove("show");input.value="";input.onkeydown=null;TEXT_EDITOR=null}
function drawText(x,y,text){const c=$("#whiteboard"),ctx=c.getContext("2d");ctx.fillStyle="#17324a";ctx.font="700 22px Vazirmatn, Arial";ctx.textBaseline="top";ctx.fillText(text,x,y)}
function line(x,a,b){x.strokeStyle="#17324a";x.lineWidth=3;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}
function redrawBoard(){const c=$("#whiteboard"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);for(const m of BOARD_OPS){if(m.kind==="line")line(ctx,m.a,m.b);if(m.kind==="text")drawText(m.x,m.y,m.text)}}
function boardEvent(m){if(!m)return;if(m.kind==="clear"){BOARD_OPS=[];redrawBoard();return}BOARD_OPS.push(m);if(m.kind==="line")line($("#whiteboard").getContext("2d"),m.a,m.b);if(m.kind==="text")drawText(m.x,m.y,m.text)}
async function clearBoard(){closeTextEditor();BOARD_OPS=[];const c=$("#whiteboard");c.getContext("2d").clearRect(0,0,c.width,c.height);await CHANNEL.send({type:"broadcast",event:"board",payload:{kind:"clear"}})}
async function togglePresentation(){
 if(ROLE!=="teacher")return;
 if(PRESENT)return stopPresentation();
 if(!navigator.mediaDevices?.getDisplayMedia)return toast("مرورگر شما این قابلیت را پشتیبانی نمی‌کند.");
 try{
  PRESENT=await navigator.mediaDevices.getDisplayMedia({video:{cursor:"always"},audio:true});
  const v=$("#screenVideo");v.srcObject=PRESENT;v.classList.add("show");$("#shareScreenBtn").textContent="⏹️ توقف اشتراک صفحه";
  const t=PRESENT.getVideoTracks()[0];if(t)t.onended=stopPresentation;
  for(const id of PEERS.keys())await teacherOffer(id);
  toast("صفحه انتخاب‌شده در کلاس پخش شد ✓");
 }catch(e){PRESENT=null;toast("اشتراک صفحه لغو شد یا اجازه داده نشد.")}
}
async function stopPresentation(){
 if(!PRESENT)return;
 PRESENT.getTracks().forEach(t=>t.stop());PRESENT=null;
 const v=$("#screenVideo");v.srcObject=null;v.classList.remove("show");
 if($("#shareScreenBtn"))$("#shareScreenBtn").textContent="🖥️ اشتراک صفحه";
 for(const [id,p] of PEERS){
  const sender=p.getSenders().find(s=>s.track&&s.track.kind==="video");
  if(sender){p.removeTrack(sender);try{const o=await p.createOffer();await p.setLocalDescription(o);await send({type:"offer",from:ME,to:id,sdp:p.localDescription})}catch{}}
 }
}
function setupChat(){document.querySelectorAll(".chat-tabs button").forEach(b=>b.onclick=()=>{CHAT=b.dataset.chat;document.querySelectorAll(".chat-tabs button").forEach(x=>x.classList.toggle("active",x===b));loadChat()});$("#chatForm").onsubmit=async e=>{e.preventDefault();const inp=$("#chatInput"),msg=inp.value.trim();if(!msg)return;inp.value="";const m={room_code:ROOM,subject:CLASS.subject,sender_id:ME,sender_name:NAME,role:ROLE,message:msg,target_id:CHAT==="teacher"&&ROLE==="student"?"teacher":null};await db.from("madrasa_messages").insert(m);await CHANNEL.send({type:"broadcast",event:"chat",payload:m});addChat(m)};loadChat()}
async function loadChat(){let q=db.from("madrasa_messages").select("*").eq("room_code",ROOM).order("created_at",{ascending:true});if(CHAT==="teacher"&&ROLE==="student")q=q.or("target_id.eq.teacher,sender_id.eq."+ME);else if(CHAT==="group")q=q.is("target_id",null);const r=await q;$("#chatMessages").innerHTML="";(r.data||[]).forEach(addChat)}
function addChat(m){if(CHAT==="group"&&m.target_id)return;if(CHAT==="teacher"&&ROLE==="student"&&m.target_id!=="teacher"&&m.sender_id!==ME)return;const e=document.createElement("div");e.className="msg"+(m.sender_id===ME?" mine":"");e.innerHTML="<span class='meta'>"+esc(m.sender_name)+" • "+(m.role==="teacher"?"معلم":"دانش‌آموز")+"</span>"+esc(m.message);$("#chatMessages").appendChild(e);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight}
function chatEvent(m){if(m)addChat(m)}
async function toggleRecording(){
 if(ROLE!=="teacher")return;
 if(RECORDER&&RECORDER.state!=="inactive"){RECORDER.stop();return}
 if(!navigator.mediaDevices?.getDisplayMedia||!window.MediaRecorder)return toast("مرورگر شما ضبط جلسه را پشتیبانی نمی‌کند.");
 try{
  toast("برای ضبط، تب یا پنجره کلاس را انتخاب کن.");
  const display=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:30},audio:true});
  REC_CAPTURE=display;
  const tracks=[...display.getVideoTracks()];
  let audioTracks=[];
  if(display.getAudioTracks().length)audioTracks.push(...display.getAudioTracks());
  if(STREAM?.getAudioTracks().length)audioTracks.push(...STREAM.getAudioTracks().filter(t=>t.enabled));
  let outAudio=null;
  if(audioTracks.length){
   REC_AUDIO_CTX=new AudioContext();
   const dest=REC_AUDIO_CTX.createMediaStreamDestination();
   for(const t of audioTracks){try{REC_AUDIO_CTX.createMediaStreamSource(new MediaStream([t])).connect(dest)}catch{}}
   outAudio=dest.stream.getAudioTracks()[0];
  }
  const recordStream=new MediaStream(tracks);
  if(outAudio)recordStream.addTrack(outAudio);
  const types=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];
  const mime=types.find(x=>MediaRecorder.isTypeSupported(x))||"";
  REC_CHUNKS=[];RECORDER=new MediaRecorder(recordStream,mime?{mimeType:mime}:{});
  RECORDER.ondataavailable=e=>{if(e.data.size)REC_CHUNKS.push(e.data)};
  RECORDER.onstop=()=>{
   const blob=new Blob(REC_CHUNKS,{type:RECORDER.mimeType||"video/webm"}),url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download="madrasa-"+(CLASS?.session_number||"class")+"-"+Date.now()+".webm";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
   try{REC_CAPTURE?.getTracks().forEach(t=>t.stop());REC_AUDIO_CTX?.close()}catch{}
   REC_CAPTURE=null;REC_AUDIO_CTX=null;REC_CHUNKS=[];$("#recordBtn").textContent="🔴 ضبط جلسه";$("#recordBtn").classList.remove("recording");toast("ضبط در فایل شخصی معلم ذخیره شد؛ برای دانش‌آموزان ارسال نشد ✓");
  };
  display.getVideoTracks()[0].onended=()=>{if(RECORDER&&RECORDER.state!=="inactive")RECORDER.stop()};
  RECORDER.start(1000);$("#recordBtn").textContent="⏹️ توقف ضبط";$("#recordBtn").classList.add("recording");toast("ضبط جلسه شروع شد ✓");
 }catch(e){REC_CAPTURE=null;toast("ضبط لغو شد یا اجازه دسترسی داده نشد.")}
}
function setupLeave(){$("#leaveBtn").onclick=async()=>{if(ROLE==="teacher"&&RECORDER&&RECORDER.state!=="inactive")RECORDER.stop();if(ROLE==="teacher"&&PRESENT)await stopPresentation();if(ROLE==="teacher"&&CLASS)await db.from("madrasa_classes").update({status:"ended"}).eq("id",CLASS.id);if(STREAM)STREAM.getTracks().forEach(t=>t.stop());if(CHANNEL)await db.removeChannel(CHANNEL);location.href=ROLE==="teacher"?"teacher.html":"student.html"}}
async function boot(){const p=document.body.dataset.page;if(p==="student")return initStudent();if(p==="teacher")return initTeacher();if(p==="class")return initClass()}boot().catch(e=>{console.error(e);toast("خطا در اجرای صفحه؛ دوباره تلاش کن.")});