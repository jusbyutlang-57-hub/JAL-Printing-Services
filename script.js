var FB_ID = "JALPrintingServices";
var EMAIL = "garadon90@gmail.com";
var REVIEWS_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT35APsroBL2D6zoAkVcwBb3vwz2kKI0AbgXi69BiWoe0Et1_ds1Ez2qJMDAmdQ6IJm7xZjTRU41ST_/pub?gid=913573391&single=true&output=csv";
var FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeDuwS7VRbY7i_gaHWLp3GT9NlKUASBOoQDwS8P4TMcY9PUsQ/formResponse";
// =====================
var MSG = "https://m.me/" + FB_ID;
["msgr","msgr2","msgr3","msgr4"].forEach(function(i){
  var el=document.getElementById(i); if(el) el.href=MSG;
});

var pages=["home","services","about","reviews","contact","quote"];

function setHH(){
  var h=document.querySelector("header");
  var sticky=h&&getComputedStyle(h).position==="sticky";
  document.documentElement.style.setProperty("--hh",(sticky?h.offsetHeight:0)+"px");
}
function toTop(){window.scrollTo({top:0,left:0,behavior:"instant"})}

function route(){
  var h=(location.hash||"#home").slice(1); if(pages.indexOf(h)<0)h="home";
  pages.forEach(function(p){document.getElementById(p).classList.toggle("on",p===h)});
  document.querySelectorAll("nav a").forEach(function(a){
    if(a.dataset.p===h)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  setHH();
  toTop();
  requestAnimationFrame(toTop);
}

if("scrollRestoration" in history)history.scrollRestoration="manual";
window.addEventListener("hashchange",route);
window.addEventListener("resize",setHH);
window.addEventListener("load",route);
route();

function v(id){return document.getElementById(id).value.trim()}

/* ---------- QUOTE FORM ---------- */
var fi=document.getElementById("f");
fi.addEventListener("change",function(){
  document.getElementById("fn").textContent=fi.files[0]?"Selected: "+fi.files[0].name+". Attach it in Messenger on the next step.":"";
});

var text="";
document.getElementById("qf").addEventListener("submit",function(e){
  e.preventDefault();
  var ok=true;
  document.getElementById("en").textContent=v("n")?"":(ok=false,"Enter your name.");
  document.getElementById("ep").textContent=/\d{7,}/.test(v("p").replace(/\D/g,""))?"":(ok=false,"Enter a valid mobile number.");
  if(!ok)return;
  text="QUOTE REQUEST - JAL Printing Services\n"+
   "Name: "+v("n")+"\nMobile: "+v("p")+"\nService: "+v("s")+
   "\nQuantity: "+(v("q")||"-")+"\nSize: "+(v("z")||"-")+"\nNeeded by: "+(v("d")||"-")+
   "\nDetails: "+(v("m")||"-")+"\nArtwork file: "+(fi.files[0]?fi.files[0].name+" (attached in chat)":"none");
  document.getElementById("sum").textContent=text;
  var box=document.getElementById("ok");box.classList.add("show");box.focus();
  copy();
});
function copy(){try{navigator.clipboard.writeText(text)}catch(err){}}
document.getElementById("cp").addEventListener("click",function(){copy();this.textContent="Copied"});

/* ---------- FEEDBACK FORM (sends to Google Form) ---------- */
var rt="";

function showReviewResult(sent){
  document.getElementById("rtitle").textContent=sent?"Thank You for Your Feedback!":"We Could Not Send It Automatically";
  document.getElementById("rtext").textContent=sent
    ?"We received your review. You can also send a copy by Messenger or email if you like."
    :"Please send it to us on Messenger or by email using the buttons below. Your review is copied, so you can paste it.";
  var box=document.getElementById("rok");box.classList.add("show");box.focus();
}

document.getElementById("rf").addEventListener("submit",function(e){
  e.preventDefault();
  var form=this;
  var rate=document.querySelector('input[name="rate"]:checked');
  var ok=true;
  document.getElementById("er").textContent=rate?"":(ok=false,"Choose a star rating.");
  document.getElementById("ec").textContent=v("rc")?"":(ok=false,"Write a short comment.");
  if(!ok)return;

  rt="REVIEW - JAL Printing Services\n"+
   "Name: "+(v("rn")||"Anonymous")+"\nService: "+v("rs")+
   "\nRating: "+rate.value+" / 5\nComment: "+v("rc")+
   "\nOK to show on website: "+(document.getElementById("rp").checked?"Yes":"No");
  document.getElementById("rsum").textContent=rt;
  document.getElementById("rmail").href="mailto:"+EMAIL+"?subject="+encodeURIComponent("Customer review")+"&body="+encodeURIComponent(rt);
  try{navigator.clipboard.writeText(rt)}catch(err){}

  var data=new URLSearchParams();
  data.append("entry.1432666575",v("rn"));
  var svc=v("rs");
  if(svc==="Other"){
    data.append("entry.1534820048","__other_option__");
    data.append("entry.1534820048.other_option_response","Other");
  } else {
    data.append("entry.1534820048",svc);
  }
  data.append("entry.688939052",rate.value);
  data.append("entry.142515444",v("rc"));

  var btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;btn.textContent="Sending...";
  fetch(FORM_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:data})
    .then(function(){showReviewResult(true);form.reset()})
    .catch(function(){showReviewResult(false)})
    .then(function(){btn.disabled=false;btn.textContent="Send my Feedback"});
});

/* ---------- LIVE REVIEWS FROM GOOGLE SHEET ---------- */
function parseCSV(t){
  var rows=[],row=[],f="",q=false;
  for(var i=0;i<t.length;i++){
    var c=t[i];
    if(q){
      if(c==='"'){ if(t[i+1]==='"'){f+='"';i++;} else q=false; }
      else f+=c;
    } else if(c==='"') q=true;
    else if(c===","){row.push(f);f="";}
    else if(c==="\n"||c==="\r"){
      if(c==="\r"&&t[i+1]==="\n")i++;
      row.push(f);f="";rows.push(row);row=[];
    } else f+=c;
  }
  if(f||row.length){row.push(f);rows.push(row);}
  return rows;
}

function loadReviews(){
  var list=document.getElementById("reviewList");
  if(!list||REVIEWS_CSV.indexOf("PASTE_")===0||REVIEWS_CSV.indexOf("/edit")>-1)return;
  fetch(REVIEWS_CSV+(REVIEWS_CSV.indexOf("?")>-1?"&":"?")+"t="+Date.now())
    .then(function(r){return r.text()})
    .then(function(txt){
      var rows=parseCSV(txt);
      if(rows.length<2)return;
      var head=rows[0].map(function(h){return h.toLowerCase()});
      function col(k){for(var i=0;i<head.length;i++){if(head[i].indexOf(k)>-1)return i}return -1}
      var iN=col("name"),iS=col("service"),iR=col("rating"),iC=col("comment"),iA=col("approved");
      var shown=0;
      list.innerHTML="";
      rows.slice(1).reverse().forEach(function(r){
        if(iA>-1&&(r[iA]||"").trim().toLowerCase()!=="yes")return;
        if(iC<0||!r[iC])return;
        var n=Math.max(1,Math.min(5,parseInt(r[iR])||5));
        var card=document.createElement("div");card.className="card";
        var st=document.createElement("p");st.className="stars";
        st.textContent="★".repeat(n)+"☆".repeat(5-n);
        var cm=document.createElement("p");cm.textContent=r[iC];
        var who=document.createElement("p");who.className="who";
        who.textContent=(r[iN]||"Anonymous")+(r[iS]?" · "+r[iS]:"");
        card.appendChild(st);card.appendChild(cm);card.appendChild(who);
        list.appendChild(card);shown++;
      });
      if(!shown)list.innerHTML='<p class="note">No Reviews Yet. Be the first to share your experience.</p>';
    })
    .catch(function(){});
}
loadReviews();

/* ---------- LIVE OPEN / CLOSED STATUS (Philippine time) ---------- */
function updateHoursStatus(){
  var el=document.getElementById("hoursStatus"); if(!el)return;
  var pill=document.querySelector(".hours");
  var parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Manila",weekday:"short",hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(new Date());
  var wd="",h=0,m=0;
  parts.forEach(function(p){
    if(p.type==="weekday")wd=p.value;
    if(p.type==="hour")h=parseInt(p.value,10);
    if(p.type==="minute")m=parseInt(p.value,10);
  });
  // TEST MODE: add ?t=Mon-14:30 to the address to fake the day and time
  var tt=(location.search.match(/[?&]t=(Sun|Mon|Tue|Wed|Thu|Fri|Sat)-(\d{1,2}):(\d{2})/i)||[]);
  if(tt.length){
    wd=tt[1].charAt(0).toUpperCase()+tt[1].slice(1).toLowerCase();
    h=parseInt(tt[2],10);
    m=parseInt(tt[3],10);
  }
  var days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var idx=days.indexOf(wd);
  function openH(i){return (i===0||i===6)?9:8}
  function closeH(i){return (i===0||i===6)?18:20}
  function fmt(hr){return (hr>12?hr-12:hr)+":00 "+(hr>=12?"PM":"AM")}
  var mins=h*60+m, isOpen, msg;
  if(mins>=openH(idx)*60&&mins<closeH(idx)*60){
    isOpen=true;  msg="Open Now · Closes at "+fmt(closeH(idx));
  } else if(mins<openH(idx)*60){
    isOpen=false; msg="Closed Right Now · Opens Today at "+fmt(openH(idx));
  } else {
    isOpen=false; msg="Closed Right Now · Opens Tomorrow at "+fmt(openH((idx+1)%7));
  }
  el.className="hours-status "+(isOpen?"is-open":"is-closed");
  el.innerHTML='<span class="sdot"></span>'+msg;
  if(pill)pill.classList.toggle("closed",!isOpen);
}
updateHoursStatus();
setInterval(updateHoursStatus,60000);