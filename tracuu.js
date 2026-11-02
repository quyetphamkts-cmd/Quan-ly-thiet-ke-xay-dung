/* Tra cứu tài liệu gốc: nạp Markdown/ZIP vào IndexedDB của trình duyệt, tra theo trang. Phụ thuộc window.FILES. */
(function(){
var cache={};   // id -> {id,name,method,status,pages:[{n,t}]}
function parseMd(text,fname,idHint){
  var m=/^(\d\d)_/.exec(fname), id=idHint||(m?'DOC'+m[1]:'F'+Date.now().toString(36)+Math.floor(Math.random()*999));
  var title=(/^#\s+(.+)$/m.exec(text)||[0,fname])[1].trim();
  var ocr=/OCR T[ẠẢ]M/i.test(text.slice(0,1500));
  var pages=[], re=/^## Trang PDF (\d+)\s*$/mg, hits=[], x;
  while((x=re.exec(text))) hits.push({n:parseInt(x[1],10),i:x.index,e:re.lastIndex});
  if(hits.length){
    hits.forEach(function(h,k){pages.push({n:h.n,t:text.slice(h.e,k+1<hits.length?hits[k+1].i:text.length).trim()})});
  }else{
    var parts=text.replace(/^#\s+.+\n/,'').split(/\n{2,}/), cur='', k=0;
    parts.forEach(function(p){if(cur.length+p.length>2500&&cur){pages.push({n:++k,t:cur.trim()}); cur=''} cur+=p+'\n\n'});
    if(cur.trim()) pages.push({n:++k,t:cur.trim()});
  }
  return {id:id,name:title.replace(/\.(pdf|docx?)$/i,''),file:fname,pdf:hits.length>0,method:ocr?'OCR tạm (Tesseract, tiếng Anh)':(hits.length?'Trích xuất':'Trích xuất trực tiếp từ Word'),ocr:ocr,pages:pages};
}
function save(d){return FILES.put('tl:'+d.id,d)}
function load(id){if(cache[id]) return Promise.resolve(cache[id]); return FILES.get('tl:'+id).then(function(d){if(d) cache[id]=d; return d})}
function addText(text,fname,idHint){var d=parseMd(text,fname,idHint); cache[d.id]=d; return save(d).then(function(){return d})}
function addFile(fl){
  if(/\.zip$/i.test(fl.name)){
    return fl.arrayBuffer().then(FILES.unzip).then(function(L){
      var md=L.filter(function(f){return /\.md$/i.test(f.name)&&!/(^|\/)(00_|CHUNKS\/)/.test(f.name)});
      return Promise.all(md.map(function(f){return addText(new TextDecoder().decode(f.data),f.name.split('/').pop())}));
    });
  }
  return fl.text().then(function(t){return addText(t,fl.name)}).then(function(d){return [d]});
}
function remove(id){delete cache[id]; return FILES.del('tl:'+id)}
window.TRACUU={cache:cache,load:load,addFile:addFile,addText:addText,remove:remove};
})();
