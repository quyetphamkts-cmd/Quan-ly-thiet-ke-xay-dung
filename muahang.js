/* Mua hàng theo công trình: nhà cung cấp của từng công trình, bảng giá (có lịch sử), phiếu mua hàng,
   các lần thanh toán, công nợ; chèn ảnh chụp / PDF / Excel đơn giá và nhờ AI đọc, tổng hợp thành bảng.
   Dữ liệu trong S: psup (liên kết công trình – nhà cung cấp), pdocs (tệp), prices (bảng giá), buys (mua hàng), pays (thanh toán).
   Khóa AI lưu riêng trong máy (localStorage 'sct_ai'), không nằm trong dữ liệu dự án. */
(function(){
var A=function(){return window.SCTAPP};
var mh={tab:'ct',sup:'',sub:'gia',draft:null,review:null,busy:'',sel:{},arm:'',hist:'',payDraft:null,q:''};
var AIK='sct_ai';
var DOCT={'bao-gia':'Báo giá, bảng đơn giá','phieu':'Phiếu giao hàng, hóa đơn'};

function S(){return A().S}
function esc(s){return A().esc(s)}
function vnd(n){return A().vnd(n)}
function norm(s){return A().norm(s)}
function arr(k){var s=S(); if(!s[k]) s[k]=[]; return s[k]}
function num(v){
  if(typeof v==='number') return isFinite(v)?v:0;
  var s=String(v==null?'':v).replace(/[\s đ₫]/g,'').replace(/[^\d.,\-]/g,'');
  if(!s||s==='-') return 0;
  var d=s.indexOf('.')>=0, c=s.indexOf(',')>=0;
  if(d&&c){s=s.lastIndexOf('.')>s.lastIndexOf(',')?s.replace(/,/g,''):s.replace(/\./g,'').replace(',','.')}
  else if(d){if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'')}
  else if(c){s=/^-?\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.')}
  var n=parseFloat(s); return isNaN(n)?0:n;
}
function fq(n){return (Math.round(n*1000)/1000).toLocaleString('vi-VN')}
function key(name,unit){return norm(name).replace(/\s+/g,' ').trim()+'|'+norm(unit).trim()}
function pid(){return S().pid}
function sup(id){return (S().partners||[]).filter(function(x){return x.id===id})[0]}
function fmtD(d){return d?A().fmtD(d):''}
function today(){return A().TODAY}
function log(m){if(window.SCT) SCT.log('ev',m)}
function rerender(keep){var y=window.scrollY; A().render(); if(keep) window.scrollTo(0,y)}

/* ---------- số liệu ---------- */
function linked(){
  var p=pid(), ids={};
  arr('psup').forEach(function(l){if(l.pid===p) ids[l.sup]=1});
  ['prices','buys','pays','pdocs'].forEach(function(k){arr(k).forEach(function(r){if(r.pid===p) ids[r.sup]=1})});
  return Object.keys(ids).map(sup).filter(Boolean);
}
function of(k,sid){var p=pid(); return arr(k).filter(function(r){return r.pid===p&&r.sup===sid})}
function buyTotal(b){var t=(b.items||[]).reduce(function(a,i){return a+num(i.qty)*num(i.price)},0); return t*(1+num(b.vat)/100)}
function sums(sid){
  var buys=of('buys',sid), pays=of('pays',sid);
  var bought=buys.reduce(function(a,b){return a+buyTotal(b)},0), paid=pays.reduce(function(a,p){return a+num(p.amt)},0);
  return {bought:bought,paid:paid,debt:bought-paid,nb:buys.length,np:pays.length};
}
/* bảng giá hiện hành: mỗi mặt hàng lấy bản ghi mới nhất theo ngày, kèm giá trước đó */
function priceTable(sid){
  var g={};
  of('prices',sid).forEach(function(r){var k=key(r.name,r.unit); (g[k]=g[k]||[]).push(r)});
  return Object.keys(g).map(function(k){
    var h=g[k].sort(function(a,b){return (a.date||'')<(b.date||'')?1:(a.date||'')>(b.date||'')?-1:(b.at||0)-(a.at||0)});
    var cur=h[0], prev=h.filter(function(x){return num(x.price)!==num(cur.price)})[0];
    return {k:k,cur:cur,prev:prev,hist:h};
  }).sort(function(a,b){return String(a.cur.name).localeCompare(String(b.cur.name),'vi')});
}
function priceAt(sid,name,unit,date){
  var k=key(name,unit), best=null;
  of('prices',sid).forEach(function(r){if(key(r.name,r.unit)===k&&(!date||!r.date||r.date<=date)&&(!best||(r.date||'')>=(best.date||''))) best=r});
  if(!best){of('prices',sid).forEach(function(r){if(norm(r.name).trim()===norm(name).trim()&&(!best||(r.date||'')>=(best.date||''))) best=r})}
  return best;
}
function qtyBought(sid){
  var q={};
  of('buys',sid).forEach(function(b){(b.items||[]).forEach(function(i){var k=key(i.name,i.unit); var o=q[k]=q[k]||{name:i.name,unit:i.unit,qty:0,amt:0,n:0,last:''}; o.qty+=num(i.qty); o.amt+=num(i.qty)*num(i.price); o.n++; if((b.date||'')>o.last) o.last=b.date})});
  return q;
}

/* ---------- AI ---------- */
function aiCfg(){try{return JSON.parse(localStorage.getItem(AIK)||'{}')}catch(e){return {}}}
function aiSave(c){try{localStorage.setItem(AIK,JSON.stringify(c))}catch(e){}}
var DEFM={gemini:'gemini-flash-latest',claude:'claude-sonnet-4-5'};
function vAI(){
  var c=aiCfg(), pv=c.prov||'gemini';
  return A().head('Trợ lý AI','Dùng để đọc ảnh chụp, PDF, Excel báo giá và phiếu giao hàng rồi tổng hợp thành bảng. Khóa API chỉ lưu trong máy này, không đưa vào dữ liệu dự án hay sao lưu.')+
    '<section class="panel"><form class="f" id="mhAiForm">'+
    '<label for="mhProv">Dịch vụ AI<select id="mhProv"><option value="gemini"'+(pv==='gemini'?' selected':'')+'>Google Gemini</option><option value="claude"'+(pv==='claude'?' selected':'')+'>Anthropic Claude</option></select></label>'+
    '<label for="mhModel">Mô hình<input type="text" id="mhModel" value="'+esc(c.model||'')+'" placeholder="'+DEFM[pv]+'"></label>'+
    '<label class="wide" for="mhKey">Khóa API<input type="password" id="mhKey" value="'+esc(c.key||'')+'" autocomplete="off" placeholder="'+(pv==='gemini'?'AIza…':'sk-ant-…')+'"></label>'+
    '<div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="submit">Lưu</button><button class="btn ghost" type="button" data-mh="aitest">Thử kết nối</button>'+(c.key?'<button class="btn ghost" type="button" data-mh="aidel">Xóa khóa</button>':'')+'</div></form>'+
    '<p id="mhAiMsg" style="margin:10px 0 0;color:var(--muted)">'+(c.key?'Đã có khóa '+(pv==='gemini'?'Gemini':'Claude')+'.':'Chưa có khóa.')+'</p>'+
    '<p class="note">Lấy khóa Gemini miễn phí tại aistudio.google.com (mục Get API key). Khóa Claude lấy tại console.anthropic.com. Ảnh và tệp được gửi thẳng từ máy này tới dịch vụ AI đã chọn để đọc.</p></section>';
}
function b64(blob){return new Promise(function(ok,no){var r=new FileReader(); r.onload=function(){ok(String(r.result).split(',')[1])}; r.onerror=function(){no(r.error)}; r.readAsDataURL(blob)})}
function shrink(blob){
  return new Promise(function(ok){
    if(!/^image\//.test(blob.type)||blob.size<900*1024){ok(blob); return}
    var u=URL.createObjectURL(blob), im=new Image();
    im.onload=function(){var m=2200, sc=Math.min(1,m/Math.max(im.width,im.height)), c=document.createElement('canvas'); c.width=Math.round(im.width*sc); c.height=Math.round(im.height*sc); c.getContext('2d').drawImage(im,0,0,c.width,c.height); URL.revokeObjectURL(u); c.toBlob(function(b){ok(b||blob)},'image/jpeg',0.85)};
    im.onerror=function(){URL.revokeObjectURL(u); ok(blob)}; im.src=u;
  });
}
function kindOf(d){var n=String(d.name||'').toLowerCase(), t=d.type||'';
  if(/^image\//.test(t)||/\.(jpe?g|png|webp|heic)$/.test(n)) return 'img';
  if(t==='application/pdf'||/\.pdf$/.test(n)) return 'pdf';
  if(/\.xlsx$/.test(n)) return 'xlsx';
  if(/\.(csv|txt|tsv)$/.test(n)||/^text\//.test(t)) return 'txt';
  return 'other';
}
/* chuẩn bị nội dung gửi AI cho từng tệp */
function partsFor(docs){
  return Promise.all(docs.map(function(d){
    return FILES.get(d.fileId).then(function(blob){
      if(!blob) throw new Error('Không tìm thấy tệp '+d.name+' trong máy này');
      var k=kindOf(d);
      if(k==='img') return shrink(blob).then(function(b){return b64(b).then(function(x){return {kind:'bin',mime:b.type||'image/jpeg',data:x,name:d.name}})});
      if(k==='pdf') return b64(blob).then(function(x){return {kind:'bin',mime:'application/pdf',data:x,name:d.name}});
      if(k==='xlsx') return blob.arrayBuffer().then(FILES.xlsxSheets).then(function(sh){return {kind:'text',name:d.name,text:sh.map(function(s){return '## Sheet '+s.name+'\n'+s.rows.slice(0,600).map(function(r){return r.join(' | ')}).join('\n')}).join('\n\n')}});
      if(k==='txt') return blob.text().then(function(t){return {kind:'text',name:d.name,text:t.slice(0,120000)}});
      throw new Error('Chưa đọc được loại tệp '+d.name+' (dùng ảnh, PDF, Excel .xlsx hoặc CSV)');
    });
  }));
}
function prompt(type,supName){
  return 'Bạn là trợ lý dự toán, mua hàng công trình xây dựng ở Việt Nam. Các tệp đính kèm là '+(type==='phieu'?'phiếu giao hàng hoặc hóa đơn mua vật tư':'báo giá hoặc bảng đơn giá vật tư')+' của nhà cung cấp "'+supName+'".\n'+
  'Đọc toàn bộ các tệp, tổng hợp thành MỘT bảng, gộp các dòng trùng tên và quy cách (với phiếu giao hàng thì cộng khối lượng). Bỏ dòng tổng cộng, thuế, chữ ký.\n'+
  'Chỉ trả về JSON đúng dạng: {"doc_date":"YYYY-MM-DD hoặc rỗng","doc_no":"số phiếu/số báo giá hoặc rỗng","vat_percent":số hoặc null,"price_includes_vat":true/false/null,'+
  '"items":[{"name":"tên mặt hàng","spec":"quy cách, mã, thương hiệu","unit":"đơn vị tính","qty":số hoặc null,"price":số (đơn giá, đồng),"amount":số hoặc null,"note":"ghi chú, chỗ đọc không chắc"}],"warnings":["điều cần người dùng kiểm tra lại"]}.\n'+
  'Số viết dạng số thuần (1200000, không dấu chấm phân cách). Không tự bịa số: chỗ mờ, không đọc được thì để null và ghi vào note.';
}
function callAI(parts,text){
  var c=aiCfg(), pv=c.prov||'gemini', model=(c.model||'').trim()||DEFM[pv];
  if(!c.key) return Promise.reject(new Error('Chưa có khóa AI. Vào Cài đặt › Trợ lý AI để nhập'));
  var req;
  if(pv==='gemini'){
    var gp=[{text:text}].concat(parts.map(function(p){return p.kind==='bin'?{inline_data:{mime_type:p.mime,data:p.data}}:{text:'Tệp '+p.name+':\n'+p.text}}));
    req=fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(c.key),{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({contents:[{role:'user',parts:gp}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})})
      .then(function(r){return r.json().then(function(j){if(!r.ok) throw new Error((j.error&&j.error.message)||('HTTP '+r.status)); var c0=j.candidates&&j.candidates[0]; if(!c0) throw new Error('AI không trả kết quả'+(j.promptFeedback&&j.promptFeedback.blockReason?' ('+j.promptFeedback.blockReason+')':'')); return (c0.content&&c0.content.parts||[]).map(function(x){return x.text||''}).join('')})});
  } else {
    var cp=parts.map(function(p){return p.kind==='bin'?(p.mime==='application/pdf'?{type:'document',source:{type:'base64',media_type:p.mime,data:p.data}}:{type:'image',source:{type:'base64',media_type:p.mime,data:p.data}}):{type:'text',text:'Tệp '+p.name+':\n'+p.text}}).concat([{type:'text',text:text}]);
    req=fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':c.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:model,max_tokens:16000,messages:[{role:'user',content:cp}]})})
      .then(function(r){return r.json().then(function(j){if(!r.ok) throw new Error((j.error&&j.error.message)||('HTTP '+r.status)); return (j.content||[]).map(function(x){return x.text||''}).join('')})});
  }
  return req.then(function(t){
    var a=t.indexOf('{'), b=t.lastIndexOf('}'); if(a<0||b<a) throw new Error('AI trả về không đúng dạng bảng');
    return JSON.parse(t.slice(a,b+1));
  });
}
/* đọc Excel không cần AI: dùng bộ nhận cột của phần nhập báo giá */
function localXlsx(docs){
  return Promise.all(docs.map(function(d){return FILES.get(d.fileId).then(function(b){return b.arrayBuffer()}).then(FILES.xlsxSheets)})).then(function(all){
    var items=[];
    all.forEach(function(sh){sh.forEach(function(s){var h=FILES.detect(s.rows); if(!h) return; FILES.quoteItems(s.rows,h.hdr,h.map).items.forEach(function(i){items.push({name:i.name,spec:'',unit:i.unit,qty:i.qty,price:i.price,note:''})})})});
    if(!items.length) throw new Error('Không nhận ra cột Tên, ĐVT, Đơn giá trong file Excel. Hãy dùng AI đọc');
    return {items:items,warnings:['Đọc trực tiếp từ Excel, không qua AI. Kiểm tra lại cột khối lượng và đơn giá.']};
  });
}
function runRead(ids,useAI){
  var s=sup(mh.sup), docs=arr('pdocs').filter(function(d){return ids.indexOf(d.id)>=0});
  if(!docs.length){A().flash('Chưa chọn tệp nào.'); return}
  var type=docs[0].type||'bao-gia';
  mh.busy='Đang đọc '+docs.length+' tệp…'; rerender(true);
  var job=useAI?partsFor(docs).then(function(p){return callAI(p,prompt(type,s?s.name:''))}):localXlsx(docs);
  job.then(function(j){
    var items=(j.items||[]).map(function(i){return {on:true,name:String(i.name||'').trim(),spec:String(i.spec||'').trim(),unit:String(i.unit||'').trim(),qty:i.qty==null?'':num(i.qty),price:i.price==null?'':num(i.price),note:String(i.note||'').trim()}}).filter(function(i){return i.name});
    if(!items.length) throw new Error('Không tìm thấy dòng hàng nào trong tệp');
    mh.review={type:type,docs:ids,date:(/^\d{4}-\d{2}-\d{2}$/.test(j.doc_date||'')?j.doc_date:docs[0].date)||today(),no:j.doc_no||'',vat:j.vat_percent==null?'':num(j.vat_percent),inclVat:j.price_includes_vat,warnings:j.warnings||[],items:items,ai:useAI};
    docs.forEach(function(d){d.read=today()}); A().save();
    log((useAI?'AI đọc ':'Đọc Excel ')+docs.length+' tệp, ra '+items.length+' dòng');
    mh.busy=''; rerender(); var el=document.getElementById('mhReview'); if(el) el.scrollIntoView();
  }).catch(function(e){mh.busy=''; rerender(true); A().flash('Không đọc được: '+(e&&e.message||e)+'.'); if(window.SCT) SCT.log('warn','Đọc tệp đơn giá: '+(e&&e.message||e))});
}

/* ---------- giao diện ---------- */
function tabs(list,cur,attr){return '<div class="tabs">'+list.map(function(t){return '<button type="button" class="btn ghost sm" data-mh="'+attr+'" data-v="'+t[0]+'" aria-pressed="'+(cur===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>'}
function view(){
  var P=A().proj();
  var top=tabs([['ct','Theo công trình: '+(P?P.name:'')],['dir','Danh bạ công ty']],mh.tab,'tab');
  if(mh.tab==='dir') return top+A().vPartners('ncc');
  return top+(mh.sup&&sup(mh.sup)?detail():list());
}
function list(){
  var P=A().proj(), L=linked();
  var tot={b:0,p:0};
  var cards=L.map(function(x){
    var m=sums(x.id), pt=priceTable(x.id), up=pt.filter(function(r){return r.prev&&num(r.cur.price)>num(r.prev.price)}).length, last=pt.reduce(function(a,r){return (r.cur.date||'')>a?r.cur.date:a},'');
    tot.b+=m.bought; tot.p+=m.paid;
    return '<button type="button" class="res" data-mh="open" data-v="'+x.id+'"><b>'+esc(x.name)+'</b>'+(x.grp?' <span class="pill muted">'+esc(x.grp)+'</span>':'')+(m.debt>0.5?' <span class="pill warn">Còn nợ '+vnd(m.debt)+'</span>':m.bought?' <span class="pill good">Đã trả đủ</span>':'')+(up?' <span class="pill bad">'+up+' mặt hàng tăng giá</span>':'')+
      '<small>Đã mua '+vnd(m.bought)+' ('+m.nb+' phiếu) · Đã trả '+vnd(m.paid)+' ('+m.np+' lần) · Bảng giá '+pt.length+' mặt hàng'+(last?', cập nhật '+fmtD(last):'')+'</small></button>';
  }).join('');
  var opts=(S().partners||[]).filter(function(x){return x.kind==='ncc'&&!L.some(function(y){return y.id===x.id})}).map(function(x){return '<option value="'+x.id+'">'+esc(x.name)+'</option>'}).join('');
  return A().head('Nhà cung cấp của công trình','Công trình '+esc(P?P.name:'')+': bảng giá từng nhà cung cấp, khối lượng và ngày mua hàng, các lần thanh toán, công nợ. Chèn ảnh chụp hoặc tệp đơn giá để AI tổng hợp thành bảng.')+
    '<dl class="strip"><div><dt>Nhà cung cấp</dt><dd>'+L.length+'</dd></div><div><dt>Tổng đã mua</dt><dd>'+A().short(tot.b)+'</dd></div><div><dt>Đã thanh toán</dt><dd>'+A().short(tot.p)+'</dd></div><div><dt>Còn nợ</dt><dd>'+A().short(tot.b-tot.p)+'</dd></div></dl>'+
    (cards||'<p class="empty">Công trình này chưa có nhà cung cấp nào. Thêm ở khung bên dưới.</p>')+
    '<section class="panel" style="margin-top:12px"><h2>Thêm nhà cung cấp vào công trình</h2><form class="f" id="mhLinkForm">'+
    (opts?'<label for="mhLinkSel">Chọn từ danh bạ<select id="mhLinkSel"><option value="">…</option>'+opts+'</select></label>':'')+
    '<label for="mhLinkNew">Hoặc nhập tên mới<input type="text" id="mhLinkNew" placeholder="Tên nhà cung cấp"></label>'+
    '<button class="btn" type="submit">Thêm vào công trình</button></form><p class="note">Tên mới sẽ được thêm vào danh bạ nhà cung cấp của công ty, sửa thông tin liên hệ ở thẻ Danh bạ công ty.</p></section>';
}
function detail(){
  var x=sup(mh.sup), m=sums(x.id), tel=String(x.phone||'').replace(/[^0-9+]/g,'');
  return '<p style="margin:0 0 8px"><button type="button" class="btn ghost sm" data-mh="back">← Danh sách nhà cung cấp</button></p>'+
    A().head(esc(x.name),[x.grp?esc(x.grp):'',x.contact?esc(x.contact):'',tel?'<a href="tel:'+esc(tel)+'">'+esc(x.phone)+'</a>':'',x.terms?esc(x.terms):''].filter(Boolean).join(' · ')||'Nhà cung cấp')+
    '<dl class="strip"><div><dt>Đã mua</dt><dd>'+A().short(m.bought)+'</dd></div><div><dt>Đã thanh toán</dt><dd>'+A().short(m.paid)+'</dd></div><div><dt>Còn nợ</dt><dd style="color:'+(m.debt>0.5?'var(--bad)':'inherit')+'">'+A().short(m.debt)+'</dd></div><div><dt>Phiếu mua / lần trả</dt><dd>'+m.nb+' / '+m.np+'</dd></div></dl>'+
    (mh.busy?'<div class="panel" style="border-color:var(--accent)">'+esc(mh.busy)+'</div>':'')+
    tabs([['gia','Bảng giá'],['mua','Mua hàng'],['tt','Thanh toán và công nợ'],['tep','Tệp và AI']],mh.sub,'sub')+
    (mh.sub==='gia'?subPrice(x):mh.sub==='mua'?subBuy(x):mh.sub==='tt'?subPay(x):subFiles(x))+
    (mh.review?review(x):'');
}
function subPrice(x){
  var pt=priceTable(x.id), q=qtyBought(x.id), tk=norm(mh.q).split(/\s+/).filter(Boolean);
  var rows=pt.filter(function(r){var t=norm(r.cur.name+' '+(r.cur.spec||'')); return tk.every(function(k){return t.indexOf(k)>=0})}).map(function(r){
    var c=r.cur, ch=r.prev?(num(c.price)-num(r.prev.price))/(num(r.prev.price)||1)*100:null, b=q[r.k];
    var h=mh.hist===r.k?'<tr><td colspan="8" style="background:var(--bg)"><b>Lịch sử giá</b><br>'+r.hist.map(function(z){return fmtD(z.date)+': '+vnd(num(z.price))+(z.src?' <small style="color:var(--muted)">('+esc(z.src)+')</small>':'')+' <button type="button" class="btn ghost sm" data-mh="pdel" data-v="'+z.id+'">'+(mh.arm===z.id?'Bấm lại để xóa':'Xóa')+'</button>'}).join('<br>')+'</td></tr>':'';
    return '<tr><td><b>'+esc(c.name)+'</b>'+(c.spec?'<br><small style="color:var(--muted)">'+esc(c.spec)+'</small>':'')+'</td><td>'+esc(c.unit)+'</td><td class="num"><b>'+vnd(num(c.price))+'</b></td><td class="num">'+(r.prev?vnd(num(r.prev.price)):'–')+'</td><td class="num">'+(ch==null?'–':'<span class="pill '+(ch>0?'bad':'good')+'">'+(ch>0?'+':'')+ch.toFixed(1).replace('.',',')+'%</span>')+'</td><td>'+fmtD(c.date)+'</td><td class="num">'+(b?fq(b.qty):'–')+'</td><td><button type="button" class="btn ghost sm" data-mh="hist" data-v="'+esc(r.k)+'">'+(r.hist.length>1?r.hist.length+' lần':'Chi tiết')+'</button></td></tr>'+h;
  }).join('');
  return '<section class="panel scroll"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><h2 style="margin:0;flex:1 1 220px">Bảng giá hiện hành</h2><input type="search" id="mhQ" placeholder="Tìm mặt hàng" value="'+esc(mh.q)+'" style="flex:1 1 180px"><button type="button" class="btn ghost sm" data-mh="csv">Xuất Excel (CSV)</button></div>'+
    '<table><thead><tr><th>Mặt hàng</th><th>ĐVT</th><th class="num">Đơn giá</th><th class="num">Giá trước</th><th class="num">Thay đổi</th><th>Áp dụng từ</th><th class="num">KL đã mua</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="8" class="empty">Chưa có giá. Thêm tay ở dưới, hoặc vào thẻ Tệp và AI để đọc báo giá.</td></tr>')+'</tbody></table>'+
    '<p class="note">Mỗi lần nhập giá mới cho cùng mặt hàng (cùng tên và ĐVT) sẽ lưu thành một mốc trong lịch sử; giá hiện hành là mốc có ngày áp dụng mới nhất.</p></section>'+
    '<section class="panel"><h2>Thêm hoặc cập nhật giá</h2><form class="f" id="mhPriceForm">'+
    '<label class="wide" for="mpName">Tên mặt hàng<input type="text" id="mpName" list="mhItems" required>'+itemList(x.id)+'</label><label for="mpSpec">Quy cách<input type="text" id="mpSpec"></label><label for="mpUnit">ĐVT<input type="text" id="mpUnit" required></label>'+
    '<label for="mpPrice">Đơn giá (đồng)<input type="number" id="mpPrice" min="0" step="any" required></label><label for="mpDate">Áp dụng từ ngày<input type="date" id="mpDate" value="'+today()+'" required></label>'+
    '<button class="btn" type="submit">Lưu giá</button></form></section>';
}
function itemList(sid){var seen={}; return '<datalist id="mhItems">'+of('prices',sid).filter(function(r){var k=key(r.name,r.unit); if(seen[k]) return false; return seen[k]=1}).map(function(r){return '<option value="'+esc(r.name)+'">'+esc(r.unit)+'</option>'}).join('')+'</datalist>'}
function subBuy(x){
  var buys=of('buys',x.id).sort(function(a,b){return (b.date||'')<(a.date||'')?-1:1});
  var rows=buys.map(function(b){
    return '<details class="kb"><summary><b>'+fmtD(b.date)+(b.no?' · '+esc(b.no):'')+'</b><span class="pill muted">'+(b.items||[]).length+' dòng</span><span style="margin-left:auto;font-weight:600">'+vnd(buyTotal(b))+'</span></summary><div class="body scroll"><table><thead><tr><th>Mặt hàng</th><th>ĐVT</th><th class="num">Khối lượng</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>'+
      (b.items||[]).map(function(i){return '<tr><td>'+esc(i.name)+'</td><td>'+esc(i.unit)+'</td><td class="num">'+fq(num(i.qty))+'</td><td class="num">'+vnd(num(i.price))+'</td><td class="num">'+vnd(num(i.qty)*num(i.price))+'</td></tr>'}).join('')+
      (num(b.vat)?'<tr><td colspan="4">Thuế VAT '+num(b.vat)+'%</td><td class="num">'+vnd(buyTotal(b)-buyTotal(Object.assign({},b,{vat:0})))+'</td></tr>':'')+'</tbody></table>'+(b.note?'<p>'+esc(b.note)+'</p>':'')+(b.src?'<p class="note">Nguồn: '+esc(b.src)+'</p>':'')+
      '<p><button type="button" class="btn ghost sm" data-mh="bdel" data-v="'+b.id+'">'+(mh.arm===b.id?'Bấm lại để xóa phiếu':'Xóa phiếu')+'</button></p></div></details>';
  }).join('');
  var q=qtyBought(x.id), qr=Object.keys(q).map(function(k){var o=q[k]; return '<tr><td>'+esc(o.name)+'</td><td>'+esc(o.unit)+'</td><td class="num"><b>'+fq(o.qty)+'</b></td><td class="num">'+vnd(o.qty?o.amt/o.qty:0)+'</td><td class="num">'+vnd(o.amt)+'</td><td>'+o.n+' lần, gần nhất '+fmtD(o.last)+'</td></tr>'}).join('');
  var d=mh.draft||(mh.draft={date:today(),no:'',vat:'',note:'',rows:[{name:'',unit:'',qty:'',price:''}]});
  var dr=d.rows.map(function(r,i){return '<tr><td><input type="text" data-mhd="'+i+'|name" list="mhItems" value="'+esc(r.name)+'" style="width:100%"></td><td><input type="text" data-mhd="'+i+'|unit" value="'+esc(r.unit)+'" style="width:70px"></td><td><input type="number" step="any" min="0" data-mhd="'+i+'|qty" value="'+esc(r.qty)+'" style="width:90px"></td><td><input type="number" step="any" min="0" data-mhd="'+i+'|price" value="'+esc(r.price)+'" style="width:120px"></td><td class="num" id="mhdAmt'+i+'">'+vnd(num(r.qty)*num(r.price))+'</td><td><button type="button" class="btn ghost sm" data-mh="drow" data-v="'+i+'" aria-label="Xóa dòng">×</button></td></tr>'}).join('');
  return '<section class="panel"><h2>Phiếu mua hàng</h2>'+(rows||'<p class="empty">Chưa có phiếu mua hàng.</p>')+'</section>'+
    '<section class="panel scroll"><h2>Khối lượng đã mua theo mặt hàng</h2><table><thead><tr><th>Mặt hàng</th><th>ĐVT</th><th class="num">Tổng KL</th><th class="num">Giá bình quân</th><th class="num">Thành tiền</th><th>Số lần mua</th></tr></thead><tbody>'+(qr||'<tr><td colspan="6" class="empty">Chưa có.</td></tr>')+'</tbody></table></section>'+
    '<section class="panel scroll"><h2>Thêm phiếu mua hàng</h2>'+itemList(x.id)+'<form class="f" id="mhBuyForm"><label for="mbDate">Ngày mua, nhận hàng<input type="date" id="mbDate" data-mhd="-|date" value="'+esc(d.date)+'" required></label><label for="mbNo">Số phiếu, hóa đơn<input type="text" id="mbNo" data-mhd="-|no" value="'+esc(d.no)+'"></label><label for="mbVat">VAT (%)<input type="number" id="mbVat" data-mhd="-|vat" min="0" step="any" value="'+esc(d.vat)+'" placeholder="0"></label><label class="wide" for="mbNote">Ghi chú<input type="text" id="mbNote" data-mhd="-|note" value="'+esc(d.note)+'"></label></form>'+
    '<table style="margin-top:10px"><thead><tr><th>Mặt hàng (gõ để chọn từ bảng giá)</th><th>ĐVT</th><th>Khối lượng</th><th>Đơn giá</th><th class="num">Thành tiền</th><th></th></tr></thead><tbody>'+dr+'</tbody></table>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"><button type="button" class="btn ghost sm" data-mh="dadd">+ Thêm dòng</button><span style="flex:1"></span><b id="mhdTot">Tổng: '+vnd(buyTotal({items:d.rows,vat:d.vat}))+'</b><button type="button" class="btn" data-mh="dsave">Lưu phiếu</button></div>'+
    '<p class="note">Chọn tên mặt hàng có trong bảng giá thì ĐVT và đơn giá (theo ngày mua) tự điền.</p></section>';
}
function ledger(sid){
  var ev=[];
  of('buys',sid).forEach(function(b){ev.push({d:b.date,t:'Mua hàng'+(b.no?' '+b.no:''),inc:buyTotal(b)})});
  of('pays',sid).sort(function(a,b){return (a.date||'')<(b.date||'')?-1:1}).forEach(function(p,i){ev.push({d:p.date,t:'Thanh toán lần '+(i+1)+(p.method?' ('+p.method+')':''),dec:num(p.amt),id:p.id,note:p.note})});
  ev.sort(function(a,b){return (a.d||'')<(b.d||'')?-1:(a.d||'')>(b.d||'')?1:(a.dec?1:-1)});
  var bal=0; ev.forEach(function(e){bal+=(e.inc||0)-(e.dec||0); e.bal=bal}); return ev;
}
function subPay(x){
  var m=sums(x.id), ev=ledger(x.id);
  var rows=ev.slice().reverse().map(function(e){return '<tr><td>'+fmtD(e.d)+'</td><td>'+esc(e.t)+(e.note?'<br><small style="color:var(--muted)">'+esc(e.note)+'</small>':'')+'</td><td class="num">'+(e.inc?vnd(e.inc):'')+'</td><td class="num">'+(e.dec?vnd(e.dec):'')+'</td><td class="num"><b>'+vnd(e.bal)+'</b></td><td>'+(e.id?'<button type="button" class="btn ghost sm" data-mh="paydel" data-v="'+e.id+'">'+(mh.arm===e.id?'Bấm lại':'Xóa')+'</button>':'')+'</td></tr>'}).join('');
  return '<section class="panel scroll"><h2>Sổ công nợ</h2><table><thead><tr><th>Ngày</th><th>Nội dung</th><th class="num">Phát sinh nợ</th><th class="num">Đã trả</th><th class="num">Còn nợ</th><th></th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" class="empty">Chưa có phiếu mua hay lần thanh toán nào.</td></tr>')+'</tbody></table></section>'+
    '<section class="panel"><h2>Ghi lần thanh toán '+(m.np+1)+'</h2><form class="f" id="mhPayForm"><label for="mtDate">Ngày<input type="date" id="mtDate" value="'+today()+'" required></label><label for="mtAmt">Số tiền (đồng)<input type="number" id="mtAmt" min="0" step="any" required'+(m.debt>0?' placeholder="Còn nợ '+Math.round(m.debt)+'"':'')+'></label>'+
    '<label for="mtMethod">Hình thức<select id="mtMethod"><option>Chuyển khoản</option><option>Tiền mặt</option><option>Khác</option></select></label><label class="wide" for="mtNote">Ghi chú (số chứng từ, đợt)<input type="text" id="mtNote"></label><button class="btn" type="submit">Lưu thanh toán</button></form>'+
    (m.debt>0.5?'<p class="note">Còn nợ '+vnd(m.debt)+'. <button type="button" class="btn ghost sm" data-mh="payall">Điền đủ số còn nợ</button></p>':'')+'</section>';
}
function subFiles(x){
  var docs=of('pdocs',x.id).sort(function(a,b){return (b.at||0)-(a.at||0)}), c=aiCfg();
  var rows=docs.map(function(d){
    var k=kindOf(d);
    return '<div class="ckrow"><input type="checkbox" data-mh="dsel" data-v="'+d.id+'"'+(mh.sel[d.id]?' checked':'')+' aria-label="Chọn tệp"><span><b>'+esc(d.name)+'</b><br><small style="color:var(--muted)">'+esc(DOCT[d.type]||'')+' · '+fmtD(d.date)+' · '+A().fsize(d.size||0)+(d.read?' · đã đọc '+fmtD(d.read):'')+'</small></span><span class="acts"><button type="button" class="btn ghost sm" data-mh="dview" data-v="'+d.id+'">Xem</button><button type="button" class="btn sm" data-mh="dai" data-v="'+d.id+'"'+(k==='other'?' disabled':'')+'>AI đọc</button>'+(k==='xlsx'?'<button type="button" class="btn ghost sm" data-mh="dxl" data-v="'+d.id+'">Đọc Excel</button>':'')+'<button type="button" class="btn ghost sm" data-mh="ddel" data-v="'+d.id+'">'+(mh.arm===d.id?'Bấm lại':'Xóa')+'</button></span></div>';
  }).join('');
  var nsel=docs.filter(function(d){return mh.sel[d.id]}).length;
  return (c.key?'':'<div class="panel" style="border-color:var(--warn)">Chưa có khóa AI nên chưa đọc được ảnh và PDF. <button type="button" class="btn ghost sm" data-view="cai-dat-ai">Nhập khóa AI</button> File Excel vẫn đọc trực tiếp được.</div>')+
    '<section class="panel"><h2>Chèn tệp</h2><form class="f" onsubmit="return false"><label for="mfType">Loại tài liệu<select id="mfType"><option value="bao-gia">'+DOCT['bao-gia']+'</option><option value="phieu">'+DOCT.phieu+'</option></select></label><label for="mfDate">Ngày trên tài liệu<input type="date" id="mfDate" value="'+today()+'"></label>'+
    '<label class="wide" for="mfFiles">Ảnh chụp, PDF, Excel (.xlsx), CSV — chọn được nhiều tệp<input type="file" id="mfFiles" multiple accept="image/*,application/pdf,.pdf,.xlsx,.csv,.txt"></label><label for="mfCam">Hoặc chụp ảnh bằng camera<input type="file" id="mfCam" accept="image/*" capture="environment"></label></form>'+
    '<p class="note">Báo giá: AI tổng hợp đơn giá vào Bảng giá. Phiếu giao hàng, hóa đơn: AI tạo phiếu mua hàng có khối lượng và cập nhật giá. Chụp nhiều trang thì chọn hết rồi bấm Tổng hợp.</p></section>'+
    '<section class="panel"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><h2 style="margin:0;flex:1 1 200px">Tệp đã chèn ('+docs.length+')</h2><button type="button" class="btn sm" data-mh="dmulti"'+(nsel?'':' disabled')+'>AI tổng hợp '+nsel+' tệp đã chọn</button></div>'+(rows||'<p class="empty">Chưa có tệp.</p>')+'</section>';
}
function review(x){
  var r=mh.review, tot=r.items.filter(function(i){return i.on}).reduce(function(a,i){return a+num(i.qty)*num(i.price)},0);
  var rows=r.items.map(function(i,n){
    var old=priceAt(x.id,i.name,i.unit), ch=old&&num(i.price)&&num(old.price)!==num(i.price)?(num(i.price)-num(old.price))/(num(old.price)||1)*100:null;
    return '<tr><td><input type="checkbox" data-mhr="'+n+'|on"'+(i.on?' checked':'')+' aria-label="Lấy dòng này"></td><td><input type="text" data-mhr="'+n+'|name" value="'+esc(i.name)+'" style="width:100%;min-width:160px">'+(i.note?'<br><small style="color:var(--warn)">'+esc(i.note)+'</small>':'')+'</td><td><input type="text" data-mhr="'+n+'|spec" value="'+esc(i.spec)+'" style="width:110px"></td><td><input type="text" data-mhr="'+n+'|unit" value="'+esc(i.unit)+'" style="width:64px"></td>'+
      (r.type==='phieu'?'<td><input type="number" step="any" data-mhr="'+n+'|qty" value="'+esc(i.qty)+'" style="width:84px"></td>':'')+
      '<td><input type="number" step="any" data-mhr="'+n+'|price" value="'+esc(i.price)+'" style="width:110px"></td><td class="num">'+(old?vnd(num(old.price))+(ch!=null?'<br><span class="pill '+(ch>0?'bad':'good')+'">'+(ch>0?'+':'')+ch.toFixed(1).replace('.',',')+'%</span>':''):'<span class="pill muted">Mới</span>')+'</td></tr>';
  }).join('');
  return '<section class="panel scroll" id="mhReview" style="border-color:var(--accent)"><h2>Kết quả '+(r.ai?'AI đọc':'đọc Excel')+': kiểm tra trước khi lưu</h2>'+
    (r.warnings&&r.warnings.length?'<ul class="alerts">'+r.warnings.map(function(w){return '<li><b>Cần kiểm tra</b>'+esc(w)+'</li>'}).join('')+'</ul>':'')+
    '<form class="f" onsubmit="return false" style="margin:10px 0"><label for="mrDate">'+(r.type==='phieu'?'Ngày mua hàng':'Giá áp dụng từ ngày')+'<input type="date" id="mrDate" data-mhr="-|date" value="'+esc(r.date)+'"></label>'+
    (r.type==='phieu'?'<label for="mrNo">Số phiếu<input type="text" id="mrNo" data-mhr="-|no" value="'+esc(r.no)+'"></label><label for="mrVat">VAT (%)<input type="number" id="mrVat" data-mhr="-|vat" value="'+esc(r.vat)+'" step="any"></label>':'')+
    '<label for="mrType">Lưu thành<select id="mrType" data-mhr="-|type"><option value="bao-gia"'+(r.type!=='phieu'?' selected':'')+'>Bảng giá</option><option value="phieu"'+(r.type==='phieu'?' selected':'')+'>Phiếu mua hàng và cập nhật giá</option></select></label></form>'+
    '<table><thead><tr><th></th><th>Mặt hàng</th><th>Quy cách</th><th>ĐVT</th>'+(r.type==='phieu'?'<th>Khối lượng</th>':'')+'<th>Đơn giá</th><th class="num">Giá đang lưu</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px">'+(r.type==='phieu'?'<b>Tổng: '+vnd(tot*(1+num(r.vat)/100))+'</b>':'')+'<span style="flex:1"></span><button type="button" class="btn ghost" data-mh="rcancel">Bỏ</button><button type="button" class="btn" data-mh="rsave">'+(r.type==='phieu'?'Tạo phiếu mua hàng':'Lưu vào bảng giá')+' ('+r.items.filter(function(i){return i.on}).length+' dòng)</button></div>'+
    (r.inclVat===true?'<p class="note">AI thấy đơn giá trong tài liệu đã gồm VAT.</p>':'')+'</section>';
}

/* ---------- thao tác ---------- */
function addPrices(sid,items,date,src){
  var at=Date.now();
  items.forEach(function(i){if(!i.name||!(num(i.price)>0)) return; var last=priceAt(sid,i.name,i.unit,date);
    if(last&&last.date===date&&num(last.price)===num(i.price)) return;
    arr('prices').push({id:A().nid('pr'),pid:pid(),sup:sid,name:i.name,spec:i.spec||'',unit:i.unit||'',price:num(i.price),date:date,src:src||'',at:at})});
}
function saveReview(){
  var r=mh.review, x=sup(mh.sup), items=r.items.filter(function(i){return i.on&&i.name});
  if(!items.length){A().flash('Chưa chọn dòng nào.'); return}
  var docs=arr('pdocs').filter(function(d){return r.docs.indexOf(d.id)>=0}).map(function(d){return d.name}).join(', ');
  if(r.type==='phieu'){
    arr('buys').push({id:A().nid('bu'),pid:pid(),sup:x.id,date:r.date,no:r.no,vat:num(r.vat)||0,note:'',src:docs,items:items.map(function(i){return {name:i.name,unit:i.unit,qty:num(i.qty),price:num(i.price)}})});
    addPrices(x.id,items,r.date,docs);
    mh.sub='mua'; A().flash('Đã tạo phiếu mua hàng '+items.length+' dòng.');
  } else {addPrices(x.id,items,r.date,docs); mh.sub='gia'; A().flash('Đã cập nhật '+items.length+' dòng vào bảng giá.')}
  log('Lưu kết quả đọc tệp: '+items.length+' dòng ('+(r.type==='phieu'?'phiếu mua':'bảng giá')+')');
  mh.review=null; A().save(); rerender();
}
function csv(x){
  var q=qtyBought(x.id), rows=[['Mặt hàng','Quy cách','ĐVT','Đơn giá','Giá trước','Áp dụng từ','KL đã mua']].concat(priceTable(x.id).map(function(r){return [r.cur.name,r.cur.spec||'',r.cur.unit,num(r.cur.price),r.prev?num(r.prev.price):'',r.cur.date||'',q[r.k]?q[r.k].qty:'']}));
  var t='﻿'+rows.map(function(r){return r.map(function(c){c=String(c); return /[",;\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(',')}).join('\r\n');
  var u=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8'})), a=document.createElement('a');
  a.href=u; a.download='Bang-gia-'+String(x.name).replace(/[\\/:*?"<>|\s]+/g,'-')+'.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){URL.revokeObjectURL(u); a.remove()},2000);
  log('Xuất bảng giá CSV');
}
function arm(id){if(mh.arm===id) return true; mh.arm=id; setTimeout(function(){if(mh.arm===id){mh.arm=''; if(A().view()==='nha-cung-cap') rerender(true)}},3500); rerender(true); return false}
function drafTotals(){
  var d=mh.draft; if(!d) return;
  d.rows.forEach(function(r,i){var c=document.getElementById('mhdAmt'+i); if(c) c.textContent=vnd(num(r.qty)*num(r.price))});
  var t=document.getElementById('mhdTot'); if(t) t.textContent='Tổng: '+vnd(buyTotal({items:d.rows,vat:d.vat}));
}

document.addEventListener('click',function(e){
  var b=e.target.closest('[data-mh]'); if(!b||!A()) return;
  var a=b.getAttribute('data-mh'), v=b.getAttribute('data-v'), s=S();
  if(a==='dsel') return;
  if(a==='tab'){mh.tab=v; mh.sup=''; mh.review=null; rerender(); return}
  if(a==='sub'){mh.sub=v; mh.arm=''; rerender(true); return}
  if(a==='open'){mh.sup=v; mh.sub='gia'; mh.review=null; mh.draft=null; mh.sel={}; mh.q=''; rerender(); window.scrollTo(0,0); return}
  if(a==='back'){mh.sup=''; mh.review=null; rerender(); return}
  if(a==='hist'){mh.hist=mh.hist===v?'':v; rerender(true); return}
  if(a==='pdel'){if(arm(v)){s.prices=s.prices.filter(function(r){return r.id!==v}); mh.arm=''; A().save(); rerender(true)} return}
  if(a==='bdel'){if(arm(v)){s.buys=s.buys.filter(function(r){return r.id!==v}); mh.arm=''; A().save(); log('Xóa phiếu mua hàng'); rerender(true)} return}
  if(a==='paydel'){if(arm(v)){s.pays=s.pays.filter(function(r){return r.id!==v}); mh.arm=''; A().save(); log('Xóa lần thanh toán'); rerender(true)} return}
  if(a==='ddel'){if(arm(v)){var d=arr('pdocs').filter(function(r){return r.id===v})[0]; s.pdocs=s.pdocs.filter(function(r){return r.id!==v}); if(d) FILES.del(d.fileId).catch(function(){}); delete mh.sel[v]; mh.arm=''; A().save(); rerender(true)} return}
  if(a==='csv'){csv(sup(mh.sup)); return}
  if(a==='dadd'){mh.draft.rows.push({name:'',unit:'',qty:'',price:''}); rerender(true); return}
  if(a==='drow'){mh.draft.rows.splice(+v,1); if(!mh.draft.rows.length) mh.draft.rows.push({name:'',unit:'',qty:'',price:''}); rerender(true); return}
  if(a==='dsave'){
    var d0=mh.draft, items=d0.rows.filter(function(r){return r.name.trim()&&num(r.qty)>0});
    if(!d0.date){A().flash('Chưa nhập ngày mua.'); return}
    if(!items.length){A().flash('Chưa có dòng nào có tên và khối lượng.'); return}
    arr('buys').push({id:A().nid('bu'),pid:pid(),sup:mh.sup,date:d0.date,no:d0.no.trim(),vat:num(d0.vat)||0,note:d0.note.trim(),items:items.map(function(r){return {name:r.name.trim(),unit:r.unit.trim(),qty:num(r.qty),price:num(r.price)}})});
    addPrices(mh.sup,items.map(function(r){return {name:r.name.trim(),unit:r.unit.trim(),price:num(r.price)}}),d0.date,'Phiếu mua '+(d0.no||fmtD(d0.date)));
    mh.draft=null; A().save(); log('Thêm phiếu mua hàng '+items.length+' dòng'); A().flash('Đã lưu phiếu mua hàng.'); rerender(true); return}
  if(a==='payall'){var m=sums(mh.sup), f=document.getElementById('mtAmt'); if(f) f.value=Math.round(m.debt); return}
  if(a==='dview'){var dv=arr('pdocs').filter(function(r){return r.id===v})[0]; if(!dv) return; FILES.get(dv.fileId).then(function(bl){if(!bl){A().flash('Không tìm thấy tệp trong máy này.'); return} var u=URL.createObjectURL(bl), el=document.createElement('a'); el.href=u; el.target='_blank'; el.rel='noopener'; if(!/^(image\/|application\/pdf)/.test(bl.type)) el.download=dv.name; document.body.appendChild(el); el.click(); setTimeout(function(){URL.revokeObjectURL(u); el.remove()},60000)}); return}
  if(a==='dai'){runRead([v],true); return}
  if(a==='dxl'){runRead([v],false); return}
  if(a==='dmulti'){var ids=Object.keys(mh.sel).filter(function(k){return mh.sel[k]}); var types={}; arr('pdocs').forEach(function(d){if(ids.indexOf(d.id)>=0) types[d.type]=1}); if(Object.keys(types).length>1){A().flash('Các tệp đã chọn khác loại (báo giá và phiếu giao hàng). Hãy chọn cùng một loại.'); return} runRead(ids,true); return}
  if(a==='rcancel'){mh.review=null; rerender(true); return}
  if(a==='rsave'){saveReview(); return}
  if(a==='aidel'){var c=aiCfg(); delete c.key; aiSave(c); log('Xóa khóa AI'); rerender(); return}
  if(a==='aitest'){
    var cfg=readAiForm(); aiSave(cfg); var msg=document.getElementById('mhAiMsg'); if(msg) msg.textContent='Đang thử…';
    callAI([],'Trả về đúng JSON {"ok":true}').then(function(j){if(msg) msg.textContent=j&&j.ok?'Kết nối được, AI trả lời bình thường.':'AI có trả lời nhưng không đúng dạng.'}).catch(function(er){if(msg) msg.textContent='Lỗi: '+(er&&er.message||er)});
    return}
});
function readAiForm(){var c=aiCfg(); c.prov=document.getElementById('mhProv').value; c.model=document.getElementById('mhModel').value.trim(); var k=document.getElementById('mhKey').value.trim(); if(k) c.key=k; return c}
document.addEventListener('change',function(e){
  var t=e.target; if(!A()) return;
  if(t.getAttribute('data-mh')==='dsel'){mh.sel[t.getAttribute('data-v')]=t.checked; var bt=document.querySelector('[data-mh="dmulti"]'), n=Object.keys(mh.sel).filter(function(k){return mh.sel[k]}).length; if(bt){bt.disabled=!n; bt.textContent='AI tổng hợp '+n+' tệp đã chọn'} return}
  if(t.id==='mhProv'){var c=aiCfg(); c.prov=t.value; c.model=''; aiSave(c); rerender(); return}
  if(t.id==='mfFiles'||t.id==='mfCam'){
    var fl=[].slice.call(t.files||[]); if(!fl.length) return;
    var type=document.getElementById('mfType').value, date=document.getElementById('mfDate').value||today(), ids=[];
    Promise.all(fl.map(function(f){var id=A().nid('pd'), fid='pdoc-'+id; return FILES.put(fid,f).then(function(){arr('pdocs').push({id:id,pid:pid(),sup:mh.sup,fileId:fid,name:f.name,type:type,mime:f.type,size:f.size,date:date,at:Date.now()}); ids.push(id)})}))
      .then(function(){A().save(); log('Chèn '+fl.length+' tệp đơn giá'); mh.sel={}; ids.forEach(function(i){mh.sel[i]=true}); rerender(true); A().flash('Đã chèn '+fl.length+' tệp. Bấm AI tổng hợp để đọc.')})
      .catch(function(er){A().flash('Không lưu được tệp: '+(er&&er.message||er)+'.')});
    return}
  if(t.getAttribute('data-mhr')&&t.getAttribute('data-mhr').split('|')[1]==='type'){mh.review.type=t.value; rerender(true); return}
  if(t.getAttribute('data-mhr')&&t.type==='checkbox'){var p=t.getAttribute('data-mhr').split('|'); mh.review.items[+p[0]].on=t.checked; rerender(true); return}
  if(t.getAttribute('data-mhd')&&t.getAttribute('data-mhd').split('|')[1]==='name'){
    var i=+t.getAttribute('data-mhd').split('|')[0], r=mh.draft.rows[i], pr=priceAt(mh.sup,r.name,r.unit,mh.draft.date)||priceAt(mh.sup,r.name,'',mh.draft.date);
    if(pr){if(!r.unit) r.unit=pr.unit; if(!r.price) r.price=pr.price; rerender(true)}
    return}
});
document.addEventListener('input',function(e){
  var t=e.target; if(!A()) return;
  var d=t.getAttribute&&t.getAttribute('data-mhd');
  if(d&&mh.draft){var p=d.split('|'); if(p[0]==='-') mh.draft[p[1]]=t.value; else mh.draft.rows[+p[0]][p[1]]=t.value; drafTotals(); return}
  var r=t.getAttribute&&t.getAttribute('data-mhr');
  if(r&&mh.review&&t.type!=='checkbox'&&t.tagName!=='SELECT'){var q=r.split('|'); if(q[0]==='-') mh.review[q[1]]=t.value; else mh.review.items[+q[0]][q[1]]=t.value; return}
  if(t.id==='mhQ'){mh.q=t.value; var pos=t.selectionStart; rerender(true); var n=document.getElementById('mhQ'); if(n){n.focus(); try{n.setSelectionRange(pos,pos)}catch(x){}} return}
});
document.addEventListener('submit',function(e){
  var f=e.target.id; if(!A()||f.indexOf('mh')!==0) return; e.preventDefault();
  var g=function(i){return document.getElementById(i).value}, s=S();
  if(f==='mhAiForm'){aiSave(readAiForm()); log('Lưu cài đặt AI'); rerender(); A().flash('Đã lưu cài đặt AI.'); return}
  if(f==='mhLinkForm'){
    var ls=document.getElementById('mhLinkSel'), id=ls?ls.value:'', nm=document.getElementById('mhLinkNew').value.trim();
    if(!id&&nm){var ex=(s.partners||[]).filter(function(x){return x.kind==='ncc'&&norm(x.name).trim()===norm(nm).trim()})[0]; if(ex) id=ex.id; else {id=A().nid('n'); (s.partners=s.partners||[]).push({id:id,kind:'ncc',name:nm,created:today()})}}
    if(!id){A().flash('Chọn hoặc nhập tên nhà cung cấp.'); return}
    if(!arr('psup').some(function(l){return l.pid===pid()&&l.sup===id})) arr('psup').push({pid:pid(),sup:id});
    A().save(); log('Thêm nhà cung cấp vào công trình'); mh.sup=id; mh.sub='tep'; rerender(); window.scrollTo(0,0); return}
  if(f==='mhPriceForm'){addPrices(mh.sup,[{name:g('mpName').trim(),spec:g('mpSpec').trim(),unit:g('mpUnit').trim(),price:num(g('mpPrice'))}],g('mpDate'),'Nhập tay'); A().save(); log('Cập nhật giá tay'); rerender(true); A().flash('Đã lưu giá.'); return}
  if(f==='mhPayForm'){var amt=num(g('mtAmt')); if(!(amt>0)) return; arr('pays').push({id:A().nid('py'),pid:pid(),sup:mh.sup,date:g('mtDate'),amt:amt,method:g('mtMethod'),note:g('mtNote').trim()}); A().save(); log('Ghi thanh toán nhà cung cấp'); rerender(true); A().flash('Đã ghi thanh toán '+vnd(amt)+'.'); return}
});

window.MH={view:view,vAI:vAI,reset:function(){mh.sup=''; mh.review=null; mh.draft=null; mh.sel={}; mh.arm=''}};
})();
