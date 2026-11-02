/* Xử lý file: lưu IndexedDB, đọc/ghi zip, nhập Excel (.xlsx), mẫu Word (.docx). Không dùng thư viện ngoài. */
(function(){
var NS_W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/* ---------- IndexedDB ---------- */
var dbp=null;
function db(){
  if(dbp) return dbp;
  dbp=new Promise(function(ok,no){
    if(!window.indexedDB){no(new Error('Trình duyệt không hỗ trợ IndexedDB')); return}
    var r=indexedDB.open('so-cong-truong-files',1);
    r.onupgradeneeded=function(){r.result.createObjectStore('f')};
    r.onsuccess=function(){ok(r.result)};
    r.onerror=function(){dbp=null; no(r.error||new Error('Không mở được kho file'))};
  });
  return dbp;
}
function tx(mode,fn){
  return db().then(function(d){return new Promise(function(ok,no){
    var t=d.transaction('f',mode), req=fn(t.objectStore('f'));
    t.oncomplete=function(){ok(req&&req.result)};
    t.onerror=t.onabort=function(){no(t.error||new Error('Lỗi ghi file'))};
  })});
}
function put(id,blob){return tx('readwrite',function(s){return s.put(blob,id)})}
function get(id){return tx('readonly',function(s){return s.get(id)})}
function del(id){return tx('readwrite',function(s){return s.delete(id)})}

/* ---------- zip ---------- */
var CRC=null;
function crc32(u8){
  if(!CRC){CRC=new Uint32Array(256); for(var n=0;n<256;n++){var c=n; for(var k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; CRC[n]=c>>>0}}
  var c2=0xFFFFFFFF; for(var i=0;i<u8.length;i++) c2=CRC[(c2^u8[i])&255]^(c2>>>8);
  return (c2^0xFFFFFFFF)>>>0;
}
function pipe(u8,stream){return new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer().then(function(b){return new Uint8Array(b)})}
function inflate(u8){return pipe(u8,new DecompressionStream('deflate-raw'))}
function deflate(u8){return typeof CompressionStream==='function'?pipe(u8,new CompressionStream('deflate-raw')):Promise.resolve(null)}
var td=new TextDecoder('utf-8'), te=new TextEncoder();

/* trả về mảng [{name,data}] theo thứ tự trong file */
function unzip(buf){
  var u8=buf instanceof Uint8Array?buf:new Uint8Array(buf), dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength), e=-1;
  for(var i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0) return Promise.reject(new Error('Không phải file zip hợp lệ'));
  var cnt=dv.getUint16(e+10,true), p=dv.getUint32(e+16,true), list=[];
  for(var n=0;n<cnt;n++){
    if(dv.getUint32(p,true)!==0x02014b50) break;
    var method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), lho=dv.getUint32(p+42,true);
    var name=td.decode(u8.subarray(p+46,p+46+nl));
    var ds=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true);
    list.push({name:name,method:method,raw:u8.subarray(ds,ds+csize)});
    p+=46+nl+el+cl;
  }
  return Promise.all(list.map(function(f){
    if(f.name.slice(-1)==='/') return {name:f.name,data:new Uint8Array(0),dir:true};
    if(f.method===0) return {name:f.name,data:f.raw};
    if(f.method===8) return inflate(f.raw).then(function(d){return {name:f.name,data:d}});
    return Promise.reject(new Error('Kiểu nén zip không hỗ trợ'));
  }));
}
function zip(entries){
  return Promise.all(entries.map(function(en){
    if(en.dir) return {name:en.name,data:en.data,comp:en.data,method:0,crc:0};
    return deflate(en.data).then(function(c){
      var use=c&&c.length<en.data.length;
      return {name:en.name,data:en.data,comp:use?c:en.data,method:use?8:0,crc:crc32(en.data)};
    });
  })).then(function(L){
    var parts=[], cen=[], off=0;
    L.forEach(function(f){
      var nm=te.encode(f.name), h=new Uint8Array(30+nm.length), v=new DataView(h.buffer);
      v.setUint32(0,0x04034b50,true); v.setUint16(4,20,true); v.setUint16(6,0x0800,true); v.setUint16(8,f.method,true);
      v.setUint16(10,0,true); v.setUint16(12,0x21,true); v.setUint32(14,f.crc,true); v.setUint32(18,f.comp.length,true); v.setUint32(22,f.data.length,true);
      v.setUint16(26,nm.length,true); h.set(nm,30);
      var c=new Uint8Array(46+nm.length), w=new DataView(c.buffer);
      w.setUint32(0,0x02014b50,true); w.setUint16(4,20,true); w.setUint16(6,20,true); w.setUint16(8,0x0800,true); w.setUint16(10,f.method,true);
      w.setUint16(14,0x21,true); w.setUint32(16,f.crc,true); w.setUint32(20,f.comp.length,true); w.setUint32(24,f.data.length,true);
      w.setUint16(28,nm.length,true); w.setUint32(42,off,true); c.set(nm,46);
      parts.push(h,f.comp); cen.push(c); off+=h.length+f.comp.length;
    });
    var csz=cen.reduce(function(a,c){return a+c.length},0), end=new Uint8Array(22), ev=new DataView(end.buffer);
    ev.setUint32(0,0x06054b50,true); ev.setUint16(8,L.length,true); ev.setUint16(10,L.length,true); ev.setUint32(12,csz,true); ev.setUint32(16,off,true);
    return new Blob(parts.concat(cen,[end]));
  });
}
function entry(list,name){for(var i=0;i<list.length;i++) if(list[i].name===name) return list[i]; return null}
function xml(list,name){
  var en=entry(list,name); if(!en) return null;
  var d=new DOMParser().parseFromString(td.decode(en.data),'application/xml');
  if(d.getElementsByTagName('parsererror').length) throw new Error('Lỗi đọc '+name);
  return d;
}
function ser(doc){return te.encode(new XMLSerializer().serializeToString(doc))}
function els(node,tag){return Array.prototype.slice.call(node.getElementsByTagNameNS('*',tag))}
function kids(node,tag){return Array.prototype.filter.call(node.childNodes,function(c){return c.nodeType===1&&c.localName===tag})}

/* ---------- Excel (.xlsx) ---------- */
function colIdx(ref){var m=/^([A-Z]+)/.exec(ref||''); if(!m) return -1; var n=0; for(var i=0;i<m[1].length;i++) n=n*26+m[1].charCodeAt(i)-64; return n-1}
function strOf(si){
  return els(si,'t').filter(function(t){return !t.parentNode||t.parentNode.localName!=='rPh'}).map(function(t){return t.textContent}).join('');
}
function readSheet(d,ss){
  var rows=[];
  els(d,'row').forEach(function(r){
    var ri=parseInt(r.getAttribute('r'),10)-1; if(isNaN(ri)) ri=rows.length;
    var row=rows[ri]=rows[ri]||[], seq=0;
    kids(r,'c').forEach(function(c){
      var ci=colIdx(c.getAttribute('r')); if(ci<0) ci=seq; seq=ci+1;
      var t=c.getAttribute('t'), v=kids(c,'v')[0], val='';
      if(t==='s') val=v?ss[parseInt(v.textContent,10)]||'':'';
      else if(t==='inlineStr'){var is=kids(c,'is')[0]; val=is?strOf(is):''}
      else if(t==='str'||t==='e') val=v?v.textContent:'';
      else if(t==='b') val=v&&v.textContent==='1'?'TRUE':'FALSE';
      else if(v&&v.textContent!==''){var n=Number(v.textContent); val=isNaN(n)?v.textContent:n}
      row[ci]=val;
    });
  });
  var w=0; for(var i=0;i<rows.length;i++){if(rows[i]) w=Math.max(w,rows[i].length)}
  var out=[]; for(var j=0;j<rows.length;j++){var rr=[]; for(var k=0;k<w;k++){var x=rows[j]&&rows[j][k]; rr.push(x===undefined?'':x)} out.push(rr)}
  return out;
}
function xlsxSheets(buf){
  return unzip(buf).then(function(L){
    var ss=[], sd=xml(L,'xl/sharedStrings.xml');
    if(sd) els(sd,'si').forEach(function(si){ss.push(strOf(si))});
    var wb=xml(L,'xl/workbook.xml'), rels=xml(L,'xl/_rels/workbook.xml.rels'), map={};
    if(rels) els(rels,'Relationship').forEach(function(r){var t=r.getAttribute('Target'); map[r.getAttribute('Id')]=t.charAt(0)==='/'?t.slice(1):'xl/'+t});
    var out=[];
    if(wb) els(wb,'sheet').forEach(function(s){
      var rid=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||s.getAttribute('r:id'), path=map[rid];
      if(path&&entry(L,path)) out.push({name:s.getAttribute('name')||path,rows:readSheet(xml(L,path),ss)});
    });
    if(!out.length){
      L.filter(function(f){return /^xl\/worksheets\/sheet\d+\.xml$/.test(f.name)}).forEach(function(f){out.push({name:f.name,rows:readSheet(xml(L,f.name),ss)})});
    }
    if(!out.length) throw new Error('Không tìm thấy trang tính nào trong file Excel');
    return out;
  });
}
function norm(s){return String(s==null?'':s).replace(/[đĐ]/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
var HDR={
  stt:/^(stt|tt|so tt|no\.?)$/,
  name:/hang muc|noi dung|ten cong viec|cong viec|mo ta|ten vat tu|dien giai|ten hang|danh muc|^ten$/,
  unit:/^(dvt|don vi( tinh)?|dv|dvt)$/,
  qty:/khoi luong|so luong|^kl$|^sl$/,
  price:/don gia/,
  total:/thanh tien/
};
function detect(rows){
  for(var r=0;r<Math.min(rows.length,40);r++){
    var map={}, hit=0;
    rows[r].forEach(function(c,i){
      var n=norm(c); if(!n||n.length>40) return;
      Object.keys(HDR).forEach(function(k){if(map[k]===undefined&&HDR[k].test(n)){map[k]=i; if(k!=='stt'&&k!=='total') hit++}});
    });
    if(map.name!==undefined&&hit>=3) return {hdr:r,map:map};
  }
  return null;
}
function num(v){
  if(typeof v==='number') return v;
  var s=String(v==null?'':v).replace(/[\s  đ₫]/g,'').replace(/[^\d.,\-]/g,'');
  if(!s||s==='-') return null;
  var hasD=s.indexOf('.')>=0, hasC=s.indexOf(',')>=0;
  if(hasD&&hasC){var dec=s.lastIndexOf('.')>s.lastIndexOf(',')?'.':','; s=dec==='.'?s.replace(/,/g,''):s.replace(/\./g,'').replace(',','.')}
  else if(hasD){if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'')}
  else if(hasC){s=/^-?\d{1,3}(,\d{3})+$/.test(s)?s.replace(/,/g,''):s.replace(',','.')}
  var n=parseFloat(s); return isNaN(n)?null:n;
}
/* map: {name,unit,qty,price,total} là chỉ số cột. Trả {items,skipped} */
function quoteItems(rows,hdr,map){
  var items=[], skipped=0;
  for(var r=hdr+1;r<rows.length;r++){
    var row=rows[r], name=String(map.name!==undefined?row[map.name]:'').trim();
    if(!name) continue;
    if(/^(tong|cong|thue|vat|gia tri|bang chu)/.test(norm(name))){skipped++; continue}
    var qty=map.qty!==undefined?num(row[map.qty]):null, price=map.price!==undefined?num(row[map.price]):null, tot=map.total!==undefined?num(row[map.total]):null;
    if(qty===null&&price===null&&tot===null){skipped++; continue}
    if(price===null&&tot!==null&&qty>0) price=tot/qty;
    if(qty===null&&price>0&&tot!==null) qty=tot/price;
    if(qty===null) qty=1;
    if(price===null) price=0;
    items.push({name:name,unit:map.unit!==undefined?String(row[map.unit]||'').trim():'',qty:qty,price:price});
  }
  return {items:items,skipped:skipped};
}

/* ---------- Word (.docx) ---------- */
var TAGRE=/\{\{\s*([\w.]+)\s*\}\}/g;
function partsOf(L){return L.filter(function(f){return /^word\/(document|header\d*|footer\d*)\.xml$/.test(f.name)}).map(function(f){return f.name})}
function ptext(p){return els(p,'t').map(function(t){return t.textContent}).join('')}
function setText(p,s){
  var ts=els(p,'t'); if(!ts.length) return;
  ts[0].textContent=s; ts[0].setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');
  for(var i=1;i<ts.length;i++) ts[i].textContent='';
}
function docxParas(buf){
  return unzip(buf).then(function(L){
    var d=xml(L,'word/document.xml'); if(!d) throw new Error('Không phải file Word .docx');
    var out=[], tags={};
    els(d,'p').forEach(function(p){var t=ptext(p).trim(); if(t){out.push(t); (t.match(TAGRE)||[]).forEach(function(m){tags[m.replace(/[{}\s]/g,'')]=1})}});
    return {paras:out,tags:Object.keys(tags)};
  });
}
/* vals: {tag: giá trị}, rules: [{find,tag}] → {blob,html,unknown[]} */
function docxFill(buf,vals,rules){
  var unknown={};
  function conv(s){
    (rules||[]).forEach(function(r){if(r.find&&s.indexOf(r.find)>=0) s=s.split(r.find).join('{{'+r.tag+'}}')});
    return s.replace(TAGRE,function(m,t){if(Object.prototype.hasOwnProperty.call(vals,t)) return vals[t]; unknown[t]=1; return m});
  }
  return unzip(buf).then(function(L){
    var html='';
    partsOf(L).forEach(function(name){
      var d=xml(L,name);
      els(d,'p').forEach(function(p){var t=ptext(p), n=conv(t); if(n!==t) setText(p,n)});
      entry(L,name).data=ser(d);
      if(name==='word/document.xml') html=renderBody(d);
    });
    return zip(L).then(function(blob){
      return {blob:new Blob([blob],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),html:html,unknown:Object.keys(unknown)};
    });
  });
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function on(el,tag){var x=kids(el,tag)[0]; if(!x) return false; var v=x.getAttribute('w:val')||x.getAttributeNS(NS_W,'val'); return !(v==='0'||v==='false'||v==='none')}
function renderPara(p){
  var pPr=kids(p,'pPr')[0], jc=pPr&&kids(pPr,'jc')[0], al=jc?(jc.getAttribute('w:val')||jc.getAttributeNS(NS_W,'val')):'';
  var style=al==='center'?'text-align:center':al==='right'||al==='end'?'text-align:right':al==='both'?'text-align:justify':'text-align:left';
  var h='';
  els(p,'r').forEach(function(r){
    var rPr=kids(r,'rPr')[0], b=rPr&&on(rPr,'b'), i=rPr&&on(rPr,'i'), u=rPr&&on(rPr,'u'), s='';
    Array.prototype.forEach.call(r.childNodes,function(c){
      if(c.nodeType!==1) return;
      if(c.localName==='t') s+=esc(c.textContent);
      else if(c.localName==='tab') s+='&emsp;';
      else if(c.localName==='br'||c.localName==='cr') s+='<br>';
    });
    if(!s) return;
    if(u) s='<u>'+s+'</u>'; if(i) s='<i>'+s+'</i>'; if(b) s='<b>'+s+'</b>';
    h+=s;
  });
  return '<p style="'+style+'">'+(h||'&nbsp;')+'</p>';
}
function renderBlocks(node){
  var h='';
  Array.prototype.forEach.call(node.childNodes,function(c){
    if(c.nodeType!==1) return;
    if(c.localName==='p') h+=renderPara(c);
    else if(c.localName==='tbl') h+=renderTable(c);
    else if(c.localName==='sdt'){var sc=kids(c,'sdtContent')[0]; if(sc) h+=renderBlocks(sc)}
  });
  return h;
}
function renderTable(t){
  var bord=kids(t,'tblPr')[0]&&els(kids(t,'tblPr')[0],'tblBorders').length;
  var h='<table class="tb" style="width:100%;border-collapse:collapse'+(bord?'':';border:0')+'">';
  kids(t,'tr').forEach(function(tr){
    h+='<tr>';
    kids(tr,'tc').forEach(function(tc){
      var pr=kids(tc,'tcPr')[0], gs=pr&&kids(pr,'gridSpan')[0], sp=gs?parseInt(gs.getAttribute('w:val')||gs.getAttributeNS(NS_W,'val'),10):1;
      h+='<td'+(sp>1?' colspan="'+sp+'"':'')+' style="vertical-align:top;padding:3px 6px;'+(bord?'border:1px solid #000':'')+'">'+renderBlocks(tc)+'</td>';
    });
    h+='</tr>';
  });
  return h+'</table>';
}
function renderBody(d){var b=els(d,'body')[0]; return b?renderBlocks(b):''}

window.FILES={put:put,get:get,del:del,unzip:unzip,zip:zip,xlsxSheets:xlsxSheets,detect:detect,quoteItems:quoteItems,docxParas:docxParas,docxFill:docxFill,norm:norm};
})();
