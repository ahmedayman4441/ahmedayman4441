;(function(){
  // Expiry Daemon - standalone script
  const PRODUCTS_KEY = 'sales_app_products';
  const LOG_EL = document.getElementById('log');
  const TBODY = document.querySelector('#products-table tbody');

  function log(msg){
    const time = new Date().toLocaleString();
    LOG_EL.innerText = `[${time}] ${msg}\n` + LOG_EL.innerText;
  }

  function loadProducts(){
    try{
      const raw = localStorage.getItem(PRODUCTS_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      log('خطأ في قراءة منتجات المخزن: ' + e.message);
      return [];
    }
  }

  function saveProducts(list){
    try{
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    }catch(e){
      log('خطأ في حفظ منتجات المخزن: ' + e.message);
    }
  }

  function parseDateISO(s){
    if(!s) return null;
    const d = new Date(s);
    if(isNaN(d.getTime())) return null;
    d.setHours(0,0,0,0);
    return d;
  }

  function isExpired(dateStr){
    const d = parseDateISO(dateStr);
    if(!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    return d.getTime() <= today.getTime();
  }

  function checkAndApply(){
    const products = loadProducts();
    let changed = false;

    const today = new Date(); today.setHours(0,0,0,0);

    for(let p of products){
      const exp = parseDateISO(p.expiryDate);

      // if expiry date exists and is expired -> block
      if(exp && exp.getTime() <= today.getTime()){
        if(!p.__expiry_blocked){
          p.__expiry_blocked = true;
          p.__expiry_blocked_at = new Date().toISOString();
          p.__expiry_original_stock = typeof p.stock === 'number' ? p.stock : 0;
          p.stock = 0;
          changed = true;
          log(`تم حظر الصنف ${p.id} - ${p.name} (تاريخ الانتهاء ${p.expiryDate})`);
        }
      } else {
        // not expired
        if(p.__expiry_blocked){
          // if user corrected expiry to a valid future date -> restore
          if(exp && exp.getTime() > today.getTime()){
            const original = (typeof p.__expiry_original_stock === 'number') ? p.__expiry_original_stock : 0;
            p.stock = original;
            delete p.__expiry_blocked;
            delete p.__expiry_blocked_at;
            delete p.__expiry_original_stock;
            changed = true;
            log(`تم إعادة تفعيل الصنف ${p.id} - ${p.name} بعد تعديل تاريخ الانتهاء إلى ${p.expiryDate}`);
          } else {
            // If expiry removed (no date) or still invalid, keep blocked
            // Keep existing block until corrected by authorized edit
          }
        }
      }
    }

    if(changed) saveProducts(products);
    renderTable();
  }

  function renderTable(){
    const products = loadProducts();
    TBODY.innerHTML = '';
    const today = new Date(); today.setHours(0,0,0,0);

    for(const p of products){
      const tr = document.createElement('tr');
      const exp = parseDateISO(p.expiryDate);
      const expired = exp ? (exp.getTime() <= today.getTime()) : false;
      const status = p.__expiry_blocked ? 'محظور: منتهي/تاريخ خاطئ' : (expired ? 'منتهي' : (exp ? 'صالحة' : 'غير مسجل'));

      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.expiryDate || '-'}</td>
        <td>${p.stock}</td>
        <td>${status}</td>
        <td>
          <button data-id="${p.id}" class="force-unblock">إعادة تفعيل يدوي</button>
          <button data-id="${p.id}" class="force-block">حظر يدوي</button>
        </td>
      `;

      TBODY.appendChild(tr);
    }
  }

  // Manual actions
  function forceUnblock(id){
    const products = loadProducts();
    const p = products.find(x=>x.id===id);
    if(!p) return log('لم يتم العثور على المنتج '+id);
    if(p.__expiry_blocked){
      const original = (typeof p.__expiry_original_stock === 'number') ? p.__expiry_original_stock : 0;
      p.stock = original;
      delete p.__expiry_blocked; delete p.__expiry_blocked_at; delete p.__expiry_original_stock;
      saveProducts(products);
      log(`تمت إعادة التفعيل يدويا للصنف ${id}`);
      renderTable();
    } else {
      log(`الصنف ${id} ليس محظوراً`);
    }
  }

  function forceBlock(id){
    const products = loadProducts();
    const p = products.find(x=>x.id===id);
    if(!p) return log('لم يتم العثور على المنتج '+id);
    if(!p.__expiry_blocked){
      p.__expiry_blocked = true;
      p.__expiry_blocked_at = new Date().toISOString();
      p.__expiry_original_stock = typeof p.stock === 'number' ? p.stock : 0;
      p.stock = 0;
      saveProducts(products);
      log(`تم حظر الصنف يدوياً ${id}`);
      renderTable();
    } else {
      log(`الصنف ${id} محظور بالفعل`);
    }
  }

  // Attach events
  document.getElementById('run-scan').addEventListener('click', ()=>{ checkAndApply(); log('فحص فوري أنجز'); });
  document.getElementById('refresh-view').addEventListener('click', ()=>{ renderTable(); log('تحديث العرض') });

  let intervalId = null;
  function startService(){
    if(intervalId) return;
    const sec = parseInt(document.getElementById('interval-sec').value) || 30;
    intervalId = setInterval(checkAndApply, sec*1000);
    document.getElementById('start-stop').innerText = 'إيقاف الخدمة (تشغيل)';
    log('تم بدء خدمة المراقبة كل ' + sec + ' ثانية');
  }
  function stopService(){
    if(!intervalId) return;
    clearInterval(intervalId); intervalId = null;
    document.getElementById('start-stop').innerText = 'بدء الخدمة (تشغيل)';
    log('تم إيقاف خدمة المراقبة');
  }

  document.getElementById('start-stop').addEventListener('click', ()=>{
    if(intervalId) stopService(); else startService();
  });

  // Delegate table button clicks
  document.querySelector('#products-table').addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    if(btn.classList.contains('force-unblock')) forceUnblock(id);
    if(btn.classList.contains('force-block')) forceBlock(id);
  });

  // Initial render
  renderTable();
  log('أداة المراقبة جاهزة. اضغط "تشغيل الفحص الآن" أو شغّل الخدمة.');

  // Expose for debugging
  window.__expiryDaemon = { checkAndApply, loadProducts, saveProducts, forceBlock, forceUnblock };

})();
