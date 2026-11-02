/* Biểu mẫu hợp đồng, biên bản, giấy tờ. Mẫu tham khảo theo cấu trúc thông dụng; cần đối chiếu quy định hiện hành
   và rà soát pháp lý trước khi ký. Thông tin công ty, khách hàng, dự án được điền tự động. */
(function(){
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var DOT='………………………';
function v(x,n){return x!==undefined&&x!==null&&String(x).trim()!==''?esc(x):'<span class="dot">'+(n||DOT)+'</span>'}
function up(x){return x?String(x).toUpperCase():''}
function d8(iso){if(!iso) return ''; var p=iso.split('-'); return p[2]+'/'+p[1]+'/'+p[0]}
function dlong(iso){if(!iso) return 'ngày …… tháng …… năm ……'; var p=iso.split('-'); return 'ngày '+parseInt(p[2],10)+' tháng '+parseInt(p[1],10)+' năm '+p[0]}
function money(n){return (Math.round(Number(n)||0)).toLocaleString('vi-VN')+' đồng'}
function docSo(n){
  n=Math.round(Number(n)||0); if(n<=0) return 'Không đồng';
  var U=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  function g3(x,full){
    var tr=Math.floor(x/100), ch=Math.floor(x%100/10), dv=x%10, s=[];
    if(full||tr>0) s.push(U[tr]+' trăm');
    if(ch>1){s.push(U[ch]+' mươi'); if(dv===1) s.push('mốt'); else if(dv===4) s.push('tư'); else if(dv===5) s.push('lăm'); else if(dv>0) s.push(U[dv])}
    else if(ch===1){s.push('mười'); if(dv===5) s.push('lăm'); else if(dv>0) s.push(U[dv])}
    else if(dv>0){if(full||tr>0) s.push('lẻ'); s.push(U[dv])}
    return s.join(' ');
  }
  var names=['','nghìn','triệu','tỷ','nghìn tỷ','triệu tỷ'], groups=[], out=[];
  while(n>0){groups.push(n%1000); n=Math.floor(n/1000)}
  for(var k=groups.length-1;k>=0;k--){var g=groups[k]; if(g===0) continue; out.push(g3(g,out.length>0)+(names[k]?' '+names[k]:''))}
  var s=out.join(' '); return s.charAt(0).toUpperCase()+s.slice(1)+' đồng chẵn';
}

/* ---------- khối dùng chung ---------- */
function partyB(c){var C=c.C; return {name:C.name,addr:C.addr,tax:C.tax,phone:C.phone,email:C.email,rep:C.rep,role:C.role,bank:(C.bankNo?C.bankNo+(C.bankName?' tại '+C.bankName:'')+(C.bankBranch?' - '+C.bankBranch:''):'')}}
function partyA(c){var A=c.A||{}; return {name:A.name,addr:A.addr,tax:A.idno,phone:A.phone,email:A.email,rep:A.rep,role:A.role,bank:A.bank}}
function party(tag,role,p){
  return '<p><b>'+tag+': '+v(up(p.name),'TÊN ĐƠN VỊ / CÁ NHÂN')+'</b> <i>('+role+')</i></p><ul class="pl">'+
    '<li>Địa chỉ: '+v(p.addr)+'</li><li>Mã số thuế / CCCD: '+v(p.tax)+'</li><li>Điện thoại: '+v(p.phone,'………')+' &nbsp; Email: '+v(p.email,'………')+'</li>'+
    '<li>Đại diện: '+v(p.rep)+' &nbsp; Chức vụ: '+v(p.role,'………')+'</li>'+(p.bank!==undefined?'<li>Tài khoản: '+v(p.bank)+'</li>':'')+'</ul>';
}
function quocHieu(){return '<div class="qh"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập – Tự do – Hạnh phúc</b><br>——————————</div>'}
function dateLine(c){return '<p class="dl"><i>'+v(c.F.noi||c.C.city,'……')+', '+dlong(c.F.ngay)+'</i></p>'}
function title(t,sub){return '<h1 class="dt">'+t+'</h1>'+(sub?'<p class="ds">'+sub+'</p>':'')}
function letterhead(c){
  var C=c.C;
  return '<table class="lh"><tr><td class="l">'+(C.logo?'<img src="'+C.logo+'" class="logo" alt=""><br>':'')+'<b>'+v(up(C.name),'TÊN CÔNG TY')+'</b><br>Số: '+v(c.F.so,'……/……')+'</td><td class="r"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập – Tự do – Hạnh phúc</b><br>————————<br><i>'+v(c.F.noi||C.city,'……')+', '+dlong(c.F.ngay)+'</i></td></tr></table>';
}
function sign(labels){
  return '<table class="sg"><tr>'+labels.map(function(l){return '<td><b>'+l+'</b><br><i>(Ký, ghi rõ họ tên'+(/Bên|BÊN|Chủ|CHỦ|Nhà thầu|NHÀ THẦU/.test(l)?', đóng dấu':'')+')</i><br><br><br><br></td>'}).join('')+'</tr></table>';
}
function basis(list){return '<p class="b"><i>'+list.join(';<br>')+'.</i></p>'}
var LAW=['Căn cứ Bộ luật Dân sự số 91/2015/QH13','Căn cứ Luật Xây dựng số 50/2014/QH13 và Luật số 62/2020/QH14 sửa đổi, bổ sung một số điều của Luật Xây dựng','Căn cứ Nghị định số 37/2015/NĐ-CP về hợp đồng xây dựng, được sửa đổi bởi Nghị định số 50/2021/NĐ-CP','Căn cứ Nghị định số 06/2021/NĐ-CP về quản lý chất lượng, thi công xây dựng và bảo trì công trình xây dựng'];
function dieu(n,t,body){return '<h2 class="d">Điều '+n+'. '+t+'</h2>'+body}
function contractInfo(c){
  var k=c.src&&c.srcType==='contract'?c.src:null; var val=k?k.value:(Number(c.F.giatri)||0);
  return {k:k,val:val,start:k?k.start:c.F.batdau,end:k?k.end:c.F.ketthuc,no:k?k.no:c.F.sohd};
}
function payTable(c,ci){
  var pays=ci.k&&ci.k.pays&&ci.k.pays.length?ci.k.pays:null;
  if(!pays) return '<p>Bên A thanh toán cho Bên B bằng chuyển khoản theo các đợt: '+v(c.F.thanhtoan,'đợt 1 …% khi ký hợp đồng; đợt 2 …% khi …; đợt cuối …% khi nghiệm thu bàn giao')+'.</p>';
  return '<table class="tb"><tr><th>Đợt</th><th>Nội dung</th><th>Số tiền (đồng)</th><th>Hạn thanh toán</th></tr>'+pays.map(function(p,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(p.label)+'</td><td style="text-align:right">'+Math.round(p.amt).toLocaleString('vi-VN')+'</td><td>'+d8(p.due)+'</td></tr>'}).join('')+'</table>';
}

var L=[];

/* 1. Hợp đồng tư vấn thiết kế */
L.push({id:'hd-thietke',group:'Hợp đồng',title:'Hợp đồng tư vấn thiết kế',src:'contract',needA:true,
 fields:[['giatri','Giá trị hợp đồng (đồng) nếu không chọn hồ sơ','number',''],['batdau','Ngày bắt đầu','date',''],['ketthuc','Ngày hoàn thành','date',''],['sohd','Số hợp đồng','text',''],['sobo','Số bộ hồ sơ bàn giao','text','02 bộ in và 01 bản mềm'],['chinhsua','Số lần chỉnh sửa miễn phí','text','03 lần cho mỗi giai đoạn'],['thanhtoan','Các đợt thanh toán (nếu không chọn hồ sơ)','textarea','']],
 build:function(c){
  var ci=contractInfo(c), P=c.P, ph=(c.deliv||[]);
  var phases={}; ph.forEach(function(d){(phases[d.phase]=phases[d.phase]||[]).push(d.name)});
  var scope=Object.keys(phases).length?'<ul>'+Object.keys(phases).map(function(k){return '<li><b>'+esc(k)+':</b> '+phases[k].map(esc).join('; ')+'</li>'}).join('')+'</ul>':'<p>'+v(c.F.phamvi,'Các giai đoạn khảo sát, ý tưởng, thiết kế cơ sở, thiết kế kỹ thuật thi công theo hồ sơ đã thống nhất')+'.</p>';
  return quocHieu()+title('HỢP ĐỒNG TƯ VẤN THIẾT KẾ','Số: '+v(ci.no,'……/HĐTK')+'<br>Công trình: '+v(P.name))+dateLine(c)+
   basis(LAW.slice(0,3).concat(['Căn cứ nhu cầu và khả năng của các bên']))+
   '<p>Hôm nay, '+dlong(c.F.ngay)+', tại '+v(c.F.noi||c.C.city,'………')+', chúng tôi gồm:</p>'+
   party('BÊN A','Bên giao thầu',partyA(c))+party('BÊN B','Bên nhận thầu',partyB(c))+
   '<p>Hai bên cùng thống nhất ký hợp đồng với các điều khoản sau:</p>'+
   dieu(1,'Nội dung công việc','<p>Bên B thực hiện tư vấn thiết kế '+v(P.type,'………')+' cho công trình <b>'+v(P.name)+'</b> tại '+v(P.addr)+', bao gồm:</p>'+scope)+
   dieu(2,'Giá trị hợp đồng và thanh toán','<p>Giá trị hợp đồng: <b>'+(ci.val?money(ci.val):'<span class="dot">………………… đồng</span>')+'</b> (bằng chữ: '+(ci.val?docSo(ci.val):'<span class="dot">…………………</span>')+'), chưa/đã bao gồm thuế giá trị gia tăng theo quy định.</p>'+payTable(c,ci))+
   dieu(3,'Tiến độ thực hiện','<p>Thời gian thực hiện từ '+(ci.start?d8(ci.start):'<span class="dot">……/……/……</span>')+' đến '+(ci.end?d8(ci.end):'<span class="dot">……/……/……</span>')+'. Tiến độ từng giai đoạn tính từ ngày Bên A cung cấp đủ thông tin, hồ sơ pháp lý và phản hồi bằng văn bản. Thời gian Bên A xem xét, phản hồi không tính vào tiến độ của Bên B.</p>')+
   dieu(4,'Hồ sơ bàn giao và chỉnh sửa','<ul><li>Hồ sơ bàn giao: '+v(c.F.sobo)+', ký xác nhận bằng biên bản.</li><li>Bên A được chỉnh sửa miễn phí: '+v(c.F.chinhsua)+'. Chỉnh sửa vượt số lần hoặc thay đổi ý tưởng đã duyệt được tính phí bổ sung theo thỏa thuận.</li><li>Mỗi giai đoạn được coi là hoàn thành khi Bên A xác nhận bằng văn bản hoặc không có ý kiến sau 05 ngày làm việc kể từ ngày nhận hồ sơ.</li></ul>')+
   dieu(5,'Quyền và nghĩa vụ của Bên A','<ul><li>Cung cấp đầy đủ, kịp thời hồ sơ pháp lý, hiện trạng, yêu cầu sử dụng và các thông tin cần thiết.</li><li>Thanh toán đúng hạn theo Điều 2.</li><li>Xem xét, phản hồi hồ sơ đúng thời hạn; thông báo bằng văn bản khi có thay đổi yêu cầu.</li></ul>')+
   dieu(6,'Quyền và nghĩa vụ của Bên B','<ul><li>Thực hiện công việc đúng nội dung, chất lượng, tiến độ; tuân thủ quy chuẩn, tiêu chuẩn xây dựng hiện hành.</li><li>Chịu trách nhiệm về chất lượng hồ sơ thiết kế do mình lập.</li><li>Giám sát tác giả trong quá trình thi công nếu hai bên có thỏa thuận riêng.</li><li>Được thanh toán đúng hạn; được tạm dừng công việc khi Bên A chậm thanh toán quá 10 ngày làm việc kể từ ngày đến hạn.</li></ul>')+
   dieu(7,'Quyền sở hữu trí tuệ','<p>Quyền tác giả đối với hồ sơ thiết kế thuộc về Bên B. Bên A được quyền sử dụng hồ sơ cho công trình nêu trên sau khi thanh toán đủ; không được chuyển giao cho bên thứ ba để xây dựng công trình khác hoặc sao chép cho mục đích thương mại nếu chưa có sự đồng ý bằng văn bản của Bên B.</p>')+
   dieu(8,'Vi phạm hợp đồng và giải quyết tranh chấp','<p>Bên vi phạm chịu phạt vi phạm: '+v(c.F.phat,'…………')+' giá trị phần nghĩa vụ bị vi phạm, không vượt mức tối đa theo quy định của pháp luật, và bồi thường thiệt hại thực tế (nếu có). Tranh chấp được giải quyết bằng thương lượng; nếu không thành thì đưa ra Tòa án có thẩm quyền nơi '+v(c.F.toa,'………')+'.</p>')+
   dieu(9,'Điều khoản chung','<p>Hợp đồng có hiệu lực kể từ ngày ký. Mọi sửa đổi, bổ sung phải lập thành phụ lục bằng văn bản có chữ ký của hai bên. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>')+
   sign(['ĐẠI DIỆN BÊN A','ĐẠI DIỆN BÊN B']);
 }});

/* 2. Hợp đồng thi công */
L.push({id:'hd-thicong',group:'Hợp đồng',title:'Hợp đồng thi công xây dựng',src:'contract',needA:true,
 fields:[['sohd','Số hợp đồng','text',''],['giatri','Giá trị hợp đồng (đồng) nếu không chọn hồ sơ','number',''],['batdau','Ngày khởi công','date',''],['ketthuc','Ngày hoàn thành','date',''],['loai','Hình thức hợp đồng','text','Trọn gói'],['tamung','Tạm ứng (% giá trị hợp đồng)','text','30%'],['baohanh','Thời gian bảo hành (tháng)','text','12'],['giulai','Tiền giữ lại bảo hành (%)','text','5%'],['phat','Mức phạt chậm tiến độ','text',''],['thanhtoan','Các đợt thanh toán (nếu không chọn hồ sơ)','textarea','']],
 build:function(c){
  var ci=contractInfo(c), P=c.P, q=(c.quotes||[])[0];
  var items=q?'<table class="tb"><tr><th>STT</th><th>Hạng mục</th><th>ĐVT</th><th>Khối lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>'+q.items.map(function(i,n){return '<tr><td>'+(n+1)+'</td><td>'+esc(i.name)+'</td><td>'+esc(i.unit)+'</td><td style="text-align:right">'+i.qty.toLocaleString('vi-VN')+'</td><td style="text-align:right">'+Math.round(i.price).toLocaleString('vi-VN')+'</td><td style="text-align:right">'+Math.round(i.qty*i.price).toLocaleString('vi-VN')+'</td></tr>'}).join('')+'</table><p><i>Danh mục theo báo giá '+esc(q.no)+' đã được Bên A chấp nhận.</i></p>':'<p>Danh mục hạng mục, khối lượng, đơn giá theo bảng dự toán/báo giá đính kèm (Phụ lục 01), là một phần không tách rời của hợp đồng.</p>';
  return quocHieu()+title('HỢP ĐỒNG THI CÔNG XÂY DỰNG','Số: '+v(ci.no,'……/HĐTC')+'<br>Công trình: '+v(P.name))+dateLine(c)+
   basis(LAW.concat(['Căn cứ hồ sơ thiết kế, bản vẽ và dự toán được hai bên thống nhất'])) +
   '<p>Hôm nay, '+dlong(c.F.ngay)+', tại '+v(c.F.noi||c.C.city,'………')+', chúng tôi gồm:</p>'+
   party('BÊN A','Chủ đầu tư / Bên giao thầu',partyA(c))+party('BÊN B','Nhà thầu / Bên nhận thầu',partyB(c))+
   (c.C.cert?'<p>Bên B có chứng chỉ năng lực hoạt động xây dựng: '+esc(c.C.cert)+'.</p>':'')+
   '<p>Hai bên thống nhất ký hợp đồng thi công với các điều khoản sau:</p>'+
   dieu(1,'Nội dung công việc','<p>Bên B thi công công trình <b>'+v(P.name)+'</b> tại '+v(P.addr)+', hình thức hợp đồng: '+v(c.F.loai,'………')+'. Phạm vi công việc gồm:</p>'+items)+
   dieu(2,'Giá hợp đồng và thanh toán','<p>Giá hợp đồng: <b>'+(ci.val?money(ci.val):'<span class="dot">………………… đồng</span>')+'</b> (bằng chữ: '+(ci.val?docSo(ci.val):'<span class="dot">…………………</span>')+'), chưa/đã bao gồm thuế giá trị gia tăng.</p><p>Tạm ứng: '+v(c.F.tamung,'…%')+' giá trị hợp đồng sau khi ký. Các đợt thanh toán tiếp theo thực hiện theo tiến độ và khối lượng đã được nghiệm thu:</p>'+payTable(c,ci)+'<p>Khối lượng phát sinh, thay đổi so với thiết kế chỉ được thanh toán khi có xác nhận bằng văn bản của Bên A trước khi thi công. Bên A giữ lại '+v(c.F.giulai,'…%')+' giá trị hợp đồng làm tiền bảo hành, hoàn trả sau khi hết thời hạn bảo hành.</p>')+
   dieu(3,'Tiến độ thi công','<p>Ngày khởi công: '+(ci.start?d8(ci.start):'<span class="dot">……/……/……</span>')+'. Ngày hoàn thành: '+(ci.end?d8(ci.end):'<span class="dot">……/……/……</span>')+'. Tiến độ được điều chỉnh khi có thay đổi thiết kế, điều kiện bất khả kháng hoặc Bên A chậm bàn giao mặt bằng, chậm thanh toán, chậm quyết định các nội dung cần Bên A chọn.</p>')+
   dieu(4,'Chất lượng, vật tư và nghiệm thu','<ul><li>Bên B thi công đúng hồ sơ thiết kế, tiêu chuẩn kỹ thuật và chỉ dẫn của hợp đồng.</li><li>Vật tư đưa vào công trình đúng chủng loại đã chốt, có chứng nhận xuất xứ, chất lượng (CO, CQ); vật tư thuộc danh mục thí nghiệm phải có kết quả đạt trước khi sử dụng.</li><li>Các công việc bị che khuất (thép, cốp pha, điện nước âm, chống thấm…) phải được nghiệm thu bằng biên bản và có ảnh lưu trước khi che lấp hoặc đổ bê tông.</li><li>Nghiệm thu theo từng công việc, từng giai đoạn và hoàn thành. Bên A hoặc tư vấn giám sát có quyền yêu cầu dừng thi công khi phát hiện sai phạm nghiêm trọng.</li></ul>')+
   dieu(5,'Bảo hành','<p>Thời gian bảo hành công trình: '+v(c.F.baohanh,'12')+' tháng kể từ ngày nghiệm thu bàn giao. Bên B sửa chữa các lỗi thuộc trách nhiệm của mình trong vòng 07 ngày kể từ khi nhận thông báo (trừ trường hợp khẩn cấp xử lý ngay). Bảo hành không áp dụng đối với hư hỏng do sử dụng sai, tự ý cải tạo hoặc bất khả kháng.</p>')+
   dieu(6,'Quyền và nghĩa vụ của Bên A','<ul><li>Bàn giao mặt bằng, cung cấp hồ sơ pháp lý, giấy phép xây dựng (nếu có) đúng thời hạn.</li><li>Thanh toán đúng hạn; xác nhận khối lượng và nghiệm thu kịp thời.</li><li>Kiểm tra, giám sát chất lượng và tiến độ nhưng không can thiệp trái quy trình kỹ thuật của Bên B.</li></ul>')+
   dieu(7,'Quyền và nghĩa vụ của Bên B','<ul><li>Tổ chức thi công, bố trí nhân lực, thiết bị, vật tư đảm bảo chất lượng và tiến độ.</li><li>Bảo đảm an toàn lao động, phòng cháy chữa cháy, vệ sinh môi trường và an toàn cho các công trình lân cận.</li><li>Lập nhật ký thi công, hồ sơ nghiệm thu, hồ sơ hoàn công; bàn giao đầy đủ khi hoàn thành.</li><li>Chịu trách nhiệm đối với nhà thầu phụ, tổ đội do mình thuê.</li></ul>')+
   dieu(8,'Vi phạm, phạt vi phạm và giải quyết tranh chấp','<p>Mức phạt chậm tiến độ do lỗi của Bên B: '+v(c.F.phat,'…………')+', không vượt mức tối đa theo quy định của pháp luật. Bên A chậm thanh toán chịu lãi theo lãi suất do hai bên thỏa thuận hoặc theo quy định. Tranh chấp giải quyết bằng thương lượng; nếu không thành thì đưa ra Tòa án có thẩm quyền.</p>')+
   dieu(9,'Điều khoản chung','<p>Hợp đồng có hiệu lực từ ngày ký và chấm dứt khi hai bên hoàn thành nghĩa vụ, kể cả nghĩa vụ bảo hành và thanh toán. Mọi sửa đổi, bổ sung lập bằng phụ lục có chữ ký của hai bên. Hợp đồng được lập thành 02 bản có giá trị như nhau, mỗi bên giữ 01 bản.</p>')+
   sign(['ĐẠI DIỆN BÊN A','ĐẠI DIỆN BÊN B']);
 }});

/* 3. Hợp đồng giao khoán nhân công */
L.push({id:'hd-nhancong',group:'Hợp đồng',title:'Hợp đồng giao khoán nhân công',src:'contract',needA:false,
 fields:[['sohd','Số hợp đồng','text',''],['tentd','Tên tổ đội / người nhận khoán','text',''],['cccd','CCCD người nhận khoán','text',''],['diachitd','Địa chỉ người nhận khoán','text',''],['sdttd','Điện thoại','text',''],['phamvi','Công việc nhận khoán','textarea',''],['dongia','Đơn giá, khối lượng (mô tả)','textarea',''],['giatri','Giá trị khoán (đồng)','number',''],['batdau','Ngày bắt đầu','date',''],['ketthuc','Ngày hoàn thành','date',''],['baohanh','Bảo hành phần việc (tháng)','text','06']],
 build:function(c){
  var ci=contractInfo(c), P=c.P, F=c.F;
  return quocHieu()+title('HỢP ĐỒNG GIAO KHOÁN NHÂN CÔNG','Số: '+v(ci.no,'……/HĐNC')+'<br>Công trình: '+v(P.name))+dateLine(c)+
   basis(['Căn cứ Bộ luật Dân sự số 91/2015/QH13','Căn cứ nhu cầu và khả năng của hai bên'])+
   party('BÊN A','Bên giao khoán',partyB(c))+
   party('BÊN B','Bên nhận khoán',{name:F.tentd,addr:F.diachitd,tax:F.cccd,phone:F.sdttd,email:'',rep:F.tentd,role:'Tổ trưởng / Chủ thầu',bank:undefined})+
   dieu(1,'Công việc giao khoán','<p>Bên A giao Bên B thi công phần nhân công: '+v(F.phamvi,'…………')+' tại công trình <b>'+v(P.name)+'</b>, địa chỉ '+v(P.addr)+'.</p><p>Khối lượng, đơn giá: '+v(F.dongia,'theo bảng khối lượng đính kèm')+'.</p>')+
   dieu(2,'Giá trị và thanh toán','<p>Giá trị khoán tạm tính: <b>'+(ci.val?money(ci.val):'<span class="dot">………………… đồng</span>')+'</b> (bằng chữ: '+(ci.val?docSo(ci.val):'<span class="dot">…………………</span>')+'). Giá trị quyết toán theo khối lượng thực tế nghiệm thu.</p>'+payTable(c,ci)+'<p>Bên A giữ lại 05% giá trị mỗi đợt, thanh toán khi hết thời hạn bảo hành phần việc.</p>')+
   dieu(3,'Thời gian thực hiện','<p>Từ '+(ci.start?d8(ci.start):'<span class="dot">……/……/……</span>')+' đến '+(ci.end?d8(ci.end):'<span class="dot">……/……/……</span>')+'. Chậm tiến độ do lỗi Bên B kéo dài quá 05 ngày, Bên A có quyền điều động thêm nhân lực và trừ chi phí vào giá trị khoán.</p>')+
   dieu(4,'Chất lượng và nghiệm thu','<ul><li>Thi công đúng bản vẽ, biện pháp và hướng dẫn kỹ thuật của Bên A; sửa chữa miễn phí phần việc không đạt.</li><li>Vật tư do Bên A cấp được quản lý, sử dụng đúng định mức; hao hụt vượt định mức do lỗi Bên B được trừ vào giá trị khoán.</li><li>Nghiệm thu từng công việc trước khi chuyển bước; không tự ý che lấp phần việc chưa nghiệm thu.</li></ul>')+
   dieu(5,'An toàn lao động','<p>Bên B tự chịu trách nhiệm về an toàn của người lao động do mình thuê, trang bị bảo hộ lao động theo quy định, chấp hành nội quy công trường. Tai nạn xảy ra do vi phạm an toàn thuộc trách nhiệm của Bên B.</p>')+
   dieu(6,'Bảo hành và điều khoản chung','<p>Thời gian bảo hành phần việc: '+v(F.baohanh,'06')+' tháng kể từ ngày nghiệm thu. Hợp đồng lập thành 02 bản, có hiệu lực từ ngày ký; tranh chấp ưu tiên thương lượng, không thành thì đưa ra Tòa án có thẩm quyền.</p>')+
   sign(['ĐẠI DIỆN BÊN A','BÊN B (NGƯỜI NHẬN KHOÁN)']);
 }});

/* 4. Biên bản nghiệm thu công việc xây dựng */
L.push({id:'bb-ntcv',group:'Biên bản',title:'Biên bản nghiệm thu công việc xây dựng',src:'',needA:true,
 fields:[['hangmuc','Hạng mục','text',''],['congviec','Công việc được nghiệm thu','text',''],['vitri','Vị trí','text',''],['tgbd','Bắt đầu nghiệm thu (ngày giờ)','text',''],['tgkt','Kết thúc nghiệm thu','text',''],['tvgs','Đại diện tư vấn giám sát','text',''],['cdt','Đại diện bên A (họ tên, chức vụ)','text',''],['nt','Đại diện nhà thầu (họ tên, chức vụ)','text',''],['taiLieu','Tài liệu làm căn cứ nghiệm thu','textarea','Bản vẽ thi công được duyệt; chỉ dẫn kỹ thuật; kết quả thí nghiệm vật liệu; nhật ký thi công; ảnh trước khi che khuất'],['danhgia','Đánh giá chất lượng','textarea','Công việc thi công đúng thiết kế, đạt yêu cầu kỹ thuật'],['ketluan','Kết luận','select','Chấp nhận nghiệm thu, cho phép chuyển sang công việc tiếp theo|Chưa chấp nhận nghiệm thu, cần sửa chữa các tồn tại sau'],['tonTai','Tồn tại cần sửa (nếu có)','textarea','']],
 build:function(c){
  var F=c.F, P=c.P;
  return letterhead(c)+title('BIÊN BẢN NGHIỆM THU CÔNG VIỆC XÂY DỰNG','Công việc: '+v(F.congviec))+
   '<p><b>1. Công trình:</b> '+v(P.name)+'. Địa điểm: '+v(P.addr)+'.</p><p><b>2. Hạng mục / vị trí:</b> '+v(F.hangmuc)+' – '+v(F.vitri)+'.</p>'+
   '<p><b>3. Thời gian nghiệm thu:</b> bắt đầu '+v(F.tgbd,'……giờ…… ngày……')+'; kết thúc '+v(F.tgkt,'……giờ…… ngày……')+'.</p>'+
   '<p><b>4. Thành phần tham gia nghiệm thu:</b></p><ul class="pl"><li>Đại diện chủ đầu tư (Bên A): '+v(F.cdt||(c.A&&c.A.rep))+'</li><li>Đại diện tư vấn giám sát: '+v(F.tvgs)+'</li><li>Đại diện nhà thầu thi công: '+v(F.nt||c.C.rep)+' – '+v(c.C.name,'………')+'</li></ul>'+
   '<p><b>5. Tài liệu làm căn cứ nghiệm thu:</b></p><p>'+v(F.taiLieu,'…………').replace(/\n/g,'<br>')+'</p>'+
   '<p><b>6. Đánh giá chất lượng công việc xây dựng đã thực hiện:</b></p><p>'+v(F.danhgia,'…………').replace(/\n/g,'<br>')+'</p>'+
   '<p><b>7. Kết luận:</b> '+v(F.ketluan)+'.</p>'+(F.tonTai?'<p>Các tồn tại cần khắc phục: '+esc(F.tonTai).replace(/\n/g,'<br>')+'</p>':'')+
   '<p>Biên bản được lập thành '+v(F.soban,'03')+' bản, mỗi bên giữ 01 bản có giá trị như nhau.</p>'+
   sign(['ĐẠI DIỆN CHỦ ĐẦU TƯ','TƯ VẤN GIÁM SÁT','NHÀ THẦU THI CÔNG']);
 }});

/* 5. Biên bản nghiệm thu vật liệu */
L.push({id:'bb-ntvl',group:'Biên bản',title:'Biên bản nghiệm thu vật liệu trước khi sử dụng',src:'lot',needA:true,
 fields:[['hangmuc','Hạng mục sử dụng','text',''],['tvgs','Đại diện tư vấn giám sát','text',''],['qc','Cán bộ QC / kỹ thuật nhà thầu','text',''],['kho','Đại diện kho, giám sát hiện trường','text',''],['quycach','Quy cách, chủng loại','text',''],['ketqua','Kết quả thí nghiệm / hồ sơ kèm theo','textarea','CO, CQ, phiếu giao hàng'],['danhgia','Kết luận','select','Vật liệu đạt yêu cầu, cho phép đưa vào sử dụng|Vật liệu chưa đạt, không được đưa vào sử dụng']],
 build:function(c){
  var F=c.F, P=c.P, o=c.srcType==='lot'?c.src:null, m=o?(c.mats||[]).filter(function(x){return x.id===o.mat})[0]:null;
  var ck=o&&c.CK?c.CK.map(function(x){return '<tr><td>'+esc(x[1])+'</td><td style="text-align:center">'+(o.checks&&o.checks[x[0]]?'Đạt':'Không đạt')+'</td></tr>'}).join(''):'';
  return letterhead(c)+title('BIÊN BẢN NGHIỆM THU VẬT LIỆU','Trước khi đưa vào sử dụng')+
   '<p><b>1. Công trình:</b> '+v(P.name)+'. Hạng mục sử dụng: '+v(F.hangmuc)+'.</p>'+
   '<p><b>2. Thành phần nghiệm thu:</b> Tư vấn giám sát: '+v(F.tvgs)+'; QC nhà thầu: '+v(F.qc||c.C.rep)+'; hiện trường: '+v(F.kho)+'.</p>'+
   '<p><b>3. Vật liệu nghiệm thu:</b></p><table class="tb"><tr><th>Tên vật liệu</th><th>Quy cách</th><th>Số lượng</th><th>Nhà cung cấp</th><th>Số lô / phiếu</th><th>Ngày nhận</th></tr><tr><td>'+v(m&&m.name)+'</td><td>'+v(F.quycach||(m&&m.spec))+'</td><td>'+(o?o.qty.toLocaleString('vi-VN')+' '+esc(m?m.unit:''):'……')+'</td><td>'+v(o&&o.supplier,'………')+'</td><td>'+v(o&&o.no,'………')+'</td><td>'+(o?d8(o.date):'………')+'</td></tr></table>'+
   '<p><b>4. Tiêu chuẩn áp dụng:</b> '+v(m&&m.std)+'.</p>'+
   (ck?'<p><b>5. Kiểm tra tiếp nhận:</b></p><table class="tb"><tr><th>Tiêu chí</th><th>Kết quả</th></tr>'+ck+'</table>':'<p><b>5. Kiểm tra tiếp nhận:</b> kiểm tra chứng nhận xuất xứ, chất lượng, ngoại quan, số lượng, đối chiếu mẫu đã duyệt.</p>')+
   '<p><b>6. Hồ sơ kèm theo / kết quả thí nghiệm:</b> '+v(F.ketqua,'…………').replace(/\n/g,'<br>')+'.</p>'+
   '<p><b>7. Kết luận:</b> '+v(F.danhgia)+'.</p>'+sign(['TƯ VẤN GIÁM SÁT','QC NHÀ THẦU','GIÁM SÁT HIỆN TRƯỜNG']);
 }});

/* 6. Biên bản thử nước chống thấm */
L.push({id:'bb-thunuoc',group:'Biên bản',title:'Biên bản thử nước chống thấm',src:'',needA:true,
 fields:[['khuvuc','Khu vực chống thấm','text',''],['vatlieu','Vật liệu, số lớp','text',''],['tgbd','Thời điểm bắt đầu ngâm','text',''],['tgkt','Thời điểm kết thúc','text','Sau tối thiểu 24 giờ'],['mucnuoc','Mức nước ngâm','text',''],['ketqua','Kết quả','select','Không thấm, đạt yêu cầu, cho phép thi công lớp tiếp theo|Có dấu hiệu thấm, chưa đạt, cần xử lý lại'],['ghichu','Ghi chú, vị trí thấm','textarea',''],['gs','Đại diện giám sát / bên A','text',''],['nt','Đại diện nhà thầu','text','']],
 build:function(c){var F=c.F,P=c.P; return letterhead(c)+title('BIÊN BẢN THỬ NƯỚC CHỐNG THẤM')+
  '<p><b>Công trình:</b> '+v(P.name)+'. <b>Khu vực:</b> '+v(F.khuvuc)+'.</p><p><b>Vật liệu chống thấm, số lớp:</b> '+v(F.vatlieu)+'.</p>'+
  '<p>Chống thấm đã thi công đủ số lớp, dâng chân tường đúng chiều cao thiết kế, xử lý cổ ống xuyên sàn. Tiến hành bịt phễu thu, ngâm nước mức '+v(F.mucnuoc,'…… cm')+'.</p>'+
  '<p>Bắt đầu: '+v(F.tgbd,'……giờ…… ngày……')+'. Kết thúc: '+v(F.tgkt)+'.</p><p><b>Kết quả:</b> '+v(F.ketqua)+'.</p>'+(F.ghichu?'<p>Ghi chú: '+esc(F.ghichu).replace(/\n/g,'<br>')+'</p>':'')+
  '<p>Đính kèm ảnh chụp trước khi ngâm, sau khi ngâm và mặt dưới sàn (nếu có).</p>'+sign(['ĐẠI DIỆN '+up(F.gs?'GIÁM SÁT / BÊN A':'GIÁM SÁT / BÊN A'),'ĐẠI DIỆN NHÀ THẦU'])}});

/* 7. Biên bản nghiệm thu hoàn thành, bàn giao */
L.push({id:'bb-bangiao',group:'Biên bản',title:'Biên bản nghiệm thu hoàn thành và bàn giao',src:'',needA:true,
 fields:[['hangmuc','Hạng mục / công trình bàn giao','text',''],['hoso','Hồ sơ bàn giao','textarea','Bản vẽ hoàn công; hồ sơ nghiệm thu; sơ đồ điện nước âm; phiếu bảo hành thiết bị; hướng dẫn sử dụng'],['tonTai','Danh mục tồn tại cần xử lý (punch list)','textarea',''],['hantonTai','Hạn hoàn thành tồn tại','date',''],['baohanh','Thời gian bảo hành (tháng)','text','12'],['thanhtoan','Số tiền còn phải thanh toán / giữ lại bảo hành','text',''],['cdt','Đại diện bên A','text',''],['nt','Đại diện nhà thầu','text','']],
 build:function(c){var F=c.F,P=c.P; return letterhead(c)+title('BIÊN BẢN NGHIỆM THU HOÀN THÀNH VÀ BÀN GIAO','Công trình: '+v(P.name))+
  '<p><b>1. Căn cứ:</b> hợp đồng số '+v(c.F.sohd,'……')+'; hồ sơ thiết kế; các biên bản nghiệm thu công việc, giai đoạn đã lập.</p>'+
  '<p><b>2. Thành phần:</b> Bên A: '+v(F.cdt||(c.A&&c.A.rep))+'; Nhà thầu: '+v(F.nt||c.C.rep)+'.</p><p><b>3. Hạng mục bàn giao:</b> '+v(F.hangmuc||P.name)+', địa chỉ '+v(P.addr)+'.</p>'+
  '<p><b>4. Hồ sơ bàn giao:</b></p><p>'+v(F.hoso).replace(/\n/g,'<br>')+'</p>'+
  '<p><b>5. Danh mục tồn tại:</b> '+(F.tonTai?esc(F.tonTai).replace(/\n/g,'<br>')+'<br>Nhà thầu hoàn thành trước ngày '+d8(F.hantonTai||'')+'.':'không có.')+'</p>'+
  '<p><b>6. Bảo hành:</b> '+v(F.baohanh,'12')+' tháng kể từ ngày ký biên bản này. Nhà thầu có trách nhiệm sửa chữa lỗi thuộc phạm vi bảo hành khi nhận thông báo.</p>'+
  '<p><b>7. Thanh toán:</b> '+v(F.thanhtoan,'theo hợp đồng')+'.</p><p><b>8. Kết luận:</b> công trình được nghiệm thu hoàn thành, hai bên đồng ý bàn giao và đưa vào sử dụng. Biên bản lập thành 02 bản có giá trị như nhau.</p>'+
  sign(['ĐẠI DIỆN BÊN A (NHẬN BÀN GIAO)','ĐẠI DIỆN NHÀ THẦU (BÀN GIAO)'])}});

/* 8. Biên bản họp / làm việc */
L.push({id:'bb-hop',group:'Biên bản',title:'Biên bản họp, làm việc',src:'minute',needA:false,
 fields:[['chuta','Chủ trì','text',''],['thuky','Thư ký','text',''],['tgbd','Thời gian bắt đầu','text',''],['tgkt','Kết thúc','text',''],['noidung','Nội dung (nếu không chọn hồ sơ)','textarea',''],['ketluan','Kết luận và phân công','textarea','']],
 build:function(c){var F=c.F,P=c.P,m=c.srcType==='minute'?c.src:null;
  return letterhead(c)+title('BIÊN BẢN '+(m?up(m.type):'HỌP'),(m?esc(m.title):v(F.chude,'Nội dung cuộc họp'))+'<br>Công trình: '+v(P.name))+
  '<p><b>Thời gian:</b> '+v(F.tgbd||(m&&d8(m.date)),'………')+(F.tgkt?' đến '+esc(F.tgkt):'')+'. <b>Địa điểm:</b> '+v(m&&m.place||F.noi||c.C.city)+'.</p><p><b>Chủ trì:</b> '+v(F.chuta)+'. <b>Thư ký:</b> '+v(F.thuky)+'.</p>'+
  '<p><b>Thành phần tham dự:</b> '+v(m&&m.attendees,'………')+'</p><p><b>Nội dung:</b></p><p>'+v((m&&m.content)||F.noidung,'…………').replace(/\n/g,'<br>')+'</p><p><b>Kết luận và phân công:</b></p><p>'+v(F.ketluan,'…………').replace(/\n/g,'<br>')+'</p>'+
  '<p>Cuộc họp kết thúc lúc '+v(F.tgkt,'……')+', biên bản được các bên cùng thông qua và ký xác nhận.</p>'+sign(['CHỦ TRÌ','THƯ KÝ','ĐẠI DIỆN CÁC BÊN'])}});

/* 9. Giấy đề nghị thanh toán */
L.push({id:'dn-thanhtoan',group:'Giấy tờ',title:'Giấy đề nghị thanh toán',src:'pay',needA:true,
 fields:[['dot','Đợt thanh toán (nếu không chọn)','text',''],['sotien','Số tiền (đồng) nếu không chọn','number',''],['khoiluong','Khối lượng, công việc đã hoàn thành','textarea',''],['hosokem','Hồ sơ kèm theo','text','Biên bản nghiệm thu khối lượng; hóa đơn; bảng xác nhận khối lượng']],
 build:function(c){var F=c.F,P=c.P,k=c.srcType==='pay'?c.src.k:null,y=c.srcType==='pay'?c.src.y:null,amt=y?y.amt:Number(F.sotien)||0;
  return letterhead(c)+title('GIẤY ĐỀ NGHỊ THANH TOÁN','Kính gửi: '+v(up(c.A&&c.A.name),'BÊN A'))+
  '<p>Căn cứ hợp đồng số '+v(k&&k.no||F.sohd)+', công trình <b>'+v(P.name)+'</b>, '+v(c.C.name,'………')+' đề nghị Quý khách hàng thanh toán:</p>'+
  '<table class="tb"><tr><th>Nội dung</th><th>Số tiền</th></tr><tr><td>'+v(y&&y.label||F.dot)+'</td><td style="text-align:right">'+(amt?Math.round(amt).toLocaleString('vi-VN')+' đồng':'………')+'</td></tr></table>'+
  '<p>Bằng chữ: <i>'+(amt?docSo(amt):'……………')+'</i>.</p><p><b>Khối lượng, công việc đã hoàn thành:</b> '+v(F.khoiluong).replace(/\n/g,'<br>')+'</p><p><b>Hồ sơ kèm theo:</b> '+v(F.hosokem)+'.</p>'+
  '<p><b>Thông tin nhận thanh toán:</b> '+v(partyB(c).bank)+' – Chủ tài khoản: '+v(up(c.C.name))+'.</p>'+sign(['XÁC NHẬN CỦA BÊN A','ĐẠI DIỆN BÊN B','NGƯỜI LẬP'])}});

/* 10. Báo giá */
L.push({id:'bao-gia',group:'Giấy tờ',title:'Bảng báo giá',src:'quote',needA:true,
 fields:[['hieuluc','Báo giá có hiệu lực (ngày)','text','30'],['ghichu','Ghi chú, điều kiện','textarea','Đơn giá chưa bao gồm các hạng mục phát sinh ngoài bản vẽ. Tiến độ tính từ ngày ký hợp đồng.']],
 build:function(c){var F=c.F,P=c.P,q=c.srcType==='quote'?c.src:null; var sub=q?q.items.reduce(function(s,i){return s+i.qty*i.price},0):0, vat=q?sub*q.vat/100:0;
  return letterhead(c)+title('BẢNG BÁO GIÁ',q?'Số '+esc(q.no)+' – '+esc(q.title):'')+
  '<p>Kính gửi: <b>'+v(up(c.A&&c.A.name),'KHÁCH HÀNG')+'</b>. Công trình: <b>'+v(P.name)+'</b>, '+v(P.addr)+'.</p>'+
  (q?'<table class="tb"><tr><th>STT</th><th>Hạng mục</th><th>ĐVT</th><th>Khối lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>'+q.items.map(function(i,n){return '<tr><td>'+(n+1)+'</td><td>'+esc(i.name)+'</td><td>'+esc(i.unit)+'</td><td style="text-align:right">'+i.qty.toLocaleString('vi-VN')+'</td><td style="text-align:right">'+Math.round(i.price).toLocaleString('vi-VN')+'</td><td style="text-align:right">'+Math.round(i.qty*i.price).toLocaleString('vi-VN')+'</td></tr>'}).join('')+'<tr><td colspan="5"><b>Cộng</b></td><td style="text-align:right"><b>'+Math.round(sub).toLocaleString('vi-VN')+'</b></td></tr><tr><td colspan="5">Thuế GTGT ('+q.vat+'%)</td><td style="text-align:right">'+Math.round(vat).toLocaleString('vi-VN')+'</td></tr><tr><td colspan="5"><b>Tổng thanh toán</b></td><td style="text-align:right"><b>'+Math.round(sub+vat).toLocaleString('vi-VN')+'</b></td></tr></table><p>Bằng chữ: <i>'+docSo(sub+vat)+'</i>.</p>':'<p class="dot">Chọn một báo giá ở mục "Hồ sơ nguồn" để điền bảng khối lượng.</p>')+
  '<p>Báo giá có hiệu lực trong '+v(F.hieuluc,'30')+' ngày kể từ ngày lập. '+esc(F.ghichu||'').replace(/\n/g,'<br>')+'</p>'+sign(['XÁC NHẬN CỦA KHÁCH HÀNG','ĐẠI DIỆN '+up(c.C.name||'CÔNG TY')])}});

window.FORMS={list:L,docSo:docSo,money:money,esc:esc};
})();
