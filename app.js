(() => {
 "use strict";
 const $ = (s,root=document) => root.querySelector(s);
 const $$ = (s,root=document) => [...root.querySelectorAll(s)];
 const SERVICES = window.SITE_SERVICES || [];
 const REQUESTS_KEY = "temnolese_requests_v1";
 const USERS_KEY = "temnolese_demo_users_v1";
 const SESSION_KEY = "temnolese_demo_session_v1";
 const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const readJSON = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
 const getRequests = () => readJSON(REQUESTS_KEY,[]);
 const saveRequests = rows => localStorage.setItem(REQUESTS_KEY,JSON.stringify(rows));
 const getUsers = () => readJSON(USERS_KEY,[]);
 const saveUsers = rows => localStorage.setItem(USERS_KEY,JSON.stringify(rows));
 const session = () => sessionStorage.getItem(SESSION_KEY) || "";
 const loginKey = value => String(value || "").trim().toLocaleLowerCase("ru-RU");
 const localDate = (date=new Date()) => { const d=new Date(date.getTime()-date.getTimezoneOffset()*60000); return d.toISOString().slice(0,10); };

 function renderShell(){
   const page = location.pathname.split("/").pop() || "index.html";
   const nav = [
     ["index.html","Главная","i-home","nav-home"],
     ["alexandra.html","Услуги","i-forest","nav-forest"],
     ["about.html","Александра","i-user","nav-user"],
     ["booking.html","Запись","i-booking","nav-booking"],
     ["account.html","Кабинет","i-user","nav-user"]
   ];
   const header = $("#siteHeader");
   if(header) header.innerHTML = '<header class="header"><a class="brand" href="index.html"><span class="brand-mark">✧</span><span><b>ТЕМНОЛЕСЬЕ</b><small>АВТОРСКОЕ ПРОСТРАНСТВО</small></span></a><button class="menu-toggle" aria-label="Открыть меню" aria-expanded="false">☰</button><nav class="nav">'+nav.map(([url,label,icon,art])=>'<a href="'+url+'" class="nav-link '+(page===url?'active':'')+'"><span class="nav-art '+art+'"><svg aria-hidden="true"><use href="assets/icons.svg#'+icon+'"/></svg></span><span>'+label+'</span></a>').join("")+'</nav></header>';
   const footer = $("#siteFooter");
   if(footer) footer.innerHTML = '<footer class="footer"><a class="brand" href="index.html"><span class="brand-mark">✧</span><span><b>ТЕМНОЛЕСЬЕ</b><small>АВТОРСКОЕ ПРОСТРАНСТВО</small></span></a><p>Александра · Темнолесье</p><div class="footer-links"><a href="https://t.me/witchwood" target="_blank" rel="noopener">Telegram ↗</a><a href="booking.html">Оставить заявку ↗</a><a href="account.html">Личный кабинет ↗</a></div></footer>';
   const menu=$("#siteHeader .menu-toggle"), menuNav=$("#siteHeader .nav");
   if(menu&&menuNav){
     menu.addEventListener("click",()=>{
       const open=menuNav.classList.toggle("open");
       menu.setAttribute("aria-expanded",String(open));
       menu.textContent=open?"×":"☰";
     });
     $$(".nav-link",menuNav).forEach(link=>link.addEventListener("click",()=>{
       menuNav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰";
     }));
   }
 }
 function setupTransitions(){
   document.addEventListener("click",event=>{
     if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
     const link=event.target.closest("a[href]");
     if(!link||link.target==="_blank"||link.hasAttribute("download"))return;
     const href=link.getAttribute("href");
     if(!href||href.startsWith("#")||href.startsWith("mailto:")||href.startsWith("tel:"))return;
     let target;
     try{target=new URL(href,location.href)}catch{return}
     if(target.origin!==location.origin||!target.pathname.endsWith(".html"))return;
     if(target.pathname===location.pathname&&target.search===location.search)return;
     event.preventDefault();
     document.body.classList.add("page-leaving");
     window.setTimeout(()=>{location.href=target.href;},220);
   });
 }
 function setupReveal(){
   const items=$$(".reveal");
   if(!("IntersectionObserver" in window)){items.forEach(el=>el.classList.add("is-visible"));return;}
   const observer=new IntersectionObserver(entries=>{
     entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}});
   },{threshold:.12});
   items.forEach(el=>observer.observe(el));
 }
 function setupBooking(){
   const form=$("#bookingForm");
   if(!form)return;
   const select=$("#bookingService"), date=$("#bookingDate");
   const params=new URLSearchParams(location.search);
   const groups=new Map();
   SERVICES.forEach(service=>{
     if(!groups.has(service.group))groups.set(service.group,[]);
     groups.get(service.group).push(service);
   });
   select.innerHTML='<option value="">Выберите услугу</option>'+[...groups.entries()].map(([group,rows])=>'<optgroup label="'+esc(group)+'">'+rows.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.title)+' · '+esc(item.author)+'</option>').join("")+'</optgroup>').join("");
   if(params.get("service"))select.value=params.get("service");
   function updateSummary(){
     const item=SERVICES.find(row=>row.id===select.value);
     $("#bookingServiceInfo").textContent=item ? item.summary+" Цена: "+item.price+" Формат: "+item.format : "Выберите услугу, чтобы увидеть описание и условия.";
   }
   select.addEventListener("change",updateSummary);updateSummary();
   if(date){
     date.min=localDate();
     date.addEventListener("focus",()=>date.min=localDate());
     date.addEventListener("change",()=>date.setCustomValidity(date.value&&date.value<date.min?"Выберите сегодняшнюю или будущую дату.":""));
     $("#calendarTrigger")?.addEventListener("click",()=>{
       date.min=localDate();
       try{if(date.showPicker)date.showPicker();else{date.focus();date.click();}}catch{date.focus();date.click();}
     });
   }
   let step=1;
   const showStep = next => {
     step=next;
     $$(".booking-step").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===step));
     $$("[data-step-indicator]").forEach(el=>el.classList.toggle("active",Number(el.dataset.stepIndicator)<=step));
     $(".booking-step.active h2")?.scrollIntoView({behavior:"smooth",block:"nearest"});
   };
   $$("[data-next]").forEach(button=>button.addEventListener("click",()=>{
     for(const field of $$(".booking-step.active [required]")) if(!field.reportValidity())return;
     if(step===2&&date&&date.value&&date.value<localDate()){date.setCustomValidity("Выберите сегодняшнюю или будущую дату.");date.reportValidity();return;}
     if(step<3)showStep(step+1);
   }));
   $$("[data-prev]").forEach(button=>button.addEventListener("click",()=>showStep(Math.max(1,step-1))));
   form.addEventListener("submit",event=>{
     event.preventDefault();
     for(const field of $('.booking-step.active [required]')) if(!field.reportValidity())return;
     const emailField=$('#bookingEmail');
     if(emailField&&emailField.value&&!emailField.reportValidity())return;
     const service=SERVICES.find(row=>row.id===select.value);
     if(!service)return;
     if(date&&date.value&&date.value<localDate()){showStep(2);date.setCustomValidity("Выберите сегодняшнюю или будущую дату.");date.reportValidity();return;}
     const owner=session();
     const request={
       id:"TM-"+Date.now().toString(36).toUpperCase(),
       serviceId:service.id,service:service.title,author:service.author,price:service.price,
       date:date?.value||"",time:$("#bookingTime").value,zone:$("#bookingZone").value.trim(),
       name:$("#bookingName").value.trim(),contact:$("#bookingContact").value.trim(),
       email:$("#bookingEmail").value.trim(),comment:$("#bookingComment").value.trim(),
       ownerUsername:owner||null,status:"Новая заявка",createdAt:new Date().toISOString()
     };
     const rows=getRequests();rows.push(request);saveRequests(rows);
     form.hidden=true;
     $("#bookingSuccess").hidden=false;
     $("#bookingSuccessText").textContent="Заявка № "+request.id+" сохранена в этом браузере. "+(owner?"Она появится в истории вашего личного кабинета.":"После регистрации или входа в этом браузере вы сможете найти заявку, оформив её под тем же именем, что и ваш логин.");
     $("#bookingSuccess").scrollIntoView({behavior:"smooth",block:"center"});
   });
 }
 function bytesToB64(bytes){let binary="";new Uint8Array(bytes).forEach(b=>binary+=String.fromCharCode(b));return btoa(binary);}
 function b64ToBytes(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
 async function makePasswordHash(password,saltValue){
   if(!window.crypto?.subtle)throw new Error("Безопасное хеширование недоступно в этом браузере. Откройте сайт по HTTPS.");
   const salt=saltValue?b64ToBytes(saltValue):crypto.getRandomValues(new Uint8Array(16));
   const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
   const hash=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:120000,hash:"SHA-256"},key,256);
   return {salt:bytesToB64(salt),hash:bytesToB64(hash)};
 }
 function setupAccount(){
   const auth=$("#accountAuth"),dashboard=$("#accountDashboard"),loginForm=$("#loginForm"),registerForm=$("#registerForm");
   if(!auth||!dashboard||!loginForm||!registerForm)return;
   const message=$("#authMessage");
   const say=(text,error=false)=>{message.textContent=text;message.classList.toggle("error",error);};
   const tab=which=>{
     const login=which==="login";
     $("#loginPane").hidden=!login;$("#registerPane").hidden=login;
     $("#showLogin").classList.toggle("active",login);$("#showRegister").classList.toggle("active",!login);say("");
   };
   $("#showLogin").addEventListener("click",()=>tab("login"));
   $("#showRegister").addEventListener("click",()=>tab("register"));
   function showDashboard(username){
     const user=getUsers().find(row=>row.loginKey===loginKey(username));
     if(!user){sessionStorage.removeItem(SESSION_KEY);return false;}
     auth.hidden=true;dashboard.hidden=false;
     $("#accountUserName").textContent=user.username;
     $("#accountUserEmail").textContent=user.email||"Локальный профиль";
     const rows=getRequests().filter(row=>row.ownerUsername===user.loginKey||(!row.ownerUsername&&loginKey(row.name)===user.loginKey));
     $("#accountRequests").innerHTML=rows.length?'<div class="request-list">'+rows.slice().reverse().map(row=>'<article class="request-card"><h4>'+esc(row.service)+'</h4><div class="request-meta"><span>'+esc(row.author)+'</span><span>'+esc(row.date||"Дата не выбрана")+' '+esc(row.time||"")+'</span><span>'+esc(row.id)+'</span></div><span class="request-status">'+esc(row.status)+'</span></article>').join("")+'</div>':'<div class="empty-state">Пока нет заявок, привязанных к этому профилю.<br><a class="text-link" href="booking.html">Оформить первую заявку ↗</a></div>';
     return true;
   }
   registerForm.addEventListener("submit",async event=>{
     event.preventDefault();say("");
     const username=$("#registerUsername").value.trim(), key=loginKey(username);
     const email=$("#registerEmail").value.trim(), password=$("#registerPassword").value;
     if(username.length<3){say("Логин должен содержать не менее 3 символов.",true);return;}
     if(password.length<8){say("Пароль должен содержать не менее 8 символов.",true);return;}
     if(password!==$("#registerPasswordRepeat").value){say("Пароли не совпадают.",true);return;}
     const users=getUsers();
     if(users.some(row=>row.loginKey===key)){say("Такой логин уже зарегистрирован в этом браузере.",true);return;}
     try{
       const encoded=await makePasswordHash(password);
       users.push({username,loginKey:key,email,salt:encoded.salt,passwordHash:encoded.hash,createdAt:new Date().toISOString()});
       saveUsers(users);sessionStorage.setItem(SESSION_KEY,key);showDashboard(key);
     }catch(error){say(error.message||"Не удалось создать аккаунт.",true);}
   });
   loginForm.addEventListener("submit",async event=>{
     event.preventDefault();say("");
     const key=loginKey($("#loginUsername").value),password=$("#loginPassword").value;
     const user=getUsers().find(row=>row.loginKey===key);
     if(!user){say("Профиль с таким логином не найден в этом браузере.",true);return;}
     try{
       const encoded=await makePasswordHash(password,user.salt);
       if(encoded.hash!==user.passwordHash){say("Неверный логин или пароль.",true);return;}
       sessionStorage.setItem(SESSION_KEY,key);showDashboard(key);
     }catch(error){say(error.message||"Не удалось выполнить вход.",true);}
   });
   $("#accountLogout").addEventListener("click",()=>{sessionStorage.removeItem(SESSION_KEY);dashboard.hidden=true;auth.hidden=false;loginForm.reset();tab("login");});
   if(session()&&!showDashboard(session()))tab("login");
 }
 renderShell();setupTransitions();setupReveal();setupBooking();setupAccount();
 requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.add("page-ready")));
})();