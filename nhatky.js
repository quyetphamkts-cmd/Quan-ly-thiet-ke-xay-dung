/* Phiên bản, ghi chú phát hành và nhật ký sử dụng.
   Nạp trước các file khác để bắt được cả lỗi lúc khởi động.
   Nhật ký chỉ lưu trong máy (500 dòng gần nhất), không gửi đi đâu, không ghi nội dung khách hàng, số tiền, email, số điện thoại. */
(function(){
/* Phiên bản: x.y.z (chính thức) hoặc x.y.z-beta.N (thử nghiệm, trước bản chính thức x.y.z).
   Beta tăng dần 1 → 99; sau beta 99 thì tăng số cuối và quay về beta 1 (1.0.1-beta.99 → 1.0.2-beta.1).
   Không quay về beta 1 của cùng số. Thứ tự: 1.0.1-beta.99 < 1.0.1 < 1.0.2-beta.1. Dùng tools/bump.py để tự nâng số. */
var APP_VER='1.0.1-beta.1';
function verLabel(v){return String(v).replace(/-beta\.(\d+)$/,' beta $1')}
function vparse(v){var m=String(v).match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?/)||[]; return [+m[1]||0,+m[2]||0,+m[3]||0,m[4]!=null?+m[4]:Infinity]}
function vcmp(a,b){var x=vparse(a),y=vparse(b); for(var i=0;i<4;i++){if(x[i]!==y[i]) return x[i]>y[i]?1:-1} return 0}

/* Ghi chú phát hành, mới nhất ở trên. Mỗi lần sửa app: tăng APP_VER và thêm một mục ở đầu danh sách. */
var CHANGELOG=[
 {v:'1.0.1-beta.1',d:'02/11/2026',items:[
  'Bắt đầu đánh số phiên bản kiểu x.y.z beta N như Deep Flow: bản thử nghiệm 1.0.1 beta 1, 2, 3… trước bản chính thức 1.0.1.',
  'Thêm mục Phiên bản và nhật ký (nhóm Công ty): xem phiên bản đang chạy, ghi chú phát hành, nhật ký sử dụng.',
  'Nhật ký ghi lại các thao tác chính và mọi lỗi phát sinh, lưu trong máy, có nút Sao chép để gửi khi cần sửa lỗi.',
  'Có lỗi mới thì mục Phiên bản và nhật ký hiện dấu đỏ.',
  'Bản cài Android 1.0.1 beta 1: báo phiên bản bản cài trong mục này.']},
 {v:'1.0.0-beta.4',d:'02/11/2026',items:[
  'Kiến thức: bỏ cấp Thư viện thi công, các mục (Checklist, Quy trình, Lỗi, Sự cố, Chất lượng, Nghiệm thu, Tra cứu, Nguồn) nằm thẳng trên menu.',
  'Bấm nhóm trên menu là mở luôn mục đầu của nhóm.',
  'Mở một đầu mục thì các đầu mục khác cùng danh sách tự thu gọn.',
  'Có bản cài Android (APK) đầu tiên: chọn file, lưu file tải về vào Download/SoCongTruong, in hoặc lưu PDF.']},
 {v:'1.0.0-beta.3',d:'02/11/2026',items:[
  'Tra cứu tài liệu gốc: nạp file .md hoặc .zip vào trình duyệt, tìm toàn văn theo trang, đánh dấu trang đã đối chiếu bản gốc.',
  'Mục lục 3 tập Sổ tay xử lý sự cố trong mục Sự cố, bấm để mở đúng trang.']},
 {v:'1.0.0-beta.2',d:'02/11/2026',items:[
  'Đính kèm file cho báo giá và hợp đồng.',
  'Nhập báo giá từ file Excel.',
  'Mẫu hợp đồng Word có thẻ tự điền thông tin.']},
 {v:'1.0.0-beta.1',d:'02/11/2026',items:[
  'Bản đầu: quản lý dự án thiết kế và thi công, tiến độ, nhật ký, vật tư, ngân sách, phê duyệt, vấn đề.',
  'Thư viện thi công: checklist giám sát 20 giai đoạn, quy trình, lỗi thường gặp, nghiệm thu và lấy mẫu.',
  'Biểu mẫu hợp đồng, biên bản, báo giá in được.']}
];

var KEY='sct_log', SEEN='sct_logSeen', MAX=500, buf=null, tmr=0, live=null;
function load(){if(!buf){try{buf=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){buf=[]} if(!Array.isArray(buf)) buf=[]} return buf}
function saveNow(){try{localStorage.setItem(KEY,JSON.stringify(load()))}catch(e){try{buf=load().slice(-200); localStorage.setItem(KEY,JSON.stringify(buf))}catch(_){}}}
function scrub(x){
  return String(x==null?'':x)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'[email]')
    .replace(/(\+?84|0)[\s.]?\d{2,3}[\s.]?\d{3}[\s.]?\d{3,4}/g,'[sđt]')
    .replace(/AIza[0-9A-Za-z_\-]{20,}|sk-(ant-)?[A-Za-z0-9_\-]{16,}/g,'[key]')
    .replace(/data:[^,\s]{0,60},[A-Za-z0-9+\/=]{40,}/g,'[dữ liệu file]')
    .slice(0,600);
}
/* lv: ev (thao tác), info (thông báo), warn (cảnh báo), err (lỗi) */
function log(lv,msg,extra){
  try{
    var b=load(), e={t:Date.now(),l:lv,m:scrub(msg)}; if(extra) e.x=scrub(extra);
    var last=b[b.length-1];
    if(last&&last.m===e.m&&last.l===e.l&&e.t-last.t<60000){last.n=(last.n||1)+1; last.t=e.t}
    else b.push(e);
    if(b.length>MAX) b.splice(0,b.length-MAX);
    clearTimeout(tmr); tmr=setTimeout(saveNow,1500);
    if(live) live(e);
  }catch(_){}
}
window.addEventListener('error',function(e){
  if(e&&e.message) log('err',e.message,(String(e.filename||'').split('/').pop())+':'+e.lineno+':'+e.colno+(e.error&&e.error.stack?'\n'+String(e.error.stack).split('\n').slice(1,4).join('\n'):''));
});
window.addEventListener('unhandledrejection',function(e){
  var r=e&&e.reason; log('err','Lỗi chưa xử lý: '+(r&&r.message||r),r&&r.stack?String(r.stack).split('\n').slice(1,4).join('\n'):'');
});
(function(){
  var cw=console.warn, ce=console.error;
  function txt(a){return Array.prototype.map.call(a,function(x){return x&&x.message||(typeof x==='object'?(function(){try{return JSON.stringify(x)}catch(_){return String(x)}})():x)}).join(' ')}
  console.warn=function(){log('warn',txt(arguments)); return cw.apply(console,arguments)};
  console.error=function(){log('err',txt(arguments)); return ce.apply(console,arguments)};
})();
document.addEventListener('visibilitychange',function(){log('ev',document.hidden?'↘ Vào nền':'↗ Mở lại app'); if(document.hidden) saveNow()});
window.addEventListener('pagehide',saveNow);

function nativeVer(){try{if(window.AndroidApp&&AndroidApp.version) return verLabel(String(AndroidApp.version()).replace(/ \(.*$/,''))}catch(e){} return window.AndroidApp?'bản cài đầu tiên':''}
function platform(){var a=(navigator.userAgent.match(/Android [\d.]+/)||[''])[0]; return (nativeVer()?'APK '+nativeVer():'Trình duyệt')+(a?' · '+a:'')}
function seenAt(){try{return +localStorage.getItem(SEEN)||0}catch(e){return 0}}
function markSeen(){try{localStorage.setItem(SEEN,String(Date.now()))}catch(e){}}
function newErrors(){var s=seenAt(); return load().filter(function(e){return e.l==='err'&&e.t>s}).length}
function fmt(t,withDate){var d=new Date(t); return d.toLocaleString('vi-VN',withDate?{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}:{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function text(filter){
  var head='Sổ Công Trường '+verLabel(APP_VER)+' · '+platform()+' · '+fmt(Date.now(),true)+'\n'+navigator.userAgent;
  return head+'\n'+load().slice().reverse().filter(function(e){return filter!=='err'||e.l==='err'||e.l==='warn'}).map(function(e){
    return fmt(e.t)+' ['+e.l+'] '+e.m+(e.n>1?' (×'+e.n+')':'')+(e.x?'\n    '+e.x.replace(/\n/g,'\n    '):'');
  }).join('\n');
}
function clear(){buf=[]; saveNow()}

window.SCT={ver:APP_VER, label:verLabel, vcmp:vcmp, changelog:CHANGELOG, log:log, list:load, save:saveNow, text:text, clear:clear,
  newErrors:newErrors, markSeen:markSeen, nativeVer:nativeVer, platform:platform, fmt:fmt,
  onLive:function(f){live=f}};
log('ev','🚀 Mở app · '+verLabel(APP_VER)+' · '+platform());
})();
