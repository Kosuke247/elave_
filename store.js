/* ชั้นข้อมูลแบบไม่ใช้เซิร์ฟเวอร์: เก็บใน localStorage ของเบราว์เซอร์ (เปิดด้วย Live Server ได้เลย)
   หน้าที่ของไฟล์นี้เหมือนกับเวอร์ชันที่มีเซิร์ฟเวอร์ ถ้าอยากต่อฐานข้อมูลจริงทีหลังก็สลับไฟล์นี้ได้ */
const Store=(()=>{
const K='exitreq.local.v1',bk=()=>new Date(Date.now()+7*36e5).toISOString(),today=()=>bk().slice(0,10),now=()=>bk().slice(0,16).replace('T',' ');
const day=n=>new Date(Date.now()+7*36e5+n*864e5).toISOString().slice(0,10);
const TYPES=['ไปพบแพทย์','ธุระครอบครัว','ธุระส่วนตัว','กิจกรรม/แข่งขัน','อื่น ๆ'],ROLES=['student','teacher','admin'];
let d=null;
const save=()=>{try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}};
const dead=r=>['rejected','cancelled'].includes(r.status),E=m=>{throw new Error(m)};
const hash=async p=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('exitreq:'+p));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return'plain:'+p}};
const pub=u=>u&&{id:u.id,u:u.u,name:u.name,role:u.role,cls:u.cls,no:u.no};
const mk=(id,uid,name,cls,type,n,out,back,reason,tel,status,lg)=>({id,uid,name,cls,type,date:day(n),out,back,reason,tel,status,created:now(),log:[['ระบบ','ส่งคำขอ']].concat(lg).map(x=>({by:x[0],txt:x[1],t:now()}))});
const demo=()=>[
mk('R004','s2','มาลี สุขสันต์','ม.5/2','ธุระครอบครัว',2,'11:30','15:00','ผู้ปกครองมารับไปงานญาติ','089-222-3333','wait_t',[]),
mk('R003','s1','สมชาย ใจดี','ม.5/2','ธุระส่วนตัว',3,'13:00','16:00','ไปต่อบัตรประชาชนที่อำเภอ','081-111-1111','wait_a',[['อาจารย์ที่ปรึกษา','อนุมัติ']]),
mk('R002','s3','ธนพล แสงทอง','ม.4/1','ไปพบแพทย์',-3,'09:00','12:00','ตรวจสุขภาพประจำปี','086-444-5555','rejected',[['อาจารย์ที่ปรึกษา','ไม่อนุมัติ: ตรงกับวันสอบ']]),
mk('R001','s1','สมชาย ใจดี','ม.5/2','ไปพบแพทย์',-5,'10:00','14:00','นัดตรวจฟันที่คลินิก','081-111-1111','approved',[['อาจารย์ที่ปรึกษา','อนุมัติ'],['ฝ่ายปกครอง','อนุมัติ']])];
async function seed(){const h=await hash('1234');
d={sess:null,seq:4,reqs:demo(),users:[['s1','student','สมชาย ใจดี','student','ม.5/2','12345'],['s2','malee','มาลี สุขสันต์','student','ม.5/2','12346'],['s3','thanon','ธนพล แสงทอง','student','ม.4/1','22001'],['t1','teacher','อ.สุดา รักเรียน','teacher','ม.5/2',''],['t2','teacher2','อ.วิชัย ใจเย็น','teacher','ม.4/1',''],['a1','admin','ฝ่ายปกครอง','admin','','']].map(x=>({id:x[0],u:x[1],pw:h,name:x[2],role:x[3],cls:x[4],no:x[5]}))};save()}
const me=()=>d&&d.users.find(a=>a.id===d.sess);
const need=r=>{const u=me();if(!u||!r.includes(u.role))E('ไม่มีสิทธิ์');return u};
return{
async init(){if(!d){try{d=JSON.parse(localStorage.getItem(K))}catch(e){}if(!d||!d.reqs)await seed()}},
today,
async login(u,p){const x=d.users.find(a=>a.u===String(u).trim().toLowerCase());if(!x||x.pw!==await hash(String(p)))E('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');d.sess=x.id;save()},
async logout(){if(d){d.sess=null;save()}},
user:()=>pub(me()),all:()=>d.reqs,get:id=>d.reqs.find(r=>r.id===id),users:()=>me()&&me().role==='admin'?d.users.map(pub):[],
visible:u=>d.reqs.filter(r=>u.role==='admin'||(u.role==='teacher'?r.cls===u.cls:r.uid===u.id)),
pending:u=>d.reqs.filter(r=>u.role==='teacher'?r.cls===u.cls&&r.status==='wait_t':u.role==='admin'&&r.status==='wait_a'),
monthCount:uid=>d.reqs.filter(r=>r.uid===uid&&r.date.slice(0,7)===today().slice(0,7)&&!dead(r)).length,
async create(f){const u=need(['student']),t=String(f.type||''),dt=String(f.date||''),o=String(f.out||''),b=String(f.back||''),r=String(f.reason||'').trim().slice(0,300),tel=String(f.tel||'').trim();
if(!TYPES.includes(t)||!dt||!o||!b||!r||!tel)E('กรุณากรอกข้อมูลให้ครบทุกช่อง');
if(dt<today())E('ไม่สามารถเลือกวันที่ย้อนหลังได้');if(b<=o)E('เวลากลับต้องหลังเวลาออก');
if(!/^0\d{8,9}$/.test(tel.replace(/-/g,'')))E('เบอร์ผู้ปกครองไม่ถูกต้อง');if(!f.ack)E('กรุณายืนยันว่าผู้ปกครองรับทราบ');
if(d.reqs.some(x=>x.uid===u.id&&x.date===dt&&!dead(x)))E('มีคำขอของวันดังกล่าวที่ยังใช้งานอยู่แล้ว');
if(d.reqs.filter(x=>x.uid===u.id&&x.date.slice(0,7)===dt.slice(0,7)&&!dead(x)).length>=3)E('ครบสิทธิ์ 3 ครั้งต่อเดือนแล้ว');
const id='R'+String(++d.seq).padStart(3,'0'),q=mk(id,u.id,u.name,u.cls,t,0,o,b,r,tel,'wait_t',[]);q.date=dt;d.reqs.unshift(q);save();return{id}},
async act(id,ok,note){const u=need(['teacher','admin']),r=d.reqs.find(x=>x.id===id);if(!r)E('ไม่พบคำขอ');note=String(note||'').slice(0,200);let by,ns;
if(u.role==='teacher'&&r.cls===u.cls&&r.status==='wait_t'){by='อาจารย์ที่ปรึกษา';ns=ok?'wait_a':'rejected'}
else if(u.role==='admin'&&(r.status==='wait_a'||(!ok&&r.status==='wait_t'))){by='ฝ่ายปกครอง';ns=ok?'approved':'rejected'}
else E('ไม่มีสิทธิ์ดำเนินการ หรือคำขอถูกดำเนินการไปแล้ว');
r.status=ns;r.log.push({by,txt:(ok?'อนุมัติ':'ไม่อนุมัติ')+(note?': '+note:''),t:now()});save();return{msg:ok?'บันทึกการอนุมัติแล้ว':'บันทึกการไม่อนุมัติแล้ว'}},
async cancel(id){const u=need(['student']),r=d.reqs.find(x=>x.id===id&&x.uid===u.id);if(!r||!['wait_t','wait_a'].includes(r.status))E('ยกเลิกคำขอนี้ไม่ได้');
r.status='cancelled';r.log.push({by:'ผู้ขอ',txt:'ยกเลิกคำขอ',t:now()});save()},
async reset(){need(['admin']);d.reqs=demo();d.seq=4;save()},
async addUser(f){need(['admin']);const u=String(f.u||'').trim().toLowerCase(),name=String(f.name||'').trim(),p=String(f.p||'');
if(!/^[a-z0-9_]{3,20}$/.test(u))E('ชื่อผู้ใช้ใช้ a-z 0-9 _ ยาว 3-20 ตัว');
if(!name||p.length<4||!ROLES.includes(f.role))E('กรอกชื่อ บทบาท และรหัสผ่าน (4 ตัวขึ้นไป) ให้ครบ');
if(f.role!=='admin'&&!String(f.cls||'').trim())E('กรุณาระบุห้อง');
if(d.users.some(x=>x.u===u))E('ชื่อผู้ใช้นี้ถูกใช้แล้ว');
d.users.push({id:'u'+Math.random().toString(16).slice(2,10),u,pw:await hash(p),name,role:f.role,cls:f.role==='admin'?'':String(f.cls).trim(),no:String(f.no||'').trim()});save()},
async delUser(id){const u=need(['admin']);if(id===u.id)E('ลบบัญชีตัวเองไม่ได้');d.users=d.users.filter(x=>x.id!==id);save()},
async resetPw(id,p){need(['admin']);p=String(p||'');if(p.length<4)E('รหัสผ่านอย่างน้อย 4 ตัว');const x=d.users.find(a=>a.id===id);if(x){x.pw=await hash(p);save()}}}})();
