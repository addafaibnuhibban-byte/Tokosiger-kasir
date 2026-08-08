const KEY='TOKO_SIGER_V2';
const DEFAULT={sales:[],exp:[],stock:{isi:20,kosong:0},cfg:{name:'TOKO SIGER',buy:18500,sell:21000}};
let db;
try{db=JSON.parse(localStorage.getItem(KEY))||structuredClone(DEFAULT)}catch(e){db=structuredClone(DEFAULT)}
if(!db.stock||typeof db.stock.isi!=='number')db.stock={isi:20,kosong:0};
if(!db.cfg)db.cfg={name:'TOKO SIGER',buy:18500,sell:21000};
if(!Array.isArray(db.sales))db.sales=[];
if(!Array.isArray(db.exp))db.exp=[];

const $=id=>document.getElementById(id);
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const date=d=>new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
function save(){localStorage.setItem(KEY,JSON.stringify(db));$('title').textContent=db.cfg.name||'TOKO SIGER'}
function totals(){
 const rev=db.sales.reduce((x,s)=>x+Number(s.total||0),0);
 const cost=db.sales.reduce((x,s)=>x+Number(s.qty||0)*Number(s.buy||db.cfg.buy),0);
 const exp=db.exp.reduce((x,e)=>x+Number(e.amount||0),0);
 return {rev,cost,exp,gross:rev-cost,net:rev-cost-exp,qty:db.sales.reduce((x,s)=>x+Number(s.qty||0),0)}
}
function page(p){
 const a=$('app');
 if(p==='dash'){
  const t=totals();
  a.innerHTML=`<div class="card"><h3>Dashboard</h3><div class="grid">
  <div class="stat">Uang Masuk<br><b>${rp(t.rev)}</b></div>
  <div class="stat">Uang Keluar<br><b>${rp(t.exp)}</b></div>
  <div class="stat">Laba Kotor<br><b>${rp(t.gross)}</b></div>
  <div class="stat">Laba Bersih<br><b>${rp(t.net)}</b></div>
  <div class="stat">Terjual<br><b>${t.qty} galon</b></div>
  <div class="stat">Stok Isi<br><b>${db.stock.isi} galon</b></div>
  </div><div class="notice">Stok awal aplikasi: <b>20 galon</b>. Setiap penjualan otomatis mengurangi stok.</div></div>
  <div class="card"><h3>Transaksi Terakhir</h3>${lastTransactions()}</div>`;
 }else if(p==='jual'){
  a.innerHTML=`<div class="card"><h3>Input Penjualan</h3>
  <div class="muted">Stok tersedia: <b>${db.stock.isi} galon</b> • Harga jual default: <b>${rp(db.cfg.sell)}</b></div>
  <input id="name" placeholder="Nama Pelanggan">
  <input id="wa" type="tel" inputmode="numeric" placeholder="WhatsApp (628...)">
  <input id="qty" type="number" min="1" inputmode="numeric" placeholder="Jumlah Galon" oninput="calc()">
  <input id="price" type="number" inputmode="numeric" value="${db.cfg.sell}" oninput="calc()">
  <input id="total" readonly placeholder="Total">
  <select id="status"><option value="lunas">Lunas</option><option value="piutang">Piutang</option></select>
  <button class="btn" type="button" onclick="sale()">Simpan Transaksi</button></div>
  <div class="card"><h3>5 Transaksi Terakhir</h3>${lastSales()}</div>`;
 }else if(p==='piutang'){
  const list=db.sales.filter(s=>s.status==='piutang');
  a.innerHTML=`<div class="card"><h3>Piutang</h3>${list.map(s=>`<div style="padding:12px 0;border-bottom:1px solid var(--line)"><b>${esc(s.name)}</b> <span class="badge piutang">BELUM LUNAS</span><br>${s.qty} galon — ${rp(s.total)}<br><button class="btn" type="button" onclick="lunas(${s.id})">Set Lunas</button>${s.wa?`<button class="btn green" type="button" onclick="tagih(${s.id})">Tagih WhatsApp</button>`:''}</div>`).join('')||'Tidak ada piutang.'}</div>`;
 }else if(p==='stok'){
  a.innerHTML=`<div class="card"><h3>Stok Galon</h3><div class="grid"><div class="stat">Isi<br><b>${db.stock.isi}</b></div><div class="stat">Kosong<br><b>${db.stock.kosong}</b></div></div>
  <input id="addstock" type="number" min="1" inputmode="numeric" placeholder="Tambah galon isi"><button class="btn" type="button" onclick="addStock()">Tambah Stok</button></div>
  <div class="card"><h3>Uang Keluar</h3><input id="exname" placeholder="Keterangan"><input id="examount" type="number" inputmode="numeric" placeholder="Nominal"><button class="btn red" type="button" onclick="expense()">Simpan Pengeluaran</button></div>
  <div class="card"><h3>Ringkasan</h3><div class="grid"><div class="stat">Modal/galon<br><b>${rp(db.cfg.buy)}</b></div><div class="stat">Jual/galon<br><b>${rp(db.cfg.sell)}</b></div></div></div>`;
 }else{
  a.innerHTML=`<div class="card"><h3>Pengaturan</h3>
  <input id="shop" value="${esc(db.cfg.name)}" placeholder="Nama Toko">
  <input id="sell" type="number" inputmode="numeric" value="${db.cfg.sell}">
  <input id="buy" type="number" inputmode="numeric" value="${db.cfg.buy}">
  <button class="btn" type="button" onclick="config()">Simpan Pengaturan</button>
  <button class="btn" type="button" onclick="backup()">Backup Data JSON</button>
  <button class="btn red" type="button" onclick="resetDB()">Reset Data</button>
  <p class="muted">Harga jual: ${rp(db.cfg.sell)} • Harga beli: ${rp(db.cfg.buy)} • Laba/galon: ${rp(db.cfg.sell-db.cfg.buy)}</p></div>`;
 }
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lastSales(){return db.sales.slice(-5).reverse().map(s=>`${date(s.date)} — ${esc(s.name)} — ${s.qty} galon — ${rp(s.total)} <span class="badge ${s.status}">${s.status}</span>`).join('<hr>')||'Belum ada transaksi.'}
function lastTransactions(){
 const arr=[...db.sales.map(s=>({d:s.date,t:'Masuk',n:s.name,v:s.total})),...db.exp.map(e=>({d:e.date,t:'Keluar',n:e.name,v:e.amount}))].sort((a,b)=>new Date(b.d)-new Date(a.d)).slice(0,5);
 return arr.map(x=>`<div class="row"><span>${date(x.d)}<br><span class="muted">${esc(x.n)}</span></span><b>${x.t==='Masuk'?'+':'−'}${rp(x.v)}</b></div><hr>`).join('')||'Belum ada transaksi.';
}
function calc(){const q=Number($('qty')?.value||0),p=Number($('price')?.value||0);if($('total'))$('total').value=rp(q*p)}
function sale(){
 const q=Number($('qty').value||0),p=Number($('price').value||0);
 if(q<1)return alert('Isi jumlah galon.');
 if(q>db.stock.isi)return alert('Stok tidak cukup. Stok tersedia '+db.stock.isi+' galon.');
 db.sales.push({id:Date.now(),date:new Date().toISOString(),name:$('name').value.trim()||'Umum',wa:$('wa').value.trim(),qty:q,buy:Number(db.cfg.buy),price:p,total:q*p,status:$('status').value});
 db.stock.isi-=q;save();alert('Penjualan berhasil. Stok tersisa '+db.stock.isi+' galon.');page('dash');
}
function lunas(id){const s=db.sales.find(x=>x.id===id);if(s){s.status='lunas';save();page('piutang')}}
function tagih(id){const s=db.sales.find(x=>x.id===id);if(s&&s.wa)location.href='https://wa.me/'+s.wa+'?text='+encodeURIComponent('Halo '+s.name+', tagihan TOKO SIGER sebesar '+rp(s.total)+' belum dibayar. Terima kasih.')}
function addStock(){const n=Number($('addstock').value||0);if(n<1)return alert('Isi jumlah stok.');db.stock.isi+=n;save();alert('Stok berhasil ditambah. Stok sekarang '+db.stock.isi+' galon.');page('stok')}
function expense(){const n=$('exname').value.trim()||'Pengeluaran',a=Number($('examount').value||0);if(a<1)return alert('Isi nominal.');db.exp.push({id:Date.now(),date:new Date().toISOString(),name:n,amount:a});save();alert('Pengeluaran tersimpan.');page('dash')}
function config(){db.cfg.name=$('shop').value.trim()||'TOKO SIGER';db.cfg.sell=Number($('sell').value)||21000;db.cfg.buy=Number($('buy').value)||18500;save();alert('Pengaturan tersimpan.');page('menu')}
function backup(){const b=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),x=document.createElement('a');x.href=u;x.download='backup-toko-siger.json';document.body.appendChild(x);x.click();x.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
function resetDB(){if(confirm('Hapus semua transaksi dan kembalikan stok menjadi 20 galon?')){localStorage.removeItem(KEY);location.reload()}}
function dark(){document.body.classList.toggle('dark');localStorage.setItem('TOKO_SIGER_DARK',document.body.classList.contains('dark')?'1':'0')}
if(localStorage.getItem('TOKO_SIGER_DARK')==='1')document.body.classList.add('dark');
save();page('dash');
